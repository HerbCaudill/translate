# Progress Log

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
