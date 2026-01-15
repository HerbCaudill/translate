# Progress Log

## 2025-01-15

### Show most recent translation on first load

When the app loads, it now displays the most recent translation from history instead of showing a blank screen. This improves the user experience by immediately showing the last translation the user was working with.

**Key changes:**

1. **Updated `App.tsx` initialization:**
   - Gets the most recent history entry (`history[0]`) on mount
   - Initializes `inputText` state with the most recent entry's input text (or empty string if no history)
   - Initializes `selectedHistoryEntry` state with the most recent entry (or null if no history)
   - Initializes `translatedTextRef` and `savedTranslationRef` with the entry's input to prevent re-translating

**Modified files:**

- `src/App.tsx` - Initialize state from most recent history entry

**Test files updated:**

- `src/App.test.tsx`:
  - Added new test suite "App initial state from history" with 2 tests:
    - "shows most recent translation on first load"
    - "shows empty state when there is no history"
  - Updated existing caching tests to clear pre-populated input before typing

## 2025-01-15

### Use cached translations from history

When the user enters text that matches a previous translation from history, the app now uses the cached result instead of calling the API. This saves API calls and provides instant results for repeated queries.

**Key changes:**

1. **Added `findByInput` function to `useHistory` hook** (`src/hooks/useHistory.ts`):
   - Searches history for an entry matching the given input text
   - Trims whitespace before comparing
   - Returns the matching `HistoryEntry` or `undefined` if not found

2. **Updated `handleSubmit` in `App.tsx`**:
   - Before calling the API, checks if the text exists in history via `findByInput`
   - If found, uses the cached result by setting `selectedHistoryEntry` (same flow as selecting from history dialog)
   - If not found, proceeds with API call as before

**Modified files:**

- `src/hooks/useHistory.ts` - Added `findByInput` function and exported it
- `src/App.tsx` - Updated `handleSubmit` to check for cached translations

**Test files updated:**

- `src/hooks/useHistory.test.ts` - Added 2 tests:
  - "finds entry by input text"
  - "finds entry by input text with whitespace trimming"
- `src/App.test.tsx` - Added new test suite "App translation caching" with 2 tests:
  - "uses cached result from history instead of calling API"
  - "calls API when input does not match any cached entry"

## 2025-01-15

### Remove focus ring from input field

Removed the focus ring (blue outline) from the translation input field to provide a cleaner appearance against the blue header background.

**Key changes:**

1. **Updated `TranslateInput.tsx`:**
   - Added `focus-visible:ring-0` to remove the ring shadow
   - Added `focus-visible:border-white/20` to maintain the existing border style on focus (instead of changing to the default ring border color)

**Modified files:**

- `src/components/TranslateInput.tsx` - Added focus ring override classes

**Test files updated:**

- `src/components/TranslateInput.test.tsx` - Added test "removes focus ring from input field"

## 2025-01-15

### Use monospace font for input and translations

Changed the typography from serif to monospace for both the input field and translation results. IBM Plex Mono was already being loaded from Google Fonts and configured in `index.css` as `--font-mono`.

**Key changes:**

1. **Updated `TranslateInput.tsx`:**
   - Added `font-mono` class to the Input component

2. **Updated `TranslationResults.tsx`:**
   - Changed translation text from `font-serif` to `font-mono`

3. **Updated `TranslationCard.tsx`:**
   - Changed translation text from `font-serif` to `font-mono` (for consistency)

**Modified files:**

- `src/components/TranslateInput.tsx` - Added `font-mono` to input
- `src/components/TranslationResults.tsx` - Changed to `font-mono` for translation text
- `src/components/TranslationCard.tsx` - Changed to `font-mono` for translation text

**Test files updated:**

- `src/components/TranslateInput.test.tsx` - Added test "applies mono font to input field"
- `src/components/TranslationResults.test.tsx` - Changed test from `font-serif` to `font-mono`
- `src/components/TranslationCard.test.tsx` - Changed test from `font-serif` to `font-mono`

## 2025-01-15

### Smaller and left-aligned tab buttons

Made the language tabs more compact and left-aligned to improve visual appearance.

**Key changes:**

1. **Updated `TabsList` component** (`src/components/ui/tabs.tsx`):
   - Changed `justify-center` to `justify-start` for left-alignment
   - Changed `h-9` to `h-auto` for flexible height (moved from TranslationResults)

2. **Updated `TabsTrigger` component** (`src/components/ui/tabs.tsx`):
   - Reduced padding from `px-3 py-1` to `px-2 py-0.5`
   - Reduced text size from `text-sm` to `text-xs`

3. **Simplified `TranslationResults.tsx`**:
   - Removed `h-auto gap-1` override (now in base component)
   - Kept `flex-wrap` for multi-line support

**Modified files:**

- `src/components/ui/tabs.tsx` - Smaller triggers, left-aligned list
- `src/components/TranslationResults.tsx` - Simplified TabsList className

## 2025-01-15

### Blue header with input

Applied a solid blue background (#3b82f6 / `bg-blue-600`) to the header area, matching the app icon's gradient. The header now contains both the title/toolbar and the translation input field, creating a prominent branded header bar.

**Key changes:**

1. **Updated `App.tsx` layout:**
   - Split the app into two sections: blue header and white content area
   - Header section uses `bg-blue-600` background with full-width coverage
   - Content area (results) sits below on a white background
   - Title text changed to white (`text-white`)
   - Added `className` prop to toolbar buttons for white icon styling

2. **Updated header button components** to accept `className` prop:
   - `InstallPrompt.tsx` - Added `className` prop passed to Button
   - `HistoryDialog.tsx` - Added `className` prop passed to DialogTrigger Button
   - `SettingsDialog.tsx` - Added `className` prop passed to DialogTrigger Button

3. **Updated `TranslateInput.tsx`** for blue background:
   - Input now has white background (`bg-white`) with subtle border (`border-white/20`)
   - Submit button inverted: white background with blue icon (`bg-white text-blue-600 hover:bg-blue-50`)

**Note:** The manifest already had `theme_color: "#3b82f6"` and `index.html` already had `<meta name="theme-color" content="#3b82f6">` - no changes needed there.

**Modified files:**

- `src/App.tsx` - Restructured layout with blue header wrapper
- `src/components/TranslateInput.tsx` - Updated input and button styling for blue background
- `src/components/InstallPrompt.tsx` - Added className prop
- `src/components/HistoryDialog.tsx` - Added className prop
- `src/components/SettingsDialog.tsx` - Added className prop

## 2025-01-15

### Remove gray backdrop on tabs

Removed the gray background from the tabs component and updated the styling for a cleaner appearance. The language tabs now appear as individual buttons with a bordered style, with the active tab highlighted using the primary color (blue).

**The change:**
- Removed `bg-muted` background and `rounded-lg p-1` padding from `TabsList`
- Updated `TabsTrigger` styling to use bordered buttons (`border border-input bg-background`)
- Active tab now uses primary color (`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`)
- Added hover state for inactive tabs

**Modified files:**

- `src/components/ui/tabs.tsx` - Updated TabsList and TabsTrigger styling

## 2025-01-15

### Show languages in the order defined in settings

Fixed a bug where translation results were displayed in whatever order the API returned them, instead of respecting the user's preferred language order from settings.

**The problem:**
When calling `translateAll`, the code iterated over `parsed.translations` (the API response) to build the results array. The API doesn't guarantee any particular ordering, so languages appeared in an unpredictable order.

**The fix:**
Changed the iteration to loop over `languages` (the settings order) and look up each translation from the API response. This ensures translations are always displayed in the order the user configured in settings.

**Modified files:**

- `src/lib/anthropic.ts` - Changed the result mapping loop from iterating over API response to iterating over settings languages

**Test file updated:**

- `src/lib/anthropic.test.ts` - Added test "returns translations in the order defined in settings, not API response order" that verifies when the API returns languages in a different order (French before Spanish), the results still match the settings order (Spanish before French)

## 2025-01-15

### Add logging for API requests, responses, and retries

Added a logging system to help debug API interactions. Logs are written to the browser console with structured data including timestamps, log levels, and contextual information.

**Key changes:**

1. **New `logger` module** (`src/lib/logger.ts`):
   - Generic logger with `debug`, `info`, `warn`, and `error` methods
   - Each log entry includes timestamp, level, category, and optional data
   - Uses appropriate console methods (log, warn, error) for each level
   - Prefixed with `[translate]` for easy filtering in browser console

2. **Specialized `apiLogger`** for consistent API logging:
   - `request(endpoint, data)` - logs outgoing requests with model, target language, text length, and attempt number
   - `response(endpoint, data)` - logs successful responses with target language and options count
   - `retry(endpoint, attempt, maxRetries, delayMs, reason)` - logs retry attempts with full context
   - `error(endpoint, error, data?)` - logs errors with error message and optional additional data

3. **Integrated logging into `anthropic.ts`**:
   - Logs each API request before it's made (model, target language, text length, attempt number)
   - Logs successful responses (target language, options count or "sameLanguage" result)
   - Logs all error conditions (parse errors, invalid format, auth errors, rate limits, generic API errors)
   - Logs retry attempts with delay and reason

**New files:**

- `src/lib/logger.ts` - Logger implementation
- `src/lib/logger.test.ts` - 13 tests covering both generic logger and apiLogger

**Modified files:**

- `src/lib/anthropic.ts` - Added logging calls throughout the translate function

## 2025-01-22

### Display translation results in tabs

Changed the translation results display from a 2-column grid showing all translations at once to a tabbed interface where the user selects which language to view. The selected tab is persisted in localStorage so it's remembered across sessions. The source language tab is automatically hidden because the existing translation logic already skips translations where the text is already in the target language (returns `sameLanguage: true`).

**Key changes:**

1. **Added Tabs UI component** (`src/components/ui/tabs.tsx`):
   - Created shadcn-style Tabs, TabsList, TabsTrigger, and TabsContent components using `@radix-ui/react-tabs`
   - Styled to match the existing design system

2. **Added `SELECTED_TAB` storage key** (`src/lib/storage.ts`):
   - New key for persisting the user's tab selection

3. **Rewrote `TranslationResults.tsx`**:
   - Changed from grid layout to tabbed layout
   - Tabs show language names, clicking switches content
   - Initial tab selection restores from localStorage if valid, otherwise uses first result
   - Tab changes are persisted to localStorage
   - Handles dynamic results (streaming translations) by re-validating selected tab when results change
   - Removed `TranslationCard` component usage - translation content is now rendered inline with simpler structure (no badge needed since language is shown in tab)

**New file:**

- `src/components/ui/tabs.tsx` - Radix-based Tabs components

**Modified files:**

- `src/lib/storage.ts` - Added `SELECTED_TAB` key
- `src/components/TranslationResults.tsx` - Complete rewrite from grid to tabs

**Test file updated:**

- `src/components/TranslationResults.test.tsx` - Updated tests for tabs interface:
  - Tests for tab rendering and switching
  - Tests for localStorage persistence (remembering selection)
  - Tests for restoring from localStorage
  - Tests for fallback when stored tab is not available

**Dependencies added:**

- `@radix-ui/react-tabs` - For accessible tab components

## 2025-01-21

### Replace skeleton loading cards with progressive results streaming

Removed the skeleton loading cards that appeared while waiting for all translations. Now translations stream in progressively as they complete - the first translation that finishes appears immediately while others are still in progress. The spinner in the submit button still indicates work is happening.

**Key changes:**

1. **Modified `useTranslation` hook** to update results progressively:
   - Changed from `Promise.all` waiting for all translations to immediately updating state as each translation completes
   - Results are added one-by-one using `setResults(prev => [...prev, newResult])` callback pattern
   - Status tracking counts completed translations and sets final status when all are done

2. **Simplified `App.tsx`**:
   - Removed `TranslationResultsSkeleton` import and usage
   - Changed from either/or display (skeleton OR results) to always showing results when available
   - Results now display during `translating` status, growing as more complete

**Modified files:**

- `src/hooks/useTranslation.ts` - Rewrote translation logic to stream results progressively
- `src/App.tsx` - Removed skeleton, simplified results display logic

**Test file updated:**

- `src/hooks/useTranslation.test.ts` - Added test verifying progressive streaming: first result appears while second is still pending, status remains "translating" until all complete

## 2025-01-20

### Use Plex Serif for translations

Added `font-serif` class to the translation text in `TranslationCard.tsx` so translations are displayed using IBM Plex Serif instead of the default sans-serif font. The IBM Plex Serif font was already being loaded from Google Fonts and configured in `index.css` as `--font-serif`.

**Modified files:**

- `src/components/TranslationCard.tsx` - Added `font-serif` class to the `<p>` element displaying translation text

**Test file updated:**

- `src/components/TranslationCard.test.tsx` - Added test to verify serif font is applied to translation text

## 2025-01-19

### Add more spacing between language cards in results

Increased the gap between translation cards in the results grid from `gap-3` (12px) to `gap-4` (16px) for better visual separation.

**Modified files:**

- `src/components/TranslationResults.tsx` - Changed grid gap from `gap-3` to `gap-4`
- `src/components/TranslationResultsSkeleton.tsx` - Changed grid gap from `gap-3` to `gap-4` (consistency with results)

## 2025-01-18

### Fix broken App tests

The `App.test.tsx` file was mocking a `detectLanguage` function that no longer exists and expecting a 4th argument to `translate()` that was removed. This was leftover from a previous implementation that was later replaced with a simpler approach (integrated language detection in the translation prompt itself).

**Changes:**

- Removed `detectLanguage` from the mock in `App.test.tsx`
- Updated `translate()` call expectations from 4 arguments to 3
- Added `vi.stubEnv("VITE_ANTHROPIC_API_KEY", "")` in `src/test/setup.ts` to ensure predictable test behavior

## 2025-01-17

### Add language detection and skip translating to detected language

Added automatic language detection to identify the source language before translation. When the detected language matches one of the target languages, that language is skipped to avoid redundant translation (e.g., don't translate Spanish text to Spanish).

**Key changes:**

1. **Added English to default languages** - English is now the first default target language (en, ca, es, fr, pt)

2. **New `detectLanguage` function in `anthropic.ts`**:
   - Uses Claude 3.5 Haiku for fast language detection
   - Returns ISO 639-1 language code
   - Includes retry logic for rate limits (same pattern as translate)
   - Handles "unknown" response when language cannot be determined

3. **Updated `useTranslation` hook**:
   - Now calls `detectLanguage` before translating
   - Filters out the detected language from target languages
   - Exposes `detectedLanguage` in the return value
   - If detection fails, translates to all target languages (fallback behavior)

4. **Updated `App.tsx`**:
   - Displays detected language when translation completes
   - Shows "Detected language: {name}" above results

**Modified files:**

- `src/lib/anthropic.ts`:
  - Added `DETECTION_MODEL` constant (claude-3-5-haiku-20241022)
  - Added `DetectionResult` type
  - Added `LANGUAGE_DETECTION_PROMPT`
  - Added `detectLanguage` function with retry logic
  - Imported `findLanguageByCode` from languages.ts

- `src/hooks/useTranslation.ts`:
  - Added `detectedLanguage` state
  - Call `detectLanguage` at start of translation
  - Filter target languages to exclude detected language
  - Reset `detectedLanguage` on reset()
  - Return `detectedLanguage` from hook

- `src/hooks/useSettings.ts`:
  - Added English (en) as first default language

- `src/App.tsx`:
  - Destructure `detectedLanguage` from useTranslation
  - Display detected language when status is success/partial

**Test files updated:**

- `src/lib/anthropic.test.ts` - Added 7 new tests for `detectLanguage`:
  - Returns error for empty text
  - Returns detected language on success
  - Handles uppercase response
  - Returns error when language is unknown
  - Returns error for unrecognized language code
  - Handles API authentication error
  - Retries on rate limit error

- `src/hooks/useTranslation.test.ts`:
  - Added mock for `detectLanguage`
  - Added default mock behavior in beforeEach
  - Added 4 new tests:
    - Should detect language and return it
    - Should skip translation to detected language
    - Should translate to all languages if detection fails
    - Should return success with empty results when all targets match detected

- `src/App.test.tsx`:
  - Added mock for `detectLanguage` in all describe blocks

## 2025-01-16

### Auto-submit API key on paste

Added functionality to automatically validate and submit the API key when the user pastes text that looks like an Anthropic API key (starts with `sk-ant-`). This streamlines the onboarding experience since users typically copy/paste their API key from the Anthropic Console.

**Modified files:**

- `src/components/ApiKeyPrompt.tsx`:
  - Added `looksLikeApiKey()` helper function to check if text starts with `sk-ant-`
  - Extracted validation logic into `submitApiKey()` function for reuse
  - Added `handlePaste` handler that auto-submits when pasting valid-looking keys
  - Added `onPaste` prop to the Input component
  - Non-API-key text pastes still work normally (default behavior preserved)

**Test file updated:**

- `src/components/ApiKeyPrompt.test.tsx` - Added 4 new tests:
  - Auto-submits when pasting a valid API key format
  - Shows the pasted key in the input field
  - Does not auto-submit when pasting text that doesn't look like an API key
  - Shows validation error when pasted API key is invalid

## 2025-01-15

### Clean up API key dialog UI

Simplified the API key prompt by removing the redundant "API key" label (the card title already says "API key required") and increased spacing around the helper text.

**Modified files:**

- `src/components/ApiKeyPrompt.tsx`:
  - Removed the visible `<Label>` element (redundant with card title)
  - Added `aria-label="API key"` to the input for accessibility
  - Increased gap from `gap-2` to `gap-3` for better spacing around the "Get your API key" helper text
  - Removed unused `Label` import

### Show API key as plain text instead of password field

Changed the API key input from `type="password"` to `type="text"` so users can see what they're typing and verify their key is correct before submitting.

**Modified files:**

- `src/components/ApiKeyPrompt.tsx` - Changed input type from "password" to "text"

### Unify language badge between results and skeleton views

Created a shared `LanguageBadge` component to ensure the language name is displayed consistently between the translation results and the skeleton loading state.

**New file created:**

- `src/components/LanguageBadge.tsx` - Reusable badge component with `bg-primary text-primary-foreground` styling, positioned absolutely on the card border

**Modified files:**

- `src/components/TranslationCard.tsx` - Now uses `LanguageBadge` instead of inline styled span
- `src/components/TranslationCardSkeleton.tsx` - Replaced `Skeleton` wrapper around language name with `LanguageBadge`. The badge now displays with the same styling as the results (no pulsing animation), while the content below remains skeletal
- `src/components/TranslationCardSkeleton.test.tsx` - Updated skeleton count from 5 to 4 since the badge is no longer a skeleton element

**New test file:**

- `src/components/LanguageBadge.test.tsx` - Tests for rendering, custom className support, and base styling

## 2025-01-14

### Make the submit button blue

Changed the submit button in `TranslateInput.tsx` to use blue styling (`bg-blue-600 hover:bg-blue-500 text-white`) instead of the default grey primary color. This is a direct Tailwind class override on the Button component.

### Make the default languages Catalan, Spanish, French, and Portuguese

Updated `DEFAULT_SETTINGS` in `src/hooks/useSettings.ts` to use Catalan (ca), Spanish (es), French (fr), and Portuguese (pt) instead of the previous Spanish, French, German defaults. Note: existing users who have already saved their settings will not see this change since their settings are persisted in localStorage.

### Make the results more compact: less padding, smaller text

Made translation cards more compact by reducing padding and text sizes across four components:

**TranslationCard.tsx:**

- Card padding: `py-6` → `py-3` (24px → 12px vertical)
- Card gap: `gap-6` → `gap-3` (24px → 12px between header/content)
- Header/Content padding: `px-6` → `px-4` (24px → 16px horizontal)
- Title text: default → `text-sm` (smaller language name)
- Translation text: `text-lg` → `text-base` (18px → 16px)
- Explanation text: `text-sm` → `text-xs` (14px → 12px)
- Option gap: `gap-4` → `gap-3`, inner gap `gap-1` → `gap-0.5`

**TranslationCardSkeleton.tsx:**

- Mirrored all the same spacing changes for loading state consistency
- Adjusted skeleton heights to match new text sizes

**TranslationResults.tsx & TranslationResultsSkeleton.tsx:**

- Grid gap: `gap-4` → `gap-3` (16px → 12px between cards)

### Change the language interface to autocomplete

Replaced the two-input language entry system (code + name) with an autocomplete dropdown. Users no longer need to know ISO 639-1 codes.

**New files created:**

- `src/lib/languages.ts` - Contains a comprehensive list of ~100 languages with their ISO 639-1 codes and names, plus helper functions `findLanguageByCode()` and `searchLanguages()`
- `src/components/ui/command.tsx` - shadcn/ui style Command component built on `cmdk` library for the autocomplete functionality
- `src/components/ui/popover.tsx` - Radix UI Popover wrapper for the dropdown container
- `src/components/LanguageCombobox.tsx` - Combines Command + Popover into a searchable language selector that:
  - Shows language code badges alongside names
  - Filters out already-added languages via `excludeCodes` prop
  - Provides search across both code and name

**Modified files:**

- `src/components/LanguageList.tsx` - Replaced the two text inputs with LanguageCombobox. The add flow is now: click combobox → search/select language → click add button
- `src/components/LanguageList.test.tsx` - Updated tests to interact with the new combobox interface using `cmdk-item` selectors
- `src/test/setup.ts` - Added mocks for `ResizeObserver` and `Element.scrollIntoView` required by cmdk in jsdom

**Dependencies added:**

- `@radix-ui/react-popover` - For dropdown positioning
- `cmdk` - Command palette library for fast fuzzy search

### Put language name in a badge on the border

Changed the language name display from a card header title to a badge that floats on the top border of the card.

**TranslationCard.tsx:**

- Removed CardHeader and CardTitle components in favor of a styled `<span>` badge
- Badge positioned absolutely at `-top-2.5 left-3` to float on the card border
- Badge uses `bg-primary text-primary-foreground` for consistent theming
- Added `rounded-full` pill shape with `px-2.5 py-0.5 text-xs font-medium` styling
- Card padding adjusted from `py-3` to `pt-5 pb-3` to accommodate badge overflow

**TranslationCardSkeleton.tsx:**

- Mirrored the same badge positioning for loading state consistency
- Skeleton badge uses same absolute positioning and rounded-full shape

### Drag and drop to reorder languages

Replaced the up/down arrow buttons with drag-and-drop functionality for reordering languages in settings, providing a more intuitive interaction.

**Dependencies added:**

- `@dnd-kit/core` - Core drag and drop primitives
- `@dnd-kit/sortable` - Sortable list functionality
- `@dnd-kit/utilities` - CSS transform utilities

**Modified files:**

- `src/components/LanguageList.tsx`:
  - Added `SortableLanguageItem` component using `useSortable` hook
  - Wrapped language list in `DndContext` and `SortableContext`
  - Added drag handle with grip icon (`IconGripVertical`) replacing up/down buttons
  - Used `arrayMove` from dnd-kit to handle reordering on drag end
  - Added visual feedback (opacity, shadow) when dragging
  - Supports both pointer (mouse/touch) and keyboard sensors for accessibility

- `src/components/LanguageList.test.tsx`:
  - Removed tests for old move up/down buttons
  - Added tests for drag handles presence and accessibility attributes
