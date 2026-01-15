# Progress Log

## 2026-01-15

### iOS floating toolbar "Go" button submits form

Fixed an issue where tapping the check/done button on the iOS floating keyboard toolbar didn't submit the translation form. On iOS, this toolbar button triggers a form submit event rather than an Enter key event.

**Key changes:**

1. **Updated `TranslateInput.tsx`:**
   - Wrapped input and submit button in a `<form>` element
   - Added `handleFormSubmit` handler that prevents default and calls the submit logic
   - Changed submit button to `type="submit"` for proper form semantics
   - Added `enterKeyHint="go"` attribute to the input, which displays "Go" on iOS keyboard (more appropriate for a search/submit action than the default "return")

**Modified files:**

- `src/components/TranslateInput.tsx` - Wrapped in form, added enterKeyHint

**Test files updated:**

- `src/components/TranslateInput.test.tsx` - Added 3 tests:
  - "wraps input in a form for iOS keyboard submit support"
  - "sets enterKeyHint to 'go' for iOS keyboard button"
  - "calls onSubmit when form is submitted"

### Mobile scroll container for results

Made the translation results display in a scrollable container on mobile, preventing the entire page from scrolling or zooming. The header (with input) stays fixed while only the results area scrolls.

**Key changes:**

1. **Updated `index.html`:**
   - Added `maximum-scale=1.0, user-scalable=no` to the viewport meta tag to prevent pinch-to-zoom

2. **Updated `src/index.css`:**
   - Set `html`, `body` to `overflow: hidden`, `position: fixed`, and full viewport dimensions
   - Added `overscroll-behavior: none` to prevent pull-to-refresh and rubber-banding
   - Made `#root` fill the height and hide overflow

3. **Updated `src/App.tsx`:**
   - Changed outer container from `min-h-screen` to `h-full overflow-hidden`
   - Added `shrink-0` to the header to prevent it from shrinking
   - Wrapped results area in a scrollable container with `flex-1 min-h-0 overflow-y-auto overscroll-contain`
   - The `min-h-0` is critical for flexbox to allow the container to shrink below content size

**Modified files:**

- `index.html` - Updated viewport meta tag
- `src/index.css` - Added CSS to prevent page scrolling
- `src/App.tsx` - Restructured layout with fixed header and scrollable results

### Prevent iOS auto-zoom on input focus

Fixed an issue where iOS Safari would automatically zoom in when focusing the translation input field. This happened because the input had a font-size of 14px (`text-sm`), and iOS auto-zooms when inputs have font-size less than 16px.

**The fix:**

Changed the input to use `text-base` (16px) on mobile devices and `md:text-sm` (14px) on larger screens using Tailwind's responsive breakpoints. This ensures:
- iOS devices don't zoom when focusing the input (font-size >= 16px)
- Desktop users still get the more compact 14px text size

**Modified files:**

- `src/components/TranslateInput.tsx` - Changed `text-sm` to `text-base md:text-sm`

**Test files updated:**

- `src/components/TranslateInput.test.tsx` - Updated test "applies small text size to input field" to "uses text-base on mobile and text-sm on larger screens to prevent iOS zoom" verifying both `text-base` and `md:text-sm` classes are present

### Select all text on input focus

Added functionality to select all text in the translation input field when it receives focus. This improves UX by allowing users to quickly replace the current text without manually selecting or deleting it.

**Key changes:**

1. **Updated `TranslateInput.tsx`:**
   - Added `handleFocus` function that calls `select()` on the input element
   - Added `onFocus={handleFocus}` prop to the Input component

**Modified files:**

- `src/components/TranslateInput.tsx` - Added focus handler to select all text

**Test files updated:**

- `src/components/TranslateInput.test.tsx` - Added test "selects all text on focus" that verifies text selection occurs when input receives focus

### Add more lines to the loading skeleton

Increased the number of skeleton placeholder lines in the loading state from 2 to 3 options. This provides a fuller visual preview while translations are loading.

**Key changes:**

1. **Updated `TranslationResults.tsx`:**
   - Changed `TranslationSkeleton` to show 3 option placeholders instead of 2

2. **Updated `TranslationCardSkeleton.tsx`:**
   - Changed from 2 to 3 translation option placeholders for consistency

**Modified files:**

- `src/components/TranslationResults.tsx` - Updated `TranslationSkeleton` to render 3 skeleton options
- `src/components/TranslationCardSkeleton.tsx` - Updated to render 3 skeleton options

**Test files updated:**

- `src/components/TranslationCardSkeleton.test.tsx` - Updated test expectation from 4 to 6 skeleton elements (3 options × 2 skeletons each)
- `src/components/TranslationResults.test.tsx` - Added test "renders three skeleton option placeholders when loading" to verify the skeleton count

### Rename heading to "Universal Translator" and make it smaller

Changed the app heading from "Translate" to "Universal Translator" and reduced its size from `text-2xl` to `text-lg` for a more compact header appearance.

**Key changes:**

1. **Updated `App.tsx`:**
   - Changed h1 text from "Translate" to "Universal Translator"
   - Reduced heading size class from `text-2xl` to `text-lg`

**Modified files:**

- `src/App.tsx` - Updated heading text and size

**Test files updated:**

- `src/App.test.tsx` - Updated 2 tests that referenced the heading text "Translate" to use "Universal Translator" instead

### Replace existing history entries when refreshing results

Fixed an issue where refreshing translation results would create duplicate history entries for the same input text. Now when a translation is added to history, if an entry with the same input already exists, it updates that entry's results instead of creating a new one. This ensures there's only ever one set of results for any given string.

**Key changes:**

1. **Updated `addEntry` function in `useHistory.ts`:**
   - Before adding a new entry, checks if one with the same input (trimmed) already exists
   - If found, updates the existing entry with new translation results and timestamp
   - The original entry ID is preserved, but the timestamp is updated so it moves to the top of history
   - If no existing entry, creates a new one as before

**Modified files:**

- `src/hooks/useHistory.ts` - Updated `addEntry` to upsert (update or insert) instead of always creating new entries

**Test files updated:**

- `src/hooks/useHistory.test.ts` - Added 2 tests:
  - "updates existing entry when adding with same input" - verifies that adding a translation with an existing input updates instead of duplicating
  - "updates existing entry with whitespace-trimmed input matching" - verifies whitespace is handled correctly when matching inputs

### Use trash icon for deleting history items

Changed the delete button icon in the history dialog from an X icon (`IconX`) to a trash icon (`IconTrash`) for clearer visual communication of the delete action.

**Key changes:**

1. **Updated `HistoryView.tsx`:**
   - Changed import from `IconX` to `IconTrash`
   - Replaced `<IconX>` with `<IconTrash>` in the delete button

**Modified files:**

- `src/components/HistoryView.tsx` - Changed delete button icon from X to trash

**No test changes needed** - existing tests verify functionality via aria-label, not icon class names.

### Make delete button always visible in history dialog

Fixed an issue where the delete button for history items was only visible on hover (using `opacity-0` + `group-hover:opacity-100`). This made the delete functionality invisible on touch devices and could confuse users who didn't know about the hover behavior. The button is now always visible with muted styling that changes to red on hover.

**Key changes:**

1. **Updated `HistoryView.tsx`:**
   - Removed `opacity-0` and `group-hover:opacity-100` classes from the delete button
   - Added `text-muted-foreground hover:text-destructive` for visible but subtle styling
   - Button is now always visible, not just on hover

**Modified files:**

- `src/components/HistoryView.tsx` - Made delete button always visible

**Test files updated:**

- `src/components/HistoryView.test.tsx` - Updated test "shows delete button for each entry" to:
  - Renamed from "shows delete button for each entry on hover" since hover is no longer relevant
  - Added `toBeVisible()` assertion to verify the button is actually visible

### Exclude exact matches from history autocomplete suggestions

Fixed an issue where after typing something and getting translation results, the history autocomplete would show the same item as a suggestion. This was confusing because the user is already viewing that translation. The fix ensures that entries which exactly match the input text are excluded from the autocomplete dropdown.

**Key changes:**

1. **Updated `searchHistory` function in `useHistory.ts`:**
   - Added an additional condition to filter out entries where the input exactly matches the query (case-insensitive)
   - The search still returns partial matches, just not exact matches

**Modified files:**

- `src/hooks/useHistory.ts` - Updated `searchHistory` to exclude exact matches

**Test files updated:**

- `src/hooks/useHistory.test.ts` - Added 2 tests:
  - "excludes exact matches from search results"
  - "excludes exact matches case-insensitively"

### Add refresh button for results

Added a refresh button to the translation results that allows users to force a fresh translation from the API, bypassing the history cache. The button appears next to the language tabs and shows a spinner while refreshing.

**Key changes:**

1. **Updated `TranslationResults.tsx`:**
   - Added `onRefresh` and `isRefreshing` props to the component
   - Added refresh button (`IconRefresh`) next to the tabs list
   - Button is conditionally rendered only when `onRefresh` is provided
   - Button is disabled and shows spinner animation when `isRefreshing` is true
   - Used ghost variant with muted styling for subtle appearance

2. **Updated `App.tsx`:**
   - Added `handleRefresh` callback that forces a fresh translation bypassing cache
   - Resets `savedTranslationRef` so new results get saved to history
   - Clears `selectedHistoryEntry` to show live translation results
   - Passed `handleRefresh` and `isRefreshing` state to `TranslationResults`

**Modified files:**

- `src/components/TranslationResults.tsx` - Added refresh button and new props
- `src/App.tsx` - Added `handleRefresh` handler and connected to TranslationResults

**Test files updated:**

- `src/components/TranslationResults.test.tsx` - Added 4 tests:
  - "renders refresh button when onRefresh is provided"
  - "does not render refresh button when onRefresh is not provided"
  - "calls onRefresh when refresh button is clicked"
  - "disables refresh button and shows spinner when isRefreshing is true"

### Make input text smaller

Reduced the font size of the translation input field from `text-lg` (18px) to `text-sm` (14px) for a more compact appearance that better fits the header area.

**Key changes:**

1. **Updated `TranslateInput.tsx`:**
   - Changed input font size class from `text-lg` to `text-sm`

**Modified files:**

- `src/components/TranslateInput.tsx` - Reduced input text size

**Test files updated:**

- `src/components/TranslateInput.test.tsx` - Added test "applies small text size to input field" verifying the input has the `text-sm` class

## 2025-01-15

### Remove subtitle from history dialog

Removed the "View your past translations." subtitle/description from the history dialog to simplify the UI. The dialog title "History" is self-explanatory and the description was redundant.

**Key changes:**

1. **Updated `HistoryDialog.tsx`:**
   - Removed `DialogDescription` component and its import
   - Added `aria-describedby={undefined}` to `DialogContent` to suppress Radix UI accessibility warning for missing description

**Modified files:**

- `src/components/HistoryDialog.tsx` - Removed subtitle and added aria-describedby attribute

## 2025-01-15

### Remove "clear all history" button

Removed the trash icon button that cleared all history entries. Since users can already delete individual items, a "clear all" button is redundant and poses a risk of accidental data loss.

**Key changes:**

1. **Updated `HistoryView.tsx`:**
   - Removed the trash icon button and its `onClearHistory` prop
   - Removed `IconTrash` import
   - Simplified the search bar layout (no longer needs flex container with button)

2. **Updated `HistoryDialog.tsx`:**
   - Removed `onClearHistory` prop from Props type
   - Removed prop passthrough to `HistoryView`

3. **Updated `App.tsx`:**
   - Removed `clearHistory` from useHistory destructuring
   - Removed `onClearHistory` prop from HistoryDialog usage

**Modified files:**

- `src/components/HistoryView.tsx` - Removed clear button and `onClearHistory` prop
- `src/components/HistoryDialog.tsx` - Removed `onClearHistory` prop
- `src/App.tsx` - Removed `clearHistory` usage

**Test files updated:**

- `src/components/HistoryView.test.tsx` - Removed 3 tests related to clear history button, removed `onClearHistory={vi.fn()}` from all remaining tests
- `src/components/HistoryDialog.test.tsx` - Removed `onClearHistory={vi.fn()}` from all tests

## 2025-01-15

### History results in a scrolling container

Added a scrolling container around the history list in the HistoryView component to prevent overflow when there are many history entries.

**Key changes:**

1. **Updated `HistoryView.tsx`:**
   - Wrapped the `<ul>` history list in a `<div>` with `max-h-80 overflow-y-auto`
   - This limits the list height to 320px (20rem) and enables vertical scrolling when content exceeds that height

**Modified files:**

- `src/components/HistoryView.tsx` - Added scrolling container wrapper

**Test files updated:**

- `src/components/HistoryView.test.tsx` - Added test "renders history list in a scrolling container" verifying the container has `overflow-y-auto` and `max-h-80` classes

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

## 2025-01-15

### Allow deleting individual history items

Added the ability to delete individual history entries from the history dialog. Each history entry now has a delete button (X icon) that appears on hover.

