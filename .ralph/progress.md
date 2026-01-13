# Progress Log

This file tracks completed tasks and changes made to the codebase during ralph iterations.

Each entry should include:

- What was changed
- Why it was changed
- Any important notes for future work

---

## 2026-01-13: Define TypeScript types

**What changed:** Created `src/types/index.ts` with core type definitions:

- `Language` - code and name for target languages
- `Settings` - API key, languages, and prompts
- `TranslationOption` - a single translation with explanation
- `LanguageTranslation` - all options for one target language
- `Translation` - complete result with input, results, and timestamp
- `HistoryEntry` - saved translation with unique ID

**Why:** These types form the foundation for the app's data model. All hooks and components will use these types for type safety.

**Notes:** The `TranslationOption` includes an `explanation` field to support the multi-option translation feature where each translation comes with context about when to use it.

---

## 2026-01-13: Create localStorage helper functions

**What changed:** Created `src/lib/storage.ts` with typed localStorage helpers:

- `getItem<T>(key)` - retrieves and parses JSON from localStorage, returns null on missing/invalid
- `setItem<T>(key, value)` - stringifies and stores value
- `removeItem(key)` - removes key from storage
- `STORAGE_KEYS` - typed constants for storage keys (`translate:settings`, `translate:history`)

Also added:

- `vitest.config.ts` with jsdom environment for browser API testing
- `src/lib/storage.test.ts` with comprehensive unit tests

**Why:** These helpers provide a type-safe abstraction over localStorage with automatic JSON serialization. The typed storage keys prevent typos and ensure consistency.

**Notes:** Installed `jsdom` as a dev dependency to support localStorage in Vitest tests.

---

## 2026-01-13: Create useSettings hook

**What changed:** Created `src/hooks/useSettings.ts` with:

- `DEFAULT_SETTINGS` - default configuration with empty API key, three default languages (Spanish, French, German), and default prompts
- `useSettings()` hook that returns `{ settings, updateSettings, resetSettings }`
- Settings are loaded from localStorage on mount, falling back to defaults
- `updateSettings(partial)` merges partial updates and persists to localStorage
- `resetSettings()` reverts to default settings

Also added:

- `src/hooks/useSettings.test.ts` with 6 unit tests covering load, update, merge, and reset behaviors
- Installed `@testing-library/react` for hook testing

**Why:** This hook provides the foundation for managing user preferences throughout the app. Components can read settings and update them through a consistent interface.

**Notes:** The default translation prompt uses `{{language}}` as a placeholder that will be replaced with the target language name during translation.

---

## 2026-01-13: Create useHistory hook

**What changed:** Created `src/hooks/useHistory.ts` with:

- `useHistory()` hook that returns `{ history, addEntry, removeEntry, clearHistory, findEntry }`
- History entries are loaded from localStorage on mount, sorted by newest first
- `addEntry(translation)` creates a new HistoryEntry with generated ID and persists to localStorage
- `removeEntry(id)` removes a specific entry
- `clearHistory()` removes all entries
- `findEntry(id)` looks up an entry by ID

Also added:

- `src/hooks/useHistory.test.ts` with 8 unit tests covering load, add, remove, clear, find, and sorting behaviors

**Why:** This hook provides the foundation for translation history functionality. It allows saving translations for later reference, searching through past translations, and clearing history.

**Notes:** The hook generates unique IDs using timestamp + random string. History is automatically sorted with newest entries first.

---

## 2026-01-13: Create ApiKeyPrompt component

**What changed:** Created `src/components/ApiKeyPrompt.tsx`:

- Card-based UI prompting user for their Anthropic API key
- Password input field with autofocus
- Link to Anthropic Console for obtaining an API key
- Loading state ("Validating...") while async `onSubmit` is processing
- Button disabled when input is empty or during submission
- Accepts `onSubmit: (apiKey: string) => Promise<void>` prop for handling key validation

Also added:

- `src/components/ApiKeyPrompt.test.tsx` with 7 unit tests
- `src/test/setup.ts` to configure jest-dom matchers for Vitest
- Installed shadcn components: input, label, card
- Installed dev dependencies: @testing-library/jest-dom, @testing-library/user-event

**Why:** This component is the first step in the API key flow. Users need to provide their API key before they can use the translation service.

**Notes:** The component handles UI only; validation logic will be wired up when the Anthropic client is implemented.

---

## 2026-01-13: Wire up API key storage and prompt flow

**What changed:** Updated `src/App.tsx` to:

- Use `useSettings` hook to check for stored API key
- Show `ApiKeyPrompt` component when no API key is stored
- Store API key in localStorage via `updateSettings` when user submits
- Show main content ("Hello, world") when API key is present

Also added:

- `src/App.test.tsx` with 3 unit tests:
  - Shows ApiKeyPrompt when no API key is stored
  - Shows main content when API key is already stored
  - Stores API key and shows main content after submission

**Why:** Completes the basic API key flow - the app now prompts for an API key on first run, stores it persistently, and remembers it across sessions.

**Notes:** API key validation has now been implemented.

---

## 2026-01-13: Add API key validation

**What changed:** Added API key validation using the Anthropic SDK:

- Created `src/lib/validateApiKey.ts`:
  - Makes a minimal test call to Anthropic (using claude-3-5-haiku-latest with max_tokens=1)
  - Returns `{ valid: true }` on success or rate limit (key is valid but rate limited)
  - Returns `{ valid: false, error: string }` for authentication errors or other failures
  - Handles empty/whitespace-only keys as invalid
- Updated `src/components/ApiKeyPrompt.tsx`:
  - Validates API key before storing
  - Displays error message when validation fails
  - Clears error on new submission attempt
- Added `src/lib/validateApiKey.test.ts` with 7 unit tests
- Updated `ApiKeyPrompt.test.tsx` with 2 new tests for error display

**Why:** Validates API keys before storing them, so users get immediate feedback if their key is invalid. This prevents frustration from entering an invalid key and only discovering it later during translation.

**Notes:** The Anthropic SDK was already installed. The validation treats rate limit errors as valid (the key works, just temporarily limited).
