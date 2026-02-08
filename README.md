# 🎮 ArcadeForge

**ArcadeForge** is an AI-powered game creation platform that transforms your ideas into playable browser games in minutes. It bridges the gap between imagination and implementation using a "Wise Director" AI, generative asset pipelines, and an iterative feedback loop.

## 🚀 Key Features

-   **Creative Partner Mode:** Brainstorm with a "Veteran Game Director" AI that helps refine your mechanics and theme.
-   **Stability AI Assets:** High-fidelity, transparent sprites generated on-the-fly to match your game's vibe.
-   **Smart Dev Server:** Live playtesting with an injected feedback widget—take notes while you play.
-   **AI Remixing:** Use the `remix` command to let the AI re-balance your game based on your playtest notes.
-   **One-Click Deploy:** Deploy to Vercel and auto-submit to the community Hub with a single command.

## 🛠 Commands

| Command | Description |
| :--- | :--- |
| `arcadeforge create` | Launch the interactive wizard or Creative Partner mode. |
| `arcadeforge serve` | Run a local dev server with the live feedback widget. |
| `arcadeforge remix` | Iterate on your game using AI and your saved playtest notes. |
| `arcadeforge deploy` | Deploy to the web and submit to the ArcadeForge Hub. |
| `arcadeforge --help` | Show all available commands and flags. |

## 🏗 Project Structure

-   `cli/`: The TypeScript-based CLI engine.
-   `templates/`: Vanilla JS game engines (Runner, Arena Shooter, Puzzle).
-   `hub/`: The Next.js + Supabase community platform for sharing and discovery.

## 🚦 Getting Started

1.  **Clone the repo and install dependencies:**
    ```bash
    npm install
    ```

2.  **Set your API keys:**
    ```bash
    export GOOGLE_API_KEY=your_gemini_key
    export STABILITY_API_KEY=your_stability_key
    ```

3.  **Build and Run:**
    ```bash
    npm run build:cli
    # Use the linked binary or run via node
    node cli/dist/index.js create
    ```

## 📜 License

MIT