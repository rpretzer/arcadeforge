/**
 * assets.js - Simple asynchronous asset loader.
 * Supports both high-fidelity PNGs and placeholder SVGs.
 */

const assets = {
  images: {},
  loaded: false,
};

const ASSET_KEYS = ['player', 'obstacle', 'enemy', 'bullet', 'bg', 'piece'];

export async function loadAssets() {
  const loadPromises = [];

  for (const key of ASSET_KEYS) {
    loadPromises.push(new Promise((resolve) => {
      // Try PNG first
      const png = new Image();
      png.onload = () => {
        assets.images[key] = png;
        resolve();
      };
      png.onerror = () => {
        // Try SVG fallback
        const svg = new Image();
        svg.onload = () => {
          assets.images[key] = svg;
          resolve();
        };
        svg.onerror = () => {
          resolve(); // Both failed, fall back to primitive drawing
        };
        svg.src = `assets/${key}.svg`;
      };
      png.src = `assets/${key}.png`;
    }));
  }

  // Handle puzzle piece variations
  for (let i = 0; i < 10; i++) {
    const key = `piece_${i}`;
    loadPromises.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { assets.images[key] = img; resolve(); };
      img.onerror = () => {
        // Fallback to generic piece if piece_N doesn't exist
        const generic = assets.images['piece'];
        if (generic) assets.images[key] = generic;
        resolve();
      };
      img.src = `assets/${key}.svg`;
    }));
  }

  await Promise.all(loadPromises);
  assets.loaded = true;
  return assets;
}

export function getAsset(key) {
  return assets.images[key] || null;
}