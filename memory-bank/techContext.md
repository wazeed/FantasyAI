# Tech Context: FantasyAI

## 1. Core Technologies

-   **Language:** TypeScript
-   **Framework:** React Native
-   **Backend:** Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
-   **AI Service:** OpenRouter API (via Supabase Edge Function proxy)
-   **State Management:** React Context API (e.g., `AuthContext`)
-   **UI Libraries:** (Need to confirm - potentially native components, or libraries like TailwindCSS/Shadcn if configured for RN)

## 2. Development Setup

-   **Package Manager:** npm (inferred from `package-lock.json`)
-   **Build Tool:** Metro (React Native default)
-   **Environment Variables:** Managed via `.env` (client-side) and Supabase Vault (server-side/Edge Functions for secrets like API keys).

## 3. Technical Constraints

-   Mobile-first development.
-   Reliance on Supabase for backend infrastructure.
-   Need to maintain compatibility between iOS and Android platforms.
-   Secure handling of external API keys (e.g., OpenRouter key via Supabase Vault).

## 4. Key Dependencies (Partial List - Needs Verification)

-   `react`
-   `react-native`
-   `@supabase/supabase-js`
-   Navigation library (e.g., `@react-navigation/native`)
-   `expo-av` (For audio recording)
-   `expo-image-picker` (For image selection)
-   `expo-file-system` (For temporary file handling)
-   `expo-crypto` (Used in ChatScreen for IDs)
-   `@react-native-async-storage/async-storage` (Used for guest chat persistence)

*(Dependencies and UI libraries need full confirmation by checking `package.json`. Setup details can be expanded.)*