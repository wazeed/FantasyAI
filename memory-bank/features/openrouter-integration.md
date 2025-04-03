# Feature: OpenRouter Integration for Voice and Image Input

## 1. Goal

Integrate OpenRouter API to allow users to send voice recordings and images as input within the FantasyAI chat interface. The chosen multimodal model will process this input directly.

## 2. Chosen Model

-   **Provider:** DeepSeek (via OpenRouter)
-   **Model Identifier:** `deepseek/deepseek-chat` (Assumption based on user input "deepseek r1 free model"; verify identifier if issues arise). OpenRouter handles routing to the appropriate version.
-   **Capabilities:** Multimodal (Text, Image, Audio - *Audio format needs verification*).

## 3. Architecture

```mermaid
flowchart TD
    subgraph Mobile Client (React Native)
        direction LR
        A[ChatScreen UI] -- Record/Select --> B(expo-av / expo-image-picker)
        B -- Media File --> C(Convert to Base64)
        C -- Base64 Data --> D[Call Supabase Function]
    end

    subgraph Supabase Backend
        direction LR
        D --> E{Edge Function: /openrouter-proxy}
        E -- Secure API Call --> F[OpenRouter API]
        F -- Response --> E
        E -- Processed Response --> G[Save to DB: messages table]
    end

    subgraph External API
        F --> H(OpenRouter /chat/completions)
    end

    G --> A[Update UI via Realtime]
```

-   **Client:** Handles media capture (audio recording, image picking) and conversion to Base64.
-   **Supabase Edge Function (`openrouter-proxy`):** Acts as a secure proxy.
    -   Retrieves the OpenRouter API key from Supabase Vault.
    -   Receives user input (text + Base64 media) from the client.
    -   Formats the request for the OpenRouter `/chat/completions` endpoint using the `deepseek/deepseek-chat` model.
    -   Sends the request to OpenRouter.
    -   Receives the response.
    -   Processes the response (extracts text).
    -   Saves the user message (with media reference if needed) and the AI response to the `messages` table in the Supabase database.
-   **OpenRouter:** Processes the multimodal input and returns a text response.
-   **Realtime:** Supabase Realtime updates the client UI with the new AI message.

## 4. API Integration Details

-   **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
-   **Method:** `POST`
-   **Authentication:** `Authorization: Bearer YOUR_OPENROUTER_API_KEY` (Key stored securely in Supabase Vault, accessed only by the Edge Function).
-   **Headers:**
    -   `Content-Type: application/json`
    -   `HTTP-Referer: https://fantasyai.app` (Replace with actual app identifier)
    -   `X-Title: Fantasy AI Chat` (Replace with actual app name)
-   **Request Body (Example):**

```json
{
  "model": "deepseek/deepseek-chat", // Or the verified identifier
  "messages": [
    {
      "role": "system",
      "content": "You are {character.name}. {character.description}..."
    },
    // ... previous chat history messages ...
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "User's text input here (if any)" },
        {
          "type": "image_url", // ASSUMPTION: Used for both image and audio
          "image_url": {
            "url": "data:{mimeType};base64,{base64Data}" // e.g., data:image/jpeg;base64,... or data:audio/mp3;base64,...
          }
        }
        // Add more image_url blocks if multiple media items are sent
      ]
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024 // Adjust as needed
}
```

-   **Audio Format Assumption:** Audio will be sent as a Base64 data URI using the `image_url` content type. This requires verification during implementation/testing against OpenRouter's requirements for the specific DeepSeek model.

## 5. Implementation Steps

### Client-Side (React Native - `components/ChatScreen.tsx`, potentially new hooks/utils)

1.  **UI:**
    -   Implement functional buttons for microphone (record audio) and attachment (pick image/video).
    -   Add UI elements to show "staged" media before sending.
    -   Add loading indicators during media processing and API calls.
    -   Handle permissions for microphone and media library access (`expo-av`, `expo-image-picker`).
2.  **Audio Recording:**
    -   Use `expo-av` `Audio.Recording` to record audio.
    -   Save recording to a temporary file using `expo-file-system`.
    -   Convert the audio file to Base64. Determine appropriate audio format (e.g., mp3, m4a) compatible with the target model.
3.  **Image Picking:**
    -   Use `expo-image-picker` to allow selecting images from the gallery or taking photos.
    -   Implement image compression/resizing to manage payload size.
    -   Convert selected image to Base64.
4.  **API Call:**
    -   Modify the `handleSend` logic:
        -   If media is staged, include its Base64 representation and MIME type.
        -   Call the Supabase Edge Function (`openrouter-proxy`) instead of `fetchAIResponse` directly.
        -   Pass user text, Base64 media data, MIME type, user ID, and character ID to the function.
    -   Clear staged media after sending.
    -   Handle potential errors from the Edge Function call.

### Backend (Supabase)

1.  **API Key:** Store the provided OpenRouter API key securely in Supabase Vault.
2.  **Edge Function (`supabase/functions/openrouter-proxy/index.ts`):**
    -   Create a new Edge Function using Deno/TypeScript.
    -   Retrieve the OpenRouter API key from the Vault.
    -   Validate the incoming request (user authentication, required parameters).
    -   Construct the request payload for the OpenRouter API as specified above.
    -   Make the `fetch` call to `https://openrouter.ai/api/v1/chat/completions`.
    -   Handle the response from OpenRouter.
    -   On success:
        -   Extract the AI's text response.
        -   Use the Supabase client (available in Edge Functions) to call `conversationService.sendMessage` (or directly insert) to save both the user's message (potentially referencing media stored elsewhere if needed, though Base64 might be small enough for direct inclusion if the model requires it) and the AI's response to the `messages` table.
    -   Return appropriate success or error responses to the client.
3.  **Database (`messages` table):** Ensure `image_url` and `audio_url` columns exist (they seem to, based on `conversationService.ts`). Consider if storing the full Base64 is feasible or if media should be uploaded to Supabase Storage and only the URL stored in the message. *Decision: For simplicity initially, rely on sending Base64 directly. Revisit if payload sizes become an issue.*

## 6. Security Considerations

-   **API Key:** MUST be stored securely in Supabase Vault, never exposed on the client.
-   **Authentication:** The Edge Function must verify the user's session before processing requests.
-   **Input Sanitization:** While Base64 is generally safe, ensure no other unexpected inputs are processed by the Edge Function.
-   **Rate Limiting:** Consider implementing rate limiting on the Edge Function (e.g., using Supabase's capabilities or a simple in-memory store for short-term limits) to prevent abuse.

## 7. Open Questions/Verification Needed

-   Confirm the exact OpenRouter identifier for the target DeepSeek vision model.
-   Verify the correct format for sending Base64 audio data to the chosen model via OpenRouter API (`image_url` or other).
-   Determine optimal audio format/encoding for compatibility and size.
-   Decide on image compression/resizing parameters.