/**
 * Tower Defense - Path / Enemy Movement
 *
 * Converts grid waypoints to pixel waypoints.
 * Provides interpolation for enemies to follow the path smoothly.
 */

import config from './config.js';
import { getCellSize } from './grid.js';

let pixelWaypoints = [];
let totalPathLength = 0;
let segmentLengths = [];

export function init() {
  const cs = getCellSize();
  pixelWaypoints = config.path.map(wp => ({
    x: wp.x * cs + cs / 2,
    y: wp.y * cs + cs / 2,
  }));

  // Precompute segment lengths
  segmentLengths = [];
  totalPathLength = 0;
  for (let i = 0; i < pixelWaypoints.length - 1; i++) {
    const dx = pixelWaypoints[i + 1].x - pixelWaypoints[i].x;
    const dy = pixelWaypoints[i + 1].y - pixelWaypoints[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalPathLength += len;
  }
}

/**
 * Get position along the path given a distance traveled.
 * Returns { x, y, done } where done=true if past the end.
 */
export function getPositionAtDistance(distance) {
  if (distance <= 0) {
    return { x: pixelWaypoints[0].x, y: pixelWaypoints[0].y, done: false };
  }

  let remaining = distance;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (remaining <= segmentLengths[i]) {
      const t = remaining / segmentLengths[i];
      const ax = pixelWaypoints[i].x;
      const ay = pixelWaypoints[i].y;
      const bx = pixelWaypoints[i + 1].x;
      const by = pixelWaypoints[i + 1].y;
      return {
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t,
        done: false,
      };
    }
    remaining -= segmentLengths[i];
  }

  // Past the end
  const last = pixelWaypoints[pixelWaypoints.length - 1];
  return { x: last.x, y: last.y, done: true };
}

export function getTotalLength() {
  return totalPathLength;
}

export function getStartPosition() {
  return { x: pixelWaypoints[0].x, y: pixelWaypoints[0].y };
}
