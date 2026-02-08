# ArcadeForge Developer Guide

## Technical Stack
- **CLI:** Node.js + TypeScript, `@inquirer/prompts`, `sharp` (Image processing).
- **AI:** Google Gemini 2.0 (Logic/Chat), Stability AI (Asset Generation).
- **Templates:** Vanilla ES6 JavaScript (No build step).
- **Hub:** Next.js 14 (App Router) + Supabase + Tailwind CSS.

## Commands
- **Build CLI:** `npm run build:cli`
- **Run Hub:** `npm run dev:hub`
- **Game Dev:** `node cli/dist/index.js [create|serve|remix|deploy]`

## Project Structure
- `cli/src/`
  - `index.ts`: Entry point & command router.
  - `conversation.ts`: Creative Partner (Director) logic.
  - `ai.ts`: Gemini API integration.
  - `assets.ts`: Stability AI & Image processing logic.
  - `serve.ts`: Dev server with feedback injection.
  - `remix.ts`: Iterative AI logic.
- `templates/`: Vanilla JS engines for Runner, Arena, and Puzzle.
- `hub/src/`: Next.js application for the community site.

## Code Conventions
- **CLI:** Strict TypeScript. Use `chalk` for color-coded output.
- **Templates:** Modular Vanilla JS. Every tunable must live in `src/config.js`.
- **A11Y:** Ensure CLI has focus states and Hub components have ARIA roles.