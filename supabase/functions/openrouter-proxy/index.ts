import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming a shared CORS config

// Define the expected request body structure
interface RequestPayload {
  prompt: string;
  imageBase64?: string; // Optional Base64 encoded image string
  audioBase64?: string; // Optional Base64 encoded audio string
  // TODO: Add conversation history if needed by the model/app logic
  // history?: Array<{ role: string; content: any }>;
}

// Define the structure for content parts (text, image, audio)
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

// Define the structure for a message in the OpenRouter payload
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

// Define the expected structure of the OpenRouter API request body
interface OpenRouterRequestBody {
  model: string;
  messages: Message[];
  // Add other parameters like max_tokens, temperature if needed
  // max_tokens?: number;
  // temperature?: number;
}

// Define a simplified structure for the OpenRouter API response
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
      console.log('Request payload received:', { prompt: payload.prompt, hasImage: !!payload.imageBase64, hasAudio: !!payload.audioBase64 });
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(JSON.stringify({ error: 'Bad Request: Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.prompt) {
        console.error('Missing prompt in payload');
        return new Response(JSON.stringify({ error: 'Bad Request: Missing prompt' }), {
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

    // --- Construct OpenRouter Payload ---
    const messages: Message[] = [];
    const contentParts: ContentPart[] = [{ type: 'text', text: payload.prompt }];

    // Add image if provided
    if (payload.imageBase64) {
      // Basic validation: check if it looks like base64
      if (payload.imageBase64.length > 100 && payload.imageBase64.match(/^[A-Za-z0-9+/=]+$/)) {
         // Assuming JPEG format, adjust if needed (e.g., based on client-sent type)
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${payload.imageBase64}` },
        });
        console.log('Added image content part.');
      } else {
         console.warn('Invalid imageBase64 format received.');
         // Optionally return an error or just ignore the invalid data
      }
    }

    // Add audio if provided
    // NOTE: Verify the exact format and capability with the specific OpenRouter model.
    // This assumes a 'data:audio/...' format is accepted similarly to images.
    if (payload.audioBase64) {
       // Basic validation: check if it looks like base64
       if (payload.audioBase64.length > 100 && payload.audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
        // Assuming MP3 format, adjust if needed
        contentParts.push({
          type: 'audio_url', // Using 'audio_url' as a placeholder type
          audio_url: { url: `data:audio/mp3;base64,${payload.audioBase64}` },
        });
        console.log('Added audio content part.');
      } else {
        console.warn('Invalid audioBase64 format received.');
        // Optionally return an error or just ignore the invalid data
      }
    }

    messages.push({ role: 'user', content: contentParts });

    // TODO: Add system prompt or conversation history if applicable
    // messages.unshift({ role: 'system', content: 'You are a helpful assistant.' });
    // if (payload.history) {
    //   messages.unshift(...payload.history);
    // }

    const openRouterPayload: OpenRouterRequestBody = {
      // Using deepseek/deepseek-chat as requested, verify this is the correct/best multimodal model on OpenRouter
      model: 'deepseek/deepseek-chat',
      messages: messages,
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

    // --- Return Success Response ---
    console.log('Sending successful response to client.');
    return new Response(JSON.stringify({ message: assistantMessage }), {
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
