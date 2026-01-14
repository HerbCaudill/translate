# Progress Log

## 2025-01-14

### Make the submit button blue

Changed the submit button in `TranslateInput.tsx` to use blue styling (`bg-blue-600 hover:bg-blue-500 text-white`) instead of the default grey primary color. This is a direct Tailwind class override on the Button component.

### Make the default languages Catalan, Spanish, French, and Portuguese

Updated `DEFAULT_SETTINGS` in `src/hooks/useSettings.ts` to use Catalan (ca), Spanish (es), French (fr), and Portuguese (pt) instead of the previous Spanish, French, German defaults. Note: existing users who have already saved their settings will not see this change since their settings are persisted in localStorage.
