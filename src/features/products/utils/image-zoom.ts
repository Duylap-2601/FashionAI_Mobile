// Pure math for the full-screen product image viewer. Kept free of React Native
// imports so the gesture rules can be unit tested.

export interface ZoomPoint {
  x: number;
  y: number;
}

export interface ZoomSize {
  width: number;
  height: number;
}

/** Transform applied around the viewport centre: translate, then scale. */
export interface ZoomTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface ZoomRect extends ZoomPoint, ZoomSize {}

export interface TouchSample extends ZoomPoint {
  time: number;
}

export const MIN_ZOOM_SCALE = 1;
// Same limits as FE ProductImageViewer: zoom stops at 3.5x and a double
// click/tap jumps to 2.2x.
export const MAX_ZOOM_SCALE = 3.5;
export const DOUBLE_TAP_ZOOM_SCALE = 2.2;

const ZOOMED_SCALE_THRESHOLD = 1.01;
const DOUBLE_TAP_MAX_DELAY_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE = 40;
const TAP_MAX_DURATION_MS = 250;
const TAP_MAX_MOVEMENT = 10;

export const IDENTITY_ZOOM: ZoomTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

function clamp(value: number, min: number, max: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  // Normalise -0 so callers never see a signed zero.
  return clamped === 0 ? 0 : clamped;
}

export function clampZoomScale(scale: number): number {
  if (!Number.isFinite(scale)) return MIN_ZOOM_SCALE;
  return clamp(scale, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE);
}

export function isZoomedScale(scale: number): boolean {
  return scale > ZOOMED_SCALE_THRESHOLD;
}

/**
 * Keeps the scaled image covering the viewport: the image can move at most
 * half of the extra size it gained from scaling, on each axis.
 */
export function clampZoomTransform(
  transform: ZoomTransform,
  viewport: ZoomSize,
): ZoomTransform {
  const scale = clampZoomScale(transform.scale);
  const limitX = Math.max(0, ((scale - 1) * viewport.width) / 2);
  const limitY = Math.max(0, ((scale - 1) * viewport.height) / 2);
  return {
    scale,
    translateX: clamp(transform.translateX, -limitX, limitX),
    translateY: clamp(transform.translateY, -limitY, limitY),
  };
}

/** Back to the unzoomed image once the scale is effectively 1. */
export function settleZoomTransform(
  transform: ZoomTransform,
  viewport: ZoomSize,
): ZoomTransform {
  const clamped = clampZoomTransform(transform, viewport);
  return isZoomedScale(clamped.scale) ? clamped : IDENTITY_ZOOM;
}

/**
 * Two-finger pinch. Scales around the viewport centre (the offset scales with
 * it) and follows the movement of the point between the two fingers.
 */
export function getPinchZoomTransform(
  start: ZoomTransform,
  startDistance: number,
  currentDistance: number,
  centroidDelta: ZoomPoint,
  viewport: ZoomSize,
): ZoomTransform {
  if (startDistance <= 0 || currentDistance <= 0) {
    return clampZoomTransform(start, viewport);
  }

  const scale = clampZoomScale(start.scale * (currentDistance / startDistance));
  const ratio = scale / clampZoomScale(start.scale);
  return clampZoomTransform(
    {
      scale,
      translateX: start.translateX * ratio + centroidDelta.x,
      translateY: start.translateY * ratio + centroidDelta.y,
    },
    viewport,
  );
}

/** One-finger drag of an already zoomed image. */
export function getPanZoomTransform(
  start: ZoomTransform,
  delta: ZoomPoint,
  viewport: ZoomSize,
): ZoomTransform {
  return clampZoomTransform(
    {
      scale: start.scale,
      translateX: start.translateX + delta.x,
      translateY: start.translateY + delta.y,
    },
    viewport,
  );
}

/**
 * Double tap: zoom in so the tapped point stays under the finger, or reset
 * when the image is already zoomed. `tapPoint` is relative to the viewport's
 * top-left corner.
 */
export function getDoubleTapZoomTransform(
  current: ZoomTransform,
  tapPoint: ZoomPoint,
  viewport: ZoomSize,
): ZoomTransform {
  if (isZoomedScale(current.scale)) return IDENTITY_ZOOM;

  const scale = DOUBLE_TAP_ZOOM_SCALE;
  const focusX = tapPoint.x - viewport.width / 2;
  const focusY = tapPoint.y - viewport.height / 2;
  return clampZoomTransform(
    {
      scale,
      translateX: -(scale - 1) * focusX,
      translateY: -(scale - 1) * focusY,
    },
    viewport,
  );
}

/**
 * Rect in unzoomed content coordinates for iOS `scrollResponderZoomTo`,
 * centred on the tapped point and kept inside the content.
 */
export function getZoomRect(
  tapPoint: ZoomPoint,
  viewport: ZoomSize,
  scale: number = DOUBLE_TAP_ZOOM_SCALE,
): ZoomRect {
  const safeScale = clampZoomScale(scale);
  const width = viewport.width / safeScale;
  const height = viewport.height / safeScale;
  return {
    x: clamp(tapPoint.x - width / 2, 0, viewport.width - width),
    y: clamp(tapPoint.y - height / 2, 0, viewport.height - height),
    width,
    height,
  };
}

export function getTouchDistance(a: ZoomPoint, b: ZoomPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function getTouchCentroid(a: ZoomPoint, b: ZoomPoint): ZoomPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** A short touch that barely moved. */
export function isTapGesture(start: TouchSample, end: TouchSample): boolean {
  const duration = end.time - start.time;
  return (
    duration >= 0 &&
    duration <= TAP_MAX_DURATION_MS &&
    getTouchDistance(start, end) <= TAP_MAX_MOVEMENT
  );
}

/** Second tap close in time and place to the previous one. */
export function isDoubleTap(
  previousTap: TouchSample | null,
  tap: TouchSample,
): boolean {
  if (!previousTap) return false;
  const elapsed = tap.time - previousTap.time;
  return (
    elapsed >= 0 &&
    elapsed <= DOUBLE_TAP_MAX_DELAY_MS &&
    getTouchDistance(previousTap, tap) <= DOUBLE_TAP_MAX_DISTANCE
  );
}

/** Page shown by a horizontally paged list at the given scroll offset. */
export function getPageIndex(
  offsetX: number,
  pageWidth: number,
  pageCount: number,
): number {
  if (pageWidth <= 0 || pageCount <= 0 || !Number.isFinite(offsetX)) return 0;
  return clamp(Math.round(offsetX / pageWidth), 0, pageCount - 1);
}
