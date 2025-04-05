/// <reference types="https://deno.land/x/deno/cli/types/dts/lib.deno.d.ts" />
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Added .ts extension
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define the structure for content parts (text, image, audio) - Keep as is
interface ContentPart {
  type: 'text' | 'image_url' | 'audio_url'; // Added 'audio_url' based on assumption
  text?: string;
  image_url?: {
    url: string; // e.g., "data:image/jpeg;base64,{base64_string}"
  };
  // NOTE: Assuming OpenRouter accepts audio via a similar structure.
  // Verify the exact format required by the specific OpenRouter model.
  audio_url?: {
    url: string; // e.g., "data:audio/mp3;base64,{base64_string}"
  };
}

// Define the structure for a message in the OpenRouter payload - Keep as is
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

// --- FIX: Update expected request payload structure ---
interface RequestPayload {
  model: string; // Expect model name from client
  messages: Message[]; // Expect messages array from client
  characterId: number; // Expect characterId (as number)
  userId?: string; // Optional userId (for logged-in users)
  conversationId?: string; // Optional conversationId (for logged-in users)
  // Keep media fields if they are still relevant, otherwise remove
  // imageBase64?: string; // Optional Base64 encoded image string
  // audioBase64?: string; // Optional Base64 encoded audio string
}


// Define the expected structure of the OpenRouter API request body - Keep as is
interface OpenRouterRequestBody {
  model: string;
  messages: Message[];
  // Add other parameters like max_tokens, temperature if needed
  // max_tokens?: number;
  // temperature?: number;
}

// Define a simplified structure for the OpenRouter API response - Keep as is
// (Adjust based on the actual response structure you need)
interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    // Add other fields like finish_reason if needed
  }>;
  // Add other fields like usage if needed
}

console.log('OpenRouter Proxy Function Initializing...');

serve(async (req: Request) => {
  // --- CORS Preflight Handling ---
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log(`Handling ${req.method} request`);

    // --- Validate Request Method ---
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Parse Request Body ---
    let payload: RequestPayload;
    try {
      payload = await req.json();
      // Log relevant parts of the received payload
      console.log('Request payload received:', {
          model: payload.model,
          messageCount: payload.messages?.length,
          characterId: payload.characterId,
          userId: payload.userId
      });
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({ error: 'Bad Request: Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- FIX: Validate required fields based on the new structure ---
    if (!payload.model || !payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0 || !payload.characterId) {
        console.error('Missing required fields in payload (model, messages array, characterId)');
        return new Response(JSON.stringify({ error: 'Bad Request: Missing required fields (model, messages, characterId)' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // --- Retrieve API Key from Vault ---
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      console.error('OPENROUTER_API_KEY not found in Supabase Vault.');
      return new Response(JSON.stringify({ error: 'Internal Server Error: API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Retrieved OpenRouter API Key from Vault.');

    // --- FIX: Construct OpenRouter Payload using client's messages ---
    // Directly use the messages array received from the client payload
    const openRouterPayload: OpenRouterRequestBody = {
      model: payload.model, // Use model from client payload
      messages: payload.messages, // Use messages array from client payload
      // max_tokens: 1024, // Example: uncomment and adjust if needed
    };

    console.log('Constructed OpenRouter request payload:', JSON.stringify(openRouterPayload, null, 2));


    // --- Call OpenRouter API ---
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    // IMPORTANT: Replace with your actual site URL and App Name
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:8081'; // Get from env or default
    const appName = Deno.env.get('APP_NAME') || 'FantasyAI'; // Get from env or default

    console.log(`Calling OpenRouter API at ${openRouterUrl} for model ${openRouterPayload.model}`);

    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': appName,
      },
      body: JSON.stringify(openRouterPayload),
    });

    console.log(`OpenRouter API response status: ${response.status}`);

    // --- Handle OpenRouter Response ---
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenRouter API Error (${response.status}): ${errorBody}`);
      return new Response(JSON.stringify({ error: `OpenRouter API Error: ${response.statusText}`, details: errorBody }), {
        status: response.status, // Forward the status code
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseData: OpenRouterResponse = await response.json();
    console.log('Received successful response from OpenRouter.');

    // Extract the relevant part of the response (adjust as needed)
    const assistantMessage = responseData.choices?.[0]?.message?.content;

    if (!assistantMessage) {
        console.error('Could not extract assistant message from OpenRouter response:', responseData);
        return new Response(JSON.stringify({ error: 'Internal Server Error: Invalid response format from AI service' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // --- Save AI Response to Database (Only if userId is present) ---
    if (payload.userId && payload.conversationId && payload.characterId) { // Ensure all required IDs are present
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            global: {
              // Use the Authorization header from the original request to authenticate the client
              headers: { Authorization: req.headers.get('Authorization')! },
            },
            // Important: Use service_role key for server-side operations that need to bypass RLS
            // auth: { persistSession: false, autoRefreshToken: false } // Consider if needed
          }
        );
        // If using service_role key, initialize differently:
        // const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        console.log(`Attempting to save AI message to DB for user: ${payload.userId}, conversation: ${payload.conversationId}`);

        const { error } = await supabaseClient // Or supabaseAdmin if using service role
          .from('messages')
          .insert({
            user_id: payload.userId,
            character_id: payload.characterId,
            conversation_id: payload.conversationId,
            content: assistantMessage,
            sender: 'ai',
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to save AI message to database for user:', payload.userId, error);
          // Continue to return response even if DB fails
        } else {
          console.log('Successfully saved AI message to database for user:', payload.userId);
        }
      } catch (dbError) {
        console.error('Error saving to database for user:', payload.userId, dbError);
        // Continue to return response even if DB fails
      }
    } else {
      console.log('Skipping database save (guest user or missing IDs).');
    }

    // --- Return Success Response ---
    console.log('Sending successful response to client.');
    return new Response(JSON.stringify({ message: assistantMessage }), { // Return the correct structure client expects
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // --- General Error Handling ---
    console.error('Unhandled error in Edge Function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

console.log('OpenRouter Proxy Function Ready.');
