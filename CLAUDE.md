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
2. **useSettings** manages API key and selected languages (localStorage)
3. **useHistory** manages translation cache and history (localStorage)
4. **useTranslation** handles API calls to Claude

### Translation Pipeline

- Input checked against cache via `findByInput()`
- If not cached, calls `translateAll()` in `src/lib/anthropic.ts`
- Retries with exponential backoff on rate limiting (max 3 retries)
- Results structured with meanings and options per language
- Stored in history on save

### Key Files

- [App.tsx](src/App.tsx) - Main orchestration
- [anthropic.ts](src/lib/anthropic.ts) - Claude API integration with retries
- [useTranslation.ts](src/hooks/useTranslation.ts) - Translation state management
- [TranslateInput.tsx](src/components/TranslateInput.tsx) - Input with history suggestions

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
- Environment: `VITE_ANTHROPIC_API_KEY` for Claude API
