/**
 * track.js - Track definition and rendering.
 *
 * Builds a closed-loop track path from config segments.
 * Each entity has a trackPosition (0-1 per lap) and lateral offset.
 * Provides coordinate conversion: track position -> canvas position.
 */

import config from './config.js';

let path = [];        // Array of {x, y} points along the center line
let totalLength = 0;  // Total track path length in pixels
let segmentLengths = []; // cumulative lengths at each path point

/**
 * Build the track path from config segments.
 * Called once at init.
 */
export function buildTrack() {
  path = [];
  segmentLengths = [];
  totalLength = 0;

  let x = 0;
  let y = 0;
  let angle = 0; // radians, 0 = right

  const STEP = 4; // resolution: one point every 4px

  path.push({ x, y });
  segmentLengths.push(0);

  for (const seg of config.track.segments) {
    if (seg.type === 'straight') {
      const len = seg.length;
      const steps = Math.ceil(len / STEP);
      const dx = Math.cos(angle) * (len / steps);
      const dy = Math.sin(angle) * (len / steps);
      for (let i = 0; i < steps; i++) {
        x += dx;
        y += dy;
        totalLength += len / steps;
        path.push({ x, y });
        segmentLengths.push(totalLength);
      }
    } else if (seg.type === 'curve') {
      const angleRad = (seg.angle * Math.PI) / 180;
      const radius = seg.radius;
      const arcLen = Math.abs(angleRad) * radius;
      const steps = Math.ceil(arcLen / STEP);
      const angleStep = angleRad / steps;

      // Center of the arc circle (turn left = positive angle)
      const cx = x - Math.sin(angle) * radius;
      const cy = y + Math.cos(angle) * radius;
      let currentAngle = Math.atan2(y - cy, x - cx);

      for (let i = 0; i < steps; i++) {
        currentAngle += angleStep;
        x = cx + Math.cos(currentAngle) * radius;
        y = cy + Math.sin(currentAngle) * radius;
        totalLength += arcLen / steps;
        path.push({ x, y });
        segmentLengths.push(totalLength);
      }
      angle += angleRad;
    }
  }
}

/**
 * Get the total track path length.
 */
export function getTrackLength() {
  return totalLength;
}

/**
 * Get number of path points.
 */
export function getPathPointCount() {
  return path.length;
}

/**
 * Convert a track position (0 to 1) and lateral offset to canvas coords.
 * lateralOffset: negative = left, positive = right relative to travel direction.
 * Returns { x, y, angle }.
 */
export function trackToWorld(trackPos, lateralOffset) {
  // Wrap to 0-1
  let t = trackPos % 1;
  if (t < 0) t += 1;

  const dist = t * totalLength;

  // Find the two path points surrounding this distance
  let idx = 0;
  for (let i = 1; i < segmentLengths.length; i++) {
    if (segmentLengths[i] >= dist) {
      idx = i - 1;
      break;
    }
    if (i === segmentLengths.length - 1) {
      idx = i - 1;
    }
  }

  const nextIdx = (idx + 1) % path.length;
  const segStart = segmentLengths[idx];
  const segEnd = segmentLengths[nextIdx] || totalLength;
  const segLen = segEnd - segStart;
  const frac = segLen > 0 ? (dist - segStart) / segLen : 0;

  const p0 = path[idx];
  const p1 = path[nextIdx];

  const cx = p0.x + (p1.x - p0.x) * frac;
  const cy = p0.y + (p1.y - p0.y) * frac;

  // Track angle at this point
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);

  // Perpendicular for lateral offset
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  return {
    x: cx + perpX * lateralOffset,
    y: cy + perpY * lateralOffset,
    angle,
  };
}

/**
 * Check if a world position is within the track boundaries.
 * Returns distance from center (0 = on center, positive = how far off).
 */
export function distanceFromTrackCenter(worldX, worldY) {
  let minDist = Infinity;
  for (let i = 0; i < path.length; i += 3) { // sample every 3rd for speed
    const dx = worldX - path[i].x;
    const dy = worldY - path[i].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Get approximate track position (0-1) for a world coordinate.
 * Used for lap tracking and position calculation.
 */
export function worldToTrackPos(worldX, worldY) {
  let minDist = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < path.length; i += 2) {
    const dx = worldX - path[i].x;
    const dy = worldY - path[i].y;
    const d = dx * dx + dy * dy;
    if (d < minDist) {
      minDist = d;
      bestIdx = i;
    }
  }
  return segmentLengths[bestIdx] / totalLength;
}

/**
 * Draw the track on the canvas.
 * Camera offset is applied so the player stays centered.
 */
export function drawTrack(ctx, camX, camY) {
  const halfWidth = config.track.width / 2;
  const cfg = config.colors;

  // Draw track surface as a thick polyline
  ctx.save();
  ctx.translate(-camX, -camY);

  // Track surface
  ctx.strokeStyle = cfg.track;
  ctx.lineWidth = config.track.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  // Track edge lines
  ctx.strokeStyle = cfg.trackEdge;
  ctx.lineWidth = 2;

  // Left edge
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const nextI = (i + 1) % path.length;
    const angle = Math.atan2(path[nextI].y - path[i].y, path[nextI].x - path[i].x);
    const px = path[i].x + (-Math.sin(angle)) * halfWidth;
    const py = path[i].y + (Math.cos(angle)) * halfWidth;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Right edge
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const nextI = (i + 1) % path.length;
    const angle = Math.atan2(path[nextI].y - path[i].y, path[nextI].x - path[i].x);
    const px = path[i].x + (-Math.sin(angle)) * (-halfWidth);
    const py = path[i].y + (Math.cos(angle)) * (-halfWidth);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Start/finish line (checkered pattern at trackPos = 0)
  const start = trackToWorld(0, 0);
  const perpX = -Math.sin(start.angle);
  const perpY = Math.cos(start.angle);
  const checkerSize = 10;
  const numCheckers = Math.floor(config.track.width / checkerSize);

  for (let i = -numCheckers / 2; i < numCheckers / 2; i++) {
    for (let j = -1; j <= 0; j++) {
      const isWhite = (Math.floor(i + numCheckers / 2) + j) % 2 === 0;
      ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
      const sx = start.x + perpX * (i * checkerSize) + Math.cos(start.angle) * (j * checkerSize);
      const sy = start.y + perpY * (i * checkerSize) + Math.sin(start.angle) * (j * checkerSize);
      ctx.fillRect(sx, sy, checkerSize, checkerSize);
    }
  }

  ctx.restore();
}

/**
 * Get the raw path points (for minimap rendering).
 */
export function getPath() {
  return path;
}
