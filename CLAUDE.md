# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Universal Translator is a React/TypeScript PWA that uses Claude AI for intelligent, context-aware translations into multiple user-selected languages. Features translation history with search, mobile-optimized design with swipe gestures, and 100+ languages.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # TypeScript check + Vite production build
pnpm test         # Run Vitest unit tests
pnpm test:e2e     # Run Playwright end-to-end tests
pnpm typecheck    # TypeScript type checking only
pnpm format       # Format code with Prettier
pnpm icons        # Regenerate PNG icons from SVG
pnpm encrypt-key  # Generate src/encrypted-key.json from an API key + password
```

## Tech Stack

- React 19, TypeScript 5.7, Vite 6.0, pnpm
- Tailwind CSS 4.0 with shadcn/ui components
- Anthropic SDK (Claude Sonnet 4 for translations)
- Vitest + Testing Library for unit tests, Playwright for E2E
- PWA with Workbox service worker caching

## Architecture

### Data Flow

1. **App.tsx** orchestrates all state via custom hooks
2. **useSettings** manages the resolved plaintext API key and selected languages in `translate:settings` (localStorage)
3. **useHistory** manages translation cache and history (localStorage)
4. **useTranslation** handles API calls to Claude

### Translation Pipeline

- Input checked against cache via `findByInput()`
- If not cached, calls `translate()` in `src/lib/anthropic.ts`
- Retries with exponential backoff on rate limiting (max 3 retries)
- Results structured with meanings and options per language
- Stored in history on save

### Encrypted API key flow

- `pnpm encrypt-key` writes `src/encrypted-key.json` using an API key from `.env` or an interactive prompt plus a user-supplied password
- The script uses PBKDF2 + AES-256-GCM to produce `{ salt, iv, ciphertext }`
- `src/components/ApiKeyPrompt.tsx` lazy-loads `src/encrypted-key.json` if present
- If the user enters text starting with `sk-ant-`, the app treats it as a raw Anthropic API key; otherwise, when `encrypted-key.json` exists, the app treats the input as the decryption password and decrypts client-side via `@herbcaudill/easy-api-key`
- After decryption and validation, the plaintext API key is stored in localStorage through `useSettings`; the encrypted file is only a bootstrap mechanism, not the app's persisted storage format
- `VITE_ANTHROPIC_API_KEY` still takes precedence over any stored key
- The current Anthropic API key source of truth is `~/.secrets` (`xx_ANTHROPIC_API_KEY`); when rotating the encrypted bootstrap key, ask the user which encryption password to use

### Key Files

- [App.tsx](src/App.tsx) - Main orchestration
- [ApiKeyPrompt.tsx](src/components/ApiKeyPrompt.tsx) - Raw-key entry or password-based client-side decryption
- [useSettings.ts](src/hooks/useSettings.ts) - localStorage-backed settings with env var precedence
- [anthropic.ts](src/lib/anthropic.ts) - Claude API integration with retries
- [TranslateInput.tsx](src/components/TranslateInput.tsx) - Input with history suggestions
- [scripts/encrypt-key.ts](scripts/encrypt-key.ts) - CLI helper for generating `src/encrypted-key.json`
- [.pi/skills/update-api-key/SKILL.md](.pi/skills/update-api-key/SKILL.md) - Local skill for rotating the Anthropic API key from `~/.secrets`

## Code Conventions

- Each component and helper function in its own file
- Components have a `Props` type at the end of the file
- Use `cx` from clsx for combining class names (not string interpolation)
- Named exports only (no default exports)
- Test files named `*.test.ts` or `*.test.tsx`

## Testing

- Vitest with jsdom environment and Testing Library
- E2E with Playwright using accessible selectors (roles, labels, visible text)
- When needed, use domain data attributes like `data-*`

## Configuration

- Path alias: `@/*` → `./src/*`
- Prettier: 100 chars, 2 spaces, no semicolons, double quotes, trailing commas
- PWA theme color: `#2563eb` (blue-600)
- Environment: `VITE_ANTHROPIC_API_KEY` for Claude API; this overrides any API key saved in localStorage
- Optional encrypted bootstrap file: `src/encrypted-key.json`

## Issue Tracking

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```
