/**
 * game.js - Game state manager.
 *
 * States: menu | playing | saves
 * Draws UI overlays, delegates gameplay to story/renderer/choices/saves modules.
 */

import config from './config.js';
import * as story from './story.js';
import * as renderer from './renderer.js';
import * as choices from './choices.js';
import * as saves from './saves.js';

let state   = 'menu';   // 'menu' | 'playing' | 'saves'
let cfg     = null;
let _canvas = null;
let _ctx    = null;
let paused  = false;
let hintTimer   = 5;   // seconds
let firstInput  = false;

// Menu button rectangles for click detection
let menuButtons = [];

// ---- Public API ----------------------------------------------------------

export function init(canvas, ctx, overrideConfig) {
  cfg     = overrideConfig || config;
  _canvas = canvas;
  _ctx    = ctx;

  story.init(cfg);
  renderer.init(cfg);
  choices.init(cfg);
  saves.init(cfg);
}

export function update(dt, canvas) {
  _canvas = canvas;
  if (state !== 'playing' || paused) return;

  if (hintTimer > 0 && !firstInput) {
    hintTimer -= dt;
  }

  renderer.update(dt);

  // Auto-advance if enabled and scene complete with no choices
  if (cfg.autoAdvance.enabled && story.isSceneComplete() && !story.hasChoices()) {
    renderer.tickAutoAdvance(dt);
    if (renderer.shouldAutoAdvance()) {
      advanceOrEnd();
    }
  }

  // Choice timeout
  if (story.isSceneComplete() && story.hasChoices() && cfg.choices.timeout > 0) {
    choices.tickTimeout(dt);
    if (choices.isTimedOut()) {
      story.selectChoice(0);
      onSceneChange();
    }
  }
}

export function draw(ctx, canvas) {
  ctx.fillStyle = cfg.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state === 'menu') {
    drawMenu(ctx, canvas);
  } else if (state === 'playing') {
    drawPlaying(ctx, canvas);
    if (paused) drawPauseOverlay(ctx, canvas);
  } else if (state === 'saves') {
    saves.draw(ctx, canvas);
  }
}

export function handleInput(type, event) {
  if (type === 'keydown') {
    const code = event.code;

    // Global keys
    if (code === 'Escape') {
      if (state === 'saves') {
        state = 'playing';
        return;
      }
      if (state === 'playing') {
        state = 'saves';
        return;
      }
    }

    if (state === 'playing' && code === 'KeyP') {
      paused = !paused;
      return;
    }

    if (state === 'menu') {
      if (code === 'Space' || code === 'Enter') {
        startNewGame();
      }
      return;
    }

    if (state === 'saves') {
      // Number keys 1-3 for save slots
      const num = parseInt(event.key, 10);
      if (num >= 1 && num <= cfg.saves.maxSlots) {
        handleSaveSlotSelect(num - 1);
      }
      return;
    }

    if (state === 'playing' && !paused) {
      if (!firstInput) { firstInput = true; hintTimer = 0; }

      // Number keys for choices
      if (story.isSceneComplete() && story.hasChoices()) {
        const num = parseInt(event.key, 10);
        const available = story.getCurrentChoices();
        if (num >= 1 && num <= available.length) {
          story.selectChoice(num - 1);
          onSceneChange();
          return;
        }
      }

      // Space/Enter: advance text or skip typewriter
      if (code === 'Space' || code === 'Enter') {
        if (!renderer.isComplete()) {
          renderer.skipTypewriter();
        } else if (story.isSceneComplete() && !story.hasChoices()) {
          advanceOrEnd();
        } else if (!story.isSceneComplete()) {
          story.advanceScene();
          renderer.resetTypewriter();
        }
      }
    }
  }

  if (type === 'click') {
    const { x, y } = event;

    if (!firstInput && state === 'playing') {
      firstInput = true;
      hintTimer = 0;
    }

    if (state === 'menu') {
      handleMenuClick(x, y);
      return;
    }

    if (state === 'saves') {
      const slotIndex = saves.checkClick(x, y);
      if (slotIndex === -2) {
        // Back button
        state = 'playing';
      } else if (slotIndex >= 0) {
        handleSaveSlotSelect(slotIndex);
      }
      return;
    }

    if (state === 'playing' && !paused) {
      // Check choice clicks
      if (story.isSceneComplete() && story.hasChoices()) {
        const idx = choices.checkClick(x, y);
        if (idx >= 0) {
          story.selectChoice(idx);
          onSceneChange();
          return;
        }
      }

      // Click to advance
      if (!renderer.isComplete()) {
        renderer.skipTypewriter();
      } else if (story.isSceneComplete() && !story.hasChoices()) {
        advanceOrEnd();
      } else if (!story.isSceneComplete()) {
        story.advanceScene();
        renderer.resetTypewriter();
      }
    }
  }
}