**Key changes:**

1. **Updated `HistoryView.tsx`:**
   - Added `onRemoveEntry` prop to handle deletion
   - Added delete button (`IconX`) to each history item
   - Button appears on hover via `group-hover:opacity-100` class
   - Uses `e.stopPropagation()` to prevent triggering selection when clicking delete
   - Accessible `aria-label` includes the entry text for screen readers

2. **Updated `HistoryDialog.tsx`:**
   - Added `onRemoveEntry` prop to pass through to `HistoryView`
   - Updated Props type to include the new prop

3. **Updated `App.tsx`:**
   - Extracted `removeEntry` from `useHistory` hook
   - Passed `removeEntry` as `onRemoveEntry` prop to `HistoryDialog`

**Note:** The `useHistory` hook already had a `removeEntry` function implemented - this change just wired it up to the UI.

**Modified files:**

- `src/components/HistoryView.tsx` - Added delete button UI and `onRemoveEntry` prop
- `src/components/HistoryDialog.tsx` - Added `onRemoveEntry` prop passthrough
- `src/App.tsx` - Connected `removeEntry` from useHistory to HistoryDialog

**Test files updated:**

- `src/components/HistoryView.test.tsx` - Added 3 new tests:
  - "shows delete button for each entry on hover"
  - "calls onRemoveEntry when clicking delete button"
  - "does not call onSelectEntry when clicking delete button"
  - Updated all existing tests to include the new `onRemoveEntry` prop
- `src/components/HistoryDialog.test.tsx` - Updated all tests to include `onRemoveEntry` prop

## 2025-01-15

### History autocomplete suggestions while typing

Added an autocomplete feature that shows matching history entries as suggestions when the user types 3 or more characters in the input field. Users can click on a suggestion or navigate with arrow keys and Enter to select, instantly loading the cached translation.

**Key changes:**

1. **Added `searchHistory` function to `useHistory` hook** (`src/hooks/useHistory.ts`):
   - Case-insensitive substring search across history entries
   - Returns entries where input text contains the search query
   - Returns empty array for empty or whitespace-only queries

2. **Updated `TranslateInput.tsx`** with suggestion dropdown:
   - Added `suggestions` and `onSelectSuggestion` props
   - Shows dropdown with matching history entries when 3+ characters typed
   - Limits display to 5 suggestions maximum
   - Supports keyboard navigation (ArrowDown/ArrowUp, Enter to select, Escape to dismiss)
   - Shows history icon next to each suggestion
   - Highlights selected item with blue background

3. **Updated `App.tsx`** to wire up the feature:
   - Added `searchHistory` from useHistory hook
   - Computed `historySuggestions` using useMemo based on input text
   - Passed suggestions and `handleSelectHistoryEntry` to TranslateInput

**Modified files:**

- `src/hooks/useHistory.ts` - Added `searchHistory` function
- `src/components/TranslateInput.tsx` - Added suggestion dropdown UI with keyboard navigation
- `src/App.tsx` - Connected history search to TranslateInput

**Test files updated:**

- `src/hooks/useHistory.test.ts` - Added 3 tests:
  - "searches history for matching entries"
  - "searches history case-insensitively"
  - "returns empty array for empty search query"
- `src/components/TranslateInput.test.tsx` - Added 6 tests in new "suggestions" describe block:
  - "does not show suggestions when less than 3 characters typed"
  - "shows suggestions when 3 or more characters match"
  - "limits suggestions to 5 items"
  - "calls onSelectSuggestion when clicking a suggestion"
  - "navigates suggestions with arrow keys and selects with Enter"
  - "hides suggestions when Escape is pressed"

## 2025-01-15

### Show the icon in the header

Added the app icon (translation speech bubbles) to the header, displayed next to the "Translate" title. This gives the app a stronger visual identity and branding.

**Key changes:**

1. **Updated `App.tsx`:**
   - Wrapped the h1 title in a flex container to include the icon
   - Added an `<img>` element referencing `/icon.svg` (the app's existing SVG icon from the public folder)
   - Applied `h-8 w-8 rounded-lg` classes for sizing and rounded corners
   - Icon sits to the left of the title with a small gap (`gap-2`)

**Modified files:**

- `src/App.tsx` - Added icon image to header

**Test files updated:**

- `src/App.test.tsx` - Added test "shows the app icon in the header" verifying the icon is rendered with correct source and styling
