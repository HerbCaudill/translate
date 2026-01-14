# Progress Log

## 2025-01-15

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