export function handleMouseMove(x, y) {
  if (state === 'playing' && story.isSceneComplete() && story.hasChoices()) {
    choices.updateHover(x, y);
  }
  if (state === 'menu') {
    // Track for button hover (visual only, no action needed)
  }
}

// ---- Internal helpers ----------------------------------------------------

function startNewGame() {
  state = 'playing';
  paused = false;
  hintTimer = 5;
  firstInput = false;
  story.startStory(cfg.story.startScene);
  renderer.resetTypewriter();
  choices.resetTimeout();
}

function continueGame() {
  if (saves.hasAutosave()) {
    const data = saves.loadAutosave();
    story.loadState(data);
    state = 'playing';
    paused = false;
    renderer.resetTypewriter();
  }
}

function onSceneChange() {
  renderer.resetTypewriter();
  choices.resetTimeout();
  saves.autosave(story.getState());
}

function advanceOrEnd() {
  const scene = story.getCurrentScene();
  if (scene && scene.ending) {
    // Return to menu after ending
    state = 'menu';
    return;
  }
  story.advanceScene();
  if (story.getCurrentScene()) {
    onSceneChange();
  } else {
    state = 'menu';
  }
}

function handleMenuClick(x, y) {
  for (const btn of menuButtons) {
    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
      btn.action();
      return;
    }
  }
}

function handleSaveSlotSelect(index) {
  if (state === 'saves' && story.getCurrentScene()) {
    // If playing, save to slot
    saves.saveSlot(index, story.getState());
  } else if (state === 'saves') {
    // If from menu, load from slot
    const data = saves.loadSlot(index);
    if (data) {
      story.loadState(data);
      state = 'playing';
      renderer.resetTypewriter();
    }
  }
}

// ---- UI overlays ---------------------------------------------------------

function drawMenu(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  menuButtons = [];

  // Title
  ctx.fillStyle    = cfg.colors.accent;
  ctx.font         = 'bold 48px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.game.title, cx, cy - 100);

  // Buttons
  const btnW = 240;
  const btnH = 50;
  const btnX = cx - btnW / 2;
  let   btnY = cy - 10;

  const buttons = [
    { label: 'New Story',    action: startNewGame },
    { label: 'Continue',     action: continueGame, disabled: !saves.hasAutosave() },
    { label: 'Load Game',    action: () => { state = 'saves'; }, disabled: false },
  ];

  for (const btn of buttons) {
    const alpha = btn.disabled ? 0.3 : 1;
    ctx.globalAlpha = alpha;

    ctx.fillStyle = cfg.colors.menuButton;
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.strokeStyle = cfg.colors.accent;
    ctx.lineWidth = 1;
    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.stroke();

    ctx.fillStyle = cfg.colors.text;
    ctx.font      = '20px sans-serif';
    ctx.fillText(btn.label, cx, btnY + btnH / 2);

    if (!btn.disabled) {
      menuButtons.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: btn.action });
    }

    ctx.globalAlpha = 1;
    btnY += btnH + 16;
  }

  // Hint
  ctx.font = '14px sans-serif';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = cfg.colors.text;
  ctx.fillText('Press SPACE or ENTER to start', cx, canvas.height - 40);
  ctx.globalAlpha = 1;
}

function drawPlaying(ctx, canvas) {
  // Scene description at top
  story.drawBackground(ctx, canvas);

  // Dialogue
  const scene = story.getCurrentScene();
  const dialogue = story.getCurrentDialogue();
  if (dialogue) {
    renderer.draw(ctx, canvas, dialogue, story.isSceneComplete());
  }

  // Choices
  if (story.isSceneComplete() && story.hasChoices()) {
    const available = story.getCurrentChoices();
    choices.draw(ctx, canvas, available);
  }

  // Continue indicator when scene complete, no choices, not at scene end dialogue
  if (renderer.isComplete() && story.isSceneComplete() && !story.hasChoices()) {
    const scene = story.getCurrentScene();
    if (scene && !scene.ending) {
      drawContinueIndicator(ctx, canvas);
    }
  }

  // Control hints
  drawControlHints(ctx, canvas);
}

function drawContinueIndicator(ctx, canvas) {
  const cx = canvas.width / 2;
  const y  = canvas.height - 30;
  const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = cfg.colors.accent;
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\u25BC', cx, y);
  ctx.globalAlpha = 1;
}

function drawControlHints(ctx, canvas) {
  if (hintTimer <= 0 || paused) return;

  let alpha = 1;
  if (hintTimer < 1) alpha = hintTimer;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = cfg.colors.text;
  ctx.font        = '13px sans-serif';
  ctx.textAlign   = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('SPACE: Advance | 1-4: Choose | ESC: Save | P: Pause', 12, canvas.height - 12);
  ctx.restore();
}

function drawPauseOverlay(ctx, canvas) {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 52px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 20);

  ctx.font = '22px sans-serif';
  ctx.fillText('Press P to resume', cx, cy + 30);
}

// ---- Utility -------------------------------------------------------------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
