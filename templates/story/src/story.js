/**
 * story.js - Core narrative engine.
 *
 * Manages scene progression, dialogue indexing, branching choices,
 * and condition flags for gating story paths.
 */

let cfg           = null;
let scenes        = {};
let characters    = {};
let currentSceneId = null;
let dialogueIndex = 0;
let storyFlags    = {};

// ---- Public API ----------------------------------------------------------

export function init(config) {
  cfg        = config;
  scenes     = config.story.scenes;
  characters = config.story.characters;
  currentSceneId = null;
  dialogueIndex  = 0;
  storyFlags     = {};
}

export function startStory(sceneId) {
  currentSceneId = sceneId || cfg.story.startScene;
  dialogueIndex  = 0;
  storyFlags     = {};
  applySceneEffects();
}

export function getCurrentScene() {
  if (!currentSceneId || !scenes[currentSceneId]) return null;
  return scenes[currentSceneId];
}

export function getCurrentDialogue() {
  const scene = getCurrentScene();
  if (!scene || !scene.dialogue) return null;
  // Return the current dialogue entry (up to dialogueIndex)
  if (dialogueIndex >= scene.dialogue.length) {
    return scene.dialogue[scene.dialogue.length - 1];
  }
  return scene.dialogue[dialogueIndex];
}

export function getCurrentChoices() {
  const scene = getCurrentScene();
  if (!scene || !scene.choices) return [];
  return scene.choices.filter((choice) => {
    if (!choice.condition) return true;
    return storyFlags[choice.condition] === true;
  });
}

export function isSceneComplete() {
  const scene = getCurrentScene();
  if (!scene || !scene.dialogue) return true;
  return dialogueIndex >= scene.dialogue.length - 1;
}

export function hasChoices() {
  return getCurrentChoices().length > 0;
}

export function selectChoice(index) {
  const available = getCurrentChoices();
  if (index < 0 || index >= available.length) return;

  const choice = available[index];

  // Apply effects
  if (choice.effects && choice.effects.setFlags) {
    for (const flag of choice.effects.setFlags) {
      storyFlags[flag] = true;
    }
  }

  // Navigate
  if (choice.next) {
    currentSceneId = choice.next;
    dialogueIndex  = 0;
    applySceneEffects();
  }
}

export function advanceScene() {
  const scene = getCurrentScene();
  if (!scene) return;

  // If dialogue not yet complete, advance index
  if (dialogueIndex < scene.dialogue.length - 1) {
    dialogueIndex++;
    return;
  }

  // Scene complete, no choices — follow scene.next
  if (!scene.choices || getCurrentChoices().length === 0) {
    if (scene.next) {
      currentSceneId = scene.next;
      dialogueIndex  = 0;
      applySceneEffects();
    } else {
      // No next scene, story ended
      currentSceneId = null;
    }
  }
}

export function getState() {
  return {
    sceneId:       currentSceneId,
    dialogueIndex: dialogueIndex,
    flags:         { ...storyFlags },
    timestamp:     Date.now(),
  };
}

export function loadState(stateData) {
  if (!stateData) return;
  currentSceneId = stateData.sceneId;
  dialogueIndex  = stateData.dialogueIndex || 0;
  storyFlags     = stateData.flags ? { ...stateData.flags } : {};
}

export function drawBackground(ctx, canvas) {
  const scene = getCurrentScene();
  if (!scene || !scene.description) return;

  ctx.save();
  ctx.fillStyle    = cfg.colors.text;
  ctx.globalAlpha  = 0.4;
  ctx.font         = 'italic 16px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(scene.description, canvas.width / 2, 24);
  ctx.restore();
}

export function getCharacter(speakerId) {
  return characters[speakerId] || { name: speakerId, color: cfg.colors.text };
}

// ---- Internal helpers ----------------------------------------------------

function applySceneEffects() {
  const scene = getCurrentScene();
  if (!scene || !scene.effects) return;
  if (scene.effects.setFlags) {
    for (const flag of scene.effects.setFlags) {
      storyFlags[flag] = true;
    }
  }
}
