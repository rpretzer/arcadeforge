/**
 * minimap.js - Small track overview in corner.
 *
 * Shows the track outline with dots for player and opponents.
 * Positioned in the top-right corner (150x100px).
 */

import config from './config.js';
import { getPath, trackToWorld } from './track.js';

const MAP_W = 150;
const MAP_H = 100;
const MARGIN = 10;
const PADDING = 8;

let scaledPath = [];
let scaleX = 1;
let scaleY = 1;
let offsetX = 0;
let offsetY = 0;

export function init() {
  const path = getPath();
  if (path.length === 0) return;

  // Find bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of path) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const pathW = maxX - minX || 1;
  const pathH = maxY - minY || 1;
  const innerW = MAP_W - PADDING * 2;
  const innerH = MAP_H - PADDING * 2;

  scaleX = innerW / pathW;
  scaleY = innerH / pathH;
  const scale = Math.min(scaleX, scaleY);
  scaleX = scale;
  scaleY = scale;

  offsetX = -minX;
  offsetY = -minY;

  // Center within minimap
  const scaledW = pathW * scale;
  const scaledH = pathH * scale;
  offsetX = -minX + (innerW - scaledW) / (2 * scale);
  offsetY = -minY + (innerH - scaledH) / (2 * scale);

  // Pre-compute scaled path (subsample for performance)
  scaledPath = [];
  const step = Math.max(1, Math.floor(path.length / 200));
  for (let i = 0; i < path.length; i += step) {
    scaledPath.push({
      x: (path[i].x + offsetX) * scaleX + PADDING,
      y: (path[i].y + offsetY) * scaleY + PADDING,
    });
  }
}

export function draw(ctx, canvas, playerTrackPos, playerLateral, opponentData) {
  const mapX = canvas.width - MAP_W - MARGIN;
  const mapY = MARGIN;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(mapX, mapY, MAP_W, MAP_H);
  ctx.strokeStyle = config.colors.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(mapX, mapY, MAP_W, MAP_H);

  // Track outline
  if (scaledPath.length < 2) return;

  ctx.strokeStyle = config.colors.trackEdge;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(mapX + scaledPath[0].x, mapY + scaledPath[0].y);
  for (let i = 1; i < scaledPath.length; i++) {
    ctx.lineTo(mapX + scaledPath[i].x, mapY + scaledPath[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Opponent dots
  for (const opp of opponentData) {
    const pos = trackToWorld(opp.trackPos, 0);
    const sx = (pos.x + offsetX) * scaleX + PADDING;
    const sy = (pos.y + offsetY) * scaleY + PADDING;

    ctx.fillStyle = opp.color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(mapX + sx, mapY + sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player dot
  const playerPos = trackToWorld(playerTrackPos, 0);
  const px = (playerPos.x + offsetX) * scaleX + PADDING;
  const py = (playerPos.y + offsetY) * scaleY + PADDING;

  ctx.fillStyle = config.colors.player;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(mapX + px, mapY + py, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bright outline for player
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
}
