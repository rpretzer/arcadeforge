# ArcadeForge Developer Guide

## Technical Stack
- **CLI:** Node.js + TypeScript, `@inquirer/prompts`, `chalk`, `fs-extra`, `sharp`, `zod`.
- **AI:** Provider abstraction layer supporting Google Gemini, OpenAI, Anthropic, and Ollama.
- **Templates:** Vanilla ES6 JavaScript + HTML5 Canvas (no build step).
- **Hub:** Next.js 14 (App Router) + Supabase + Tailwind CSS.

## Commands
- **Build CLI:** `npm run build:cli`
- **Run Hub:** `npm run dev:hub`
- **Run CLI from source:** `npm run arcadeforge -- [create|serve|remix|playtest|deploy|config]`
- **Global Link:** `cd cli && npm link` (may require sudo)

## Project Structure
- `cli/src/`
  - `index.ts`: Entry point and command router.
  - `conversation.ts`: Creative Partner (AI director) logic.
  - `ai.ts`: LLM integration layer (uses provider abstraction).
  - `providers/`: Provider adapters and shared interface.
    - `types.ts`: `LLMProvider`, `ChatSession`, `ProviderConfig` interfaces.
    - `index.ts`: Auto-detection and provider factory.
    - `google.ts`, `openai.ts`, `anthropic.ts`, `ollama.ts`: Individual adapters.
  - `settings.ts`: User config persistence (`~/.arcadeforge/config.json`).
  - `questionnaire.ts`: Interactive prompts for game creation.
  - `snapshot.ts`: Type definitions (`Genre`, `Vibe`, `VisualStyle`, etc.) and `buildSnapshot()`.
  - `validation.ts`: Zod schemas for per-genre config validation.
  - `generator.ts`: Template copier, config injector, README generator.
  - `templates/`: Per-genre config generators (`runner.ts`, `arena.ts`, `puzzle.ts`, `story.ts`, `rpg.ts`, `tower-defense.ts`, `racing.ts`, `escape.ts`).
  - `serve.ts`: Dev server with feedback widget injection.
  - `remix.ts`: AI-powered game iteration from playtest notes.
  - `playtest.ts`: Local playtest runner.
  - `deploy.ts`: Hub deployment and game submission.
  - `assets.ts`: Stability AI integration and image processing.
- `templates/`: Vanilla JS game engines (runner, arena, puzzle, story, rpg, tower-defense, racing).
- `hub/src/`: Next.js community platform (browse, play, rate, moderate games).

## Code Conventions
- **CLI:** Strict TypeScript. Use `chalk` for color-coded output.
- **Templates:** Modular Vanilla JS. Every tunable must live in `src/config.js`.
- **Validation:** All AI-generated configs pass through Zod schemas before use.
- **Providers:** All LLM calls go through the `LLMProvider` interface, never directly to an SDK.
- **A11Y:** Ensure CLI has focus states and Hub components have ARIA roles.
