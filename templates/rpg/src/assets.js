/**
 * assets.js - Simple asynchronous asset loader.
 * Loads images from ../assets/ with fallback to primitive drawing.
 */

const assets = {
  images: {},
  loaded: false,
};

const ASSET_KEYS = ['player', 'enemy', 'npc', 'item', 'tileset'];

export async function loadAssets() {
  const loadPromises = [];

  for (const key of ASSET_KEYS) {
    loadPromises.push(new Promise((resolve) => {
      const png = new Image();
      png.onload = () => {
        assets.images[key] = png;
        resolve();
      };
      png.onerror = () => {
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

  await Promise.all(loadPromises);
  assets.loaded = true;
  return assets;
}

export function getAsset(key) {
  return assets.images[key] || null;
}
