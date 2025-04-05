# System Patterns: FantasyAI

## 1. Architecture Overview

-   **Client-Server:** React Native mobile client communicates with a Supabase backend.
-   **Data Flow:** Client components interact with Supabase (database, auth) primarily via service modules. User interactions trigger updates back to Supabase.
-   **External API Integration:** Supabase Edge Functions act as secure proxies for calling external APIs (e.g., OpenRouter) to protect sensitive credentials.

## 2. Key Technical Decisions

-   **Backend as a Service (BaaS):** Supabase provides database, authentication, storage, and serverless functions (Edge Functions).
-   **Cross-Platform Mobile:** React Native allows for a single codebase for iOS and Android.
-   **Secure API Key Management:** Sensitive keys (like OpenRouter's) are stored in Supabase Vault and accessed only by Edge Functions.

## 3. Design Patterns

-   **Service Layer:** Encapsulates data access logic for Supabase database interactions (e.g., `userService`, `conversationService`).
-   **Context API:** Used for managing global state like authentication (`AuthContext`) and theme (`ThemeContext`).
-   **Functional Components:** Preferred React component style.
-   **Backend Proxy (via Edge Functions):** Used to securely interact with external APIs (like OpenRouter) from the backend, abstracting complexity and protecting credentials from the client.
-   **Realtime Subscriptions:** Supabase Realtime is used to push updates (e.g., new messages) from the backend to the client.

*(More details on specific patterns and component relationships can be added as the project evolves.)*