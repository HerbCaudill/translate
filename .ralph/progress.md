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

---

## 2026-01-13: Create Anthropic client wrapper and prompts

**What changed:** Created the Anthropic client layer with:

- `src/lib/prompts.ts`:
  - `DEFAULT_COMPLETION_PROMPT` - system prompt for Haiku to detect if user has finished typing a complete thought
  - `DEFAULT_TRANSLATION_PROMPT` - system prompt for translation with `{{language}}` placeholder

- `src/lib/anthropic.ts`:
  - `checkCompletion(apiKey, text, customPrompt?)` - uses Haiku to detect if input is complete; returns `{ status: "complete" | "incomplete" | "error" }`
  - `translate(apiKey, text, language, customPrompt?)` - uses Sonnet to translate text; returns `{ success: true, options: TranslationOption[] }` or `{ success: false, error: string }`
  - Both functions handle empty input, API errors, authentication errors, and rate limits gracefully

- `src/lib/anthropic.test.ts` with 15 unit tests covering both functions

**Why:** These functions provide the core translation functionality. The completion detection (Haiku) determines when to auto-trigger translation, and the translation function (using Sonnet for now, originally planned for Opus) performs the actual translation with multiple options.

**Notes:** Using `claude-sonnet-4-20250514` instead of Opus for translations as it provides good quality at lower cost. The model can be easily changed later. The translation response format is JSON with an array of options, each containing text and explanation.

---

## 2026-01-13: Create TranslateInput component

**What changed:** Created `src/components/TranslateInput.tsx`:

- Textarea component for entering text to translate
- Autofocuses on mount using `useRef` and `useEffect`
- Accepts `value`, `onChange`, `placeholder`, and `disabled` props
- Uses shadcn Textarea component with custom styling (`min-h-32`, `resize-none`, `text-lg`)

Also:

- Added `src/components/TranslateInput.test.tsx` with 7 unit tests
- Installed shadcn `textarea` component
- Updated `App.tsx` to show TranslateInput when API key is stored
- Updated `App.test.tsx` to reflect new main content UI

**Why:** This is the first component of the main translation flow. Users type text into this input, which will later be wired up to debounce → completion detection → translation.

**Notes:** The component is a controlled input, receiving value and onChange from parent. This allows the App to manage translation state.

---

## 2026-01-13: Implement debounce hook

**What changed:** Created `src/hooks/useDebounce.ts`:

- Generic `useDebounce<T>(value, delay?)` hook that returns a debounced version of the value
- Default delay is 500ms (matches the task requirement)
- Timer resets when value changes before delay completes
- Properly cleans up timeout on unmount

Also:

- Added `src/hooks/useDebounce.test.ts` with 7 unit tests covering:
  - Initial value return
  - Value not updating before delay
  - Value updating after delay
  - Timer reset on rapid changes
  - Default delay behavior
  - Generic type support
  - Cleanup on unmount

**Why:** This hook is needed to debounce user input before triggering the completion check. Prevents excessive API calls while user is still typing.

**Notes:** Will be used in the main translation flow: input → debounce → completion detection → translation.

---

## 2026-01-13: Create useCompletionCheck hook

**What changed:** Created `src/hooks/useCompletionCheck.ts`:

- `useCompletionCheck({ text, apiKey, customPrompt?, debounceMs? })` hook
- Returns `{ status, error }` where status is one of: `idle | checking | complete | incomplete | error`
- Built-in debounce (default 500ms) before making API call
- Automatically resets to `idle` when text or apiKey becomes empty
- Cancels in-flight requests when text changes using AbortController
- Passes through custom completion prompt if provided

Also:

- Added `src/hooks/useCompletionCheck.test.ts` with 10 unit tests covering:
  - Initial idle state
  - Idle when text/apiKey empty
  - Completion check after debounce
  - Complete/incomplete/error status handling
  - Custom prompt pass-through
  - Cancellation on text change
  - Custom debounce delay
  - Reset to idle when text cleared

**Why:** This hook provides the completion detection functionality for the main translation flow. It wraps the `checkCompletion` API call with debouncing and state management.

**Notes:** Next step is to create `useTranslation` hook for the actual translation call, then wire everything together.

---

## 2026-01-13: Create useTranslation hook

**What changed:** Created `src/hooks/useTranslation.ts`:

- `useTranslation({ apiKey, languages, customPrompt? })` hook
- Returns `{ status, results, error, translate, reset }` where status is one of: `idle | translating | success | partial | error`
- `translate(text)` triggers translation to all configured languages in parallel
- `reset()` clears results and returns to idle state
- Results are `LanguageTranslation[]` with language info and translation options
- Handles partial failures when some languages succeed but others fail

Also:

- Added `src/hooks/useTranslation.test.ts` with 10 unit tests covering:
  - Initial idle state
  - Translation triggering and success status
  - Custom prompt pass-through
  - Empty/whitespace text rejection
  - Error handling
  - Partial failure handling
  - Reset functionality
  - Multiple language translation
  - Language info in results

**Why:** This hook provides the translation functionality for the main flow. It wraps the `translate` API call with state management and handles translating to multiple languages concurrently.

**Notes:** Next step is to wire up: input → debounce → detection → translation.

---

## 2026-01-13: Wire up main translation flow

**What changed:** Updated `src/App.tsx` to connect all the pieces:

- Input text is debounced with `useDebounce` (500ms)
- Debounced text is passed to `useCompletionCheck` for completion detection
- When completion status becomes "complete", automatically triggers `useTranslation.translate()`
- Uses a ref to track already-translated text to avoid re-translating
- Resets translation results when input is cleared
- Added basic status indicators showing "Checking if complete..." and "Translating..."
- Added inline translation results display showing each language with its translation options

**Why:** This completes section 5 of the todo list - the main translation flow is now fully functional. Users can type text, the app detects when they've completed a thought, and automatically translates to configured languages.

**Notes:** The results display is basic inline rendering. Section 7 will add proper TranslationCard and TranslationResults components. Section 6 will add a fallback translate button for when auto-detection doesn't trigger.

---

## 2026-01-13: Create TranslationCard component

**What changed:** Created `src/components/TranslationCard.tsx`:

- Card component that displays translation results for a single language
- Uses shadcn Card, CardHeader, CardTitle, and CardContent components
- Shows language name as the card title
- Lists all translation options with their explanations
- Adds `data-language` attribute for testing/styling purposes

Also:

- Added `src/components/TranslationCard.test.tsx` with 6 unit tests
- Updated `src/App.tsx` to use TranslationCard instead of inline rendering

**Why:** This is the first step in the Results UI section (7). The TranslationCard provides a clean, reusable component for displaying translation results, improving visual consistency with the shadcn card design system.

**Notes:** Next tasks in Results UI: TranslationResults component (grid of cards) and loading skeleton.

---

## 2026-01-13: Create TranslationResults component

**What changed:** Created `src/components/TranslationResults.tsx`:

- Grid component that displays multiple TranslationCards
- Responsive 2-column grid layout on medium screens and above (single column on mobile)
- Returns null when results array is empty
- Maps over results and renders a TranslationCard for each language

Also:

- Added `src/components/TranslationResults.test.tsx` with 6 unit tests
- Updated `src/App.tsx` to use TranslationResults instead of inline mapping
- Marked "Display multiple translation options with explanations" as complete (was already implemented in TranslationCard)

**Why:** This component completes the grid layout for translation results. The responsive design ensures good UX on both desktop (2 columns) and mobile (1 column).

**Notes:** Next task in Results UI: loading skeleton while translating.

---

## 2026-01-13: Add loading skeleton while translating

**What changed:** Added loading skeleton components:

- Created `src/components/TranslationCardSkeleton.tsx`:
  - Skeleton version of TranslationCard matching its layout
  - Shows language name in header (if provided)
  - Displays skeleton placeholders for two translation options
  - Uses shadcn Skeleton component

- Created `src/components/TranslationResultsSkeleton.tsx`:
  - Grid layout matching TranslationResults
  - Renders a skeleton card for each configured language
  - Shows language names so users know what's being translated

- Updated `src/App.tsx`:
  - Shows skeleton while `translationStatus === "translating"`
  - Shows actual results when translation completes
  - Removed temporary status text indicators

- Added tests for both skeleton components

**Why:** Provides visual feedback during translation, improving perceived performance and user experience. Users see cards for each language they're translating to, with animated skeleton placeholders.

**Notes:** The skeleton shows the actual language names, giving users context about what's being translated.

---

## 2026-01-13: Add fallback translation timer

**What changed:** Added a 2-second fallback timer in `src/App.tsx`:

- Added a new `useEffect` that starts a 2-second timer when debounced text is present
- Timer triggers translation if:
  - There's non-empty debounced text
  - The text hasn't already been translated
  - Completion check didn't return "complete" (meaning auto-detection didn't trigger)
- Timer is cleared if text changes or completion succeeds before 2 seconds

Also:

- Added `src/App.test.tsx` tests for fallback behavior:
  - "triggers translation after 2s fallback when completion check returns incomplete"
  - "does not trigger fallback if completion check returns complete"

**Why:** Some inputs (like single words or fragments) may not be detected as "complete" by the completion check. The fallback ensures users can always get a translation after a reasonable wait, even if the AI doesn't consider their input to be a complete thought.

**Notes:** The fallback timer starts from when `debouncedText` stabilizes (500ms after typing stops), so the actual delay is ~2.5s from the last keystroke.

---

## 2026-01-13: Create SettingsDialog component

**What changed:** Created `src/components/SettingsDialog.tsx`:

- Modal dialog for settings using shadcn Dialog component
- Settings gear icon button trigger (uses Tabler Icons)
- Dialog with header showing "Settings" title and description
- Accepts optional children prop to customize the trigger button
- Added gear icon to App header for easy access

Also:

- Installed shadcn `dialog` component (using Radix UI primitives)
- Added `src/components/SettingsDialog.test.tsx` with 4 unit tests:
  - Renders settings button
  - Opens dialog on click
  - Closes dialog via close button
  - Supports custom trigger children
- Updated `src/App.tsx` with header containing settings button

**Why:** First step in Settings section (8). The SettingsDialog provides the container for all settings controls. Currently shows placeholder content; future tasks will add language management and prompt editing.

**Notes:** The dialog uses controlled state (`open`, `onOpenChange`) to manage visibility. Next tasks: languages list (add/remove/reorder), prompt editor, reset button.

---

## 2026-01-13: Add language list management to settings

**What changed:** Created `src/components/LanguageList.tsx`:

- Displays list of configured target languages with code and name
- Each language has up/down arrows for reordering and trash button for removal
- Add form at bottom with code and name inputs plus add button
- Validates for duplicate language codes with error message
- Empty state when no languages configured
- First/last items have disabled move buttons appropriately

Updated `src/components/SettingsDialog.tsx`:

- Added LanguageList component with "Target languages" label
- Now accepts `languages` and `onLanguagesChange` props
- Wired up to update settings when languages change

Updated `src/App.tsx`:

- Passes `settings.languages` and update callback to SettingsDialog

Also:

- Added `src/components/LanguageList.test.tsx` with 12 unit tests
- Updated `src/components/SettingsDialog.test.tsx` with 2 new integration tests

**Why:** Users can now customize which languages to translate to. They can add new languages, remove existing ones, and reorder the list to prioritize their most-used languages.

**Notes:** Next tasks in Settings: prompt editor textarea, reset prompt to default button.

---

## 2026-01-13: Add prompt editor to settings

**What changed:** Updated `src/components/SettingsDialog.tsx`:

- Added textarea for editing the translation prompt
- Shows current prompt value with monospace font for better readability
- Helper text explaining `{{language}}` placeholder usage
- "Reset to default" button with restore icon (IconRestore from Tabler)
- Reset button is disabled when prompt matches default
- Clicking reset restores `DEFAULT_SETTINGS.translationPrompt`

Updated `src/App.tsx`:

- Passes `translationPrompt` and `onTranslationPromptChange` props to SettingsDialog
- Updates settings when user edits the prompt

Updated `src/components/SettingsDialog.test.tsx`:

- Added 6 new tests for prompt editor functionality:
  - Displays textarea when dialog is open
  - Shows current prompt value
  - Calls callback when prompt is edited
  - Disables reset when prompt is default
  - Enables reset when prompt differs from default
  - Resets to default when button clicked

**Why:** Completes the Settings section (8). Users can now customize the translation prompt to change how translations are generated, and reset to default if needed.

**Notes:** Section 8 (Settings) is now fully complete. Next section is 9 (History).

---

## 2026-01-13: Save translations to localStorage

**What changed:** Updated `src/App.tsx` to integrate history saving:

- Added `useHistory` hook import and usage
- Added `savedTranslationRef` ref to track which translations have been saved (prevents duplicates)
- Added `useEffect` that saves translations to history when:
  - Translation status becomes "success" or "partial"
  - There are results to save
  - The input text hasn't already been saved
- The Translation object saved includes: input text, results array, and timestamp

Updated `src/App.test.tsx`:

- Added "App history saving" describe block with 2 tests:
  - "saves translation to history when translation completes" - verifies history entry is created with correct data
  - "saves partial translations to history" - verifies partial successes (some languages fail) are also saved

