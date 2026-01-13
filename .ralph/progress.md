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
