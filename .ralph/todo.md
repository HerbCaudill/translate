### To do

#### 7. Results UI

- [x] Create TranslationCard component (single language)
- [x] Display multiple translation options with explanations
- [x] Create TranslationResults component (grid of cards)
- [x] Add loading skeleton while translating

#### 8. Settings

- [x] Create SettingsDialog component
- [x] Settings gear icon in header
- [x] Languages list: add, remove, reorder
- [x] Prompt editor: textarea with default prompt
- [x] Reset prompt to default button

#### 9. History

- [x] Save each translation to localStorage
- [x] Create HistoryView component
- [x] Search/filter history by input text
- [x] Click history item to show translation again
- [x] Clear history option

#### 10. Error handling

- [ ] Install sonner for toast notifications
- [ ] Show toast on API errors
- [ ] Add retry button to error toasts
- [ ] Handle rate limiting gracefully

#### 11. Polish

- [ ] Loading states for all async operations
- [ ] Escape key clears input and results
- [ ] Empty state when no translations yet
- [ ] Responsive layout for mobile

#### 12. PWA finalization

- [ ] Configure manifest (name, icons, theme color)
- [ ] Add service worker for offline shell
- [ ] Test install prompt on desktop and mobile

### Done

#### 6. Fallback

- [x] Try to translate after 2s if auto-detection hasn't triggered

#### 5. Main translation flow

- [x] Create TranslateInput component with autofocus
- [x] Implement debounce hook (500ms)
- [x] Create useCompletionCheck hook (calls Haiku)
- [x] Create useTranslation hook (calls Opus)
- [x] Wire up: input → debounce → detection → translation

#### 4. Anthropic client

- [x] Install @anthropic-ai/sdk
- [x] Create anthropic.ts client wrapper
- [x] Create completion detection function (Haiku)
- [x] Create translation function (Opus)
- [x] Define default prompts in prompts.ts

#### 3. API key flow

- [x] Create ApiKeyPrompt component
- [x] Store API key in localStorage
- [x] Show prompt on first run or when key is missing
- [x] Add API key validation (test call to Anthropic)

#### 2. Core types and storage

- [x] Define TypeScript types (Settings, Translation, HistoryEntry)
- [x] Create localStorage helper functions (get, set, remove)
- [x] Create useSettings hook
- [x] Create useHistory hook

#### 1. Project setup

- [x] Initialize Vite project with React + TypeScript
- [x] Install and configure Tailwind CSS v4
- [x] Install and configure shadcn/ui
- [x] Set up PWA with vite-plugin-pwa
- [x] Add IBM Plex fonts
- [x] Create folder structure (components, hooks, lib, types)