**Why:** This is the first task in section 9 (History). Translations are now automatically persisted to localStorage, enabling future features like viewing history, searching past translations, and restoring previous translations.

**Notes:** The `useHistory` hook was already implemented with full functionality. This change just wires it up to the translation flow. Next tasks: create HistoryView component, search/filter, click to restore, clear history option.

---

## 2026-01-13: Create HistoryView component and complete history feature

**What changed:** Created full history viewing functionality:

- `src/components/HistoryView.tsx`:
  - Displays list of history entries sorted by most recent
  - Search input filters entries by input text (case-insensitive)
  - Each entry shows the input text and relative timestamp ("just now", "5 minutes ago", etc.)
  - Empty state when no history ("No history yet")
  - No results state when search yields no matches ("No matching entries")
  - Clear history button (trash icon) when history exists
  - Clicking an entry calls `onSelectEntry` callback

- `src/components/HistoryDialog.tsx`:
  - Modal dialog wrapper for HistoryView
  - History icon button trigger (IconHistory from Tabler)
  - Dialog closes after selecting an entry
  - Shows "History" title and "View your past translations" description

- Updated `src/App.tsx`:
  - Added HistoryDialog to header alongside settings button
  - Added `selectedHistoryEntry` state to track when viewing from history
  - `handleSelectHistoryEntry` sets input text and displays stored results
  - Clears selected entry when user types something different
  - Uses `displayResults` which prioritizes selected history entry results

- Added tests:
  - `src/components/HistoryView.test.tsx` with 10 tests
  - `src/components/HistoryDialog.test.tsx` with 4 tests

**Why:** Completes section 9 (History). Users can now:

- View their translation history
- Search/filter past translations by input text
- Click to restore a previous translation (displays stored results without re-translating)
- Clear all history

**Notes:** The history feature is now fully functional. Next section is 10 (Error handling) with toast notifications.

---

## 2026-01-13: Add toast notifications for API errors

**What changed:** Added toast notifications using sonner:

- Updated `src/main.tsx`:
  - Added `Toaster` component from sonner (positioned at bottom-center)

- Updated `src/App.tsx`:
  - Added `toast` import from sonner
  - Added `translationError` from useTranslation hook
  - Added `useEffect` that shows toast when translation errors occur
  - Toast includes error description and a "Retry" action button

- Added `src/App.test.tsx` tests:
  - "shows toast when translation fails" - verifies toast.error is called with error message
  - "shows toast when partial translation fails" - verifies toast for partial failures

**Why:** Users now receive visual feedback when API calls fail. The toast notification shows the error message and provides a retry button for easy recovery.

**Notes:** Sonner was already installed as a dependency. The toast includes a retry action that re-triggers translation with the same text.

---

## 2026-01-13: Add escape key to clear input and results

**What changed:** Added keyboard shortcut to clear input:

- Updated `src/components/TranslateInput.tsx`:
  - Added `onEscape` optional callback prop
  - Added `handleKeyDown` handler that calls `onEscape` when Escape key is pressed

- Updated `src/App.tsx`:
  - Passed `onEscape={() => setInputText("")}` to TranslateInput
  - Clearing input triggers existing useEffect that resets translation state

- Added `src/components/TranslateInput.test.tsx` tests:
  - "calls onEscape when Escape key is pressed"
  - "does not crash when Escape is pressed without onEscape handler"

**Why:** Quick UX improvement that users expect. Pressing Escape provides a fast way to clear the input and start fresh without needing to select and delete text.

**Notes:** The existing reset logic in App.tsx already handles clearing translation results when input becomes empty, so no additional changes were needed there.

---

## 2026-01-13: Add empty state when no translations yet

**What changed:** Added an empty state to guide users when they first open the app:

- Created `src/components/EmptyState.tsx`:
  - Centered content with language icon (IconLanguage from Tabler)
  - "Start typing to translate" heading
  - Descriptive text explaining auto-translation behavior
  - Uses muted foreground color for subtle appearance

- Updated `src/App.tsx`:
  - Imported EmptyState component
  - Modified rendering logic to show EmptyState when:
    - Not translating (no skeleton)
    - No results to display (empty `displayResults` array)
  - Uses ternary chain: skeleton → results → empty state

- Added tests:
  - `src/components/EmptyState.test.tsx` with 3 tests (heading, description, icon)
  - Updated `src/App.test.tsx` with "shows empty state when no translations yet" test

**Why:** New users need clear feedback about what to do when they first open the app. The empty state provides a friendly prompt to start typing, improving the onboarding experience.

**Notes:** The empty state appears both on first load and after clearing the input with Escape. It disappears as soon as translation begins (skeleton shows) or results are displayed.

---

## 2026-01-13: Handle rate limiting gracefully

**What changed:** Added automatic retry with exponential backoff for rate limit errors:

- Updated `src/lib/anthropic.ts`:
  - Added `MAX_RETRIES = 3` and `INITIAL_RETRY_DELAY_MS = 1000` constants
  - Added `sleep()` helper for retry delays
  - Added `getRetryAfterMs()` to parse the `retry-after` header from rate limit errors
  - Modified `checkCompletion()` to retry up to 3 times on rate limit errors with exponential backoff
  - Modified `translate()` to retry up to 3 times on rate limit errors with exponential backoff
  - When `retry-after` header is present, uses that value; otherwise uses exponential backoff (1s, 2s, 4s)

- Updated `src/lib/anthropic.test.ts`:
  - Added `vi.useFakeTimers()` to control timing in tests
  - Added `createRateLimitError()` helper to create rate limit errors with optional `retry-after` header
  - Added `flushRetries()` helper to advance timers through retry delays
  - Updated rate limit tests to verify retry behavior:
    - "retries on rate limit error and eventually fails after max retries" (4 total attempts)
    - "succeeds after rate limit retry" (succeeds on 2nd attempt)
    - "uses retry-after header for delay"

**Why:** Rate limiting can occur during normal use, especially with concurrent translations to multiple languages. Automatic retry with exponential backoff handles transient rate limits gracefully without user intervention. Only after 4 attempts (1 initial + 3 retries) does the user see an error, at which point the manual retry button in the toast can be used.

**Notes:** The retry logic respects the `retry-after` header when provided by the API, which gives better guidance on when to retry. The exponential backoff (1s, 2s, 4s) provides reasonable delays when no header is present.

---

## 2026-01-13: Configure manifest (name, icons, theme color)

**What changed:** Configured the PWA manifest with proper branding:

- Created `public/icon.svg` - app icon with blue gradient background and speech bubbles showing "A" and "あ" to represent translation
- Generated `public/icon-192.png` and `public/icon-512.png` using rsvg-convert
- Generated `public/apple-touch-icon.png` (180x180) for iOS home screen

- Updated `vite.config.ts` manifest configuration:
  - Changed `short_name` from "translate" to "Translate"
  - Added `description`: "A fast, intelligent translation app powered by Claude AI"
  - Changed `theme_color` from black to blue (#3b82f6)
  - Added `orientation: "portrait-primary"`
  - Added `categories: ["productivity", "utilities"]`
  - Added icons array with 192px and 512px sizes (with maskable variant)

- Updated `index.html` with PWA meta tags:
  - Added `<meta name="description">` for SEO
  - Added `<meta name="theme-color">` for browser chrome
  - Updated favicon to use the new SVG icon
  - Added `<link rel="apple-touch-icon">` for iOS

**Why:** A properly configured manifest is essential for the PWA to install correctly on desktop and mobile. Icons and theme colors create a professional, branded appearance when the app is installed.

**Notes:** The theme color (#3b82f6) matches the blue gradient in the icon. The icon design uses overlapping speech bubbles with "A" (Latin) and "あ" (Japanese hiragana) to visually represent translation between languages.

---

## 2026-01-13: Add loading spinner to TranslateInput

**What changed:** Added a visual loading indicator to the text input area:

- Updated `src/components/TranslateInput.tsx`:
  - Added `loading` optional prop (defaults to false)
  - Added IconLoader2 from Tabler icons with spin animation
  - Spinner appears in top-right corner of textarea when loading is true
  - Added right padding when loading to prevent text overlapping spinner
  - Wrapped textarea in a relative div for absolute positioning of spinner

- Updated `src/App.tsx`:
  - Pass `loading` prop to TranslateInput
  - Loading is true when `completionStatus === "checking"` OR `translationStatus === "translating"`

- Added tests in `src/components/TranslateInput.test.tsx`:
  - "shows loading spinner when loading is true"
  - "hides loading spinner when loading is false"

**Why:** Previously users had no visual feedback during the completion check phase. The spinner now shows activity during both completion checking (Haiku analyzing if input is complete) and translation (Sonnet translating to all languages), improving the user experience.

**Notes:** The spinner uses Tailwind's `animate-spin` class for smooth rotation animation. This addresses the "Loading states for all async operations" todo item.
