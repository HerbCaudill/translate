### To do

#### 3. API key flow

- [x] Create ApiKeyPrompt component
- [ ] Add API key validation (test call to Anthropic)
- [ ] Store API key in localStorage
- [ ] Show prompt on first run or when key is missing

#### 4. Anthropic client

- [ ] Install @anthropic-ai/sdk
- [ ] Create anthropic.ts client wrapper
- [ ] Create completion detection function (Haiku)
- [ ] Create translation function (Opus)
- [ ] Define default prompts in prompts.ts

#### 5. Main translation flow

- [ ] Create TranslateInput component with autofocus q
- [ ] Implement debounce hook (500ms)
- [ ] Create useCompletionCheck hook (calls Haiku)
- [ ] Create useTranslation hook (calls Opus)
- [ ] Wire up: input → debounce → detection → translation

#### 6. Fallback translate button

- [ ] Show button after 2s if auto-detection hasn't triggered
- [ ] Hide button when translation starts
- [ ] Button triggers translation directly

#### 7. Results UI

- [ ] Create TranslationCard component (single language)
- [ ] Display multiple translation options with explanations
- [ ] Create TranslationResults component (grid of cards)
- [ ] Add loading skeleton while translating

#### 8. Settings

- [ ] Create SettingsDialog component
- [ ] Languages list: add, remove, reorder
- [ ] Prompt editor: textarea with default prompt
- [ ] Reset prompt to default button
- [ ] Settings gear icon in header

#### 9. History

- [ ] Save each translation to localStorage
- [ ] Create HistoryView component
- [ ] Search/filter history by input text
- [ ] Click history item to show translation again
- [ ] Clear history option

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
