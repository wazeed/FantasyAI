// CORS headers configuration
// Allows requests from localhost during development and your specific app domain.

// IMPORTANT: Replace 'YOUR_APP_DOMAIN.COM' with your actual frontend domain if applicable,
// or configure this via environment variables for production.
const allowedOrigins = [
  'http://localhost:8081', // Default Expo Go Metro Bundler port
  'http://localhost:19006', // Default Expo Web port (if used)
  // Add your production app domain here, e.g.:
  // 'https://YOUR_APP_DOMAIN.COM',
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or dynamically set based on request origin check against allowedOrigins
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
};

// Optional: Function to dynamically check origin
/*
export function createCorsResponse(requestOrigin: string | null): HeadersInit {
  let origin = '*'; // Default to wildcard
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    origin = requestOrigin;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
*/