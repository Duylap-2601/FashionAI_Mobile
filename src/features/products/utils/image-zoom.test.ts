import {
  clampZoomScale,
  clampZoomTransform,
  DOUBLE_TAP_ZOOM_SCALE,
  getDoubleTapZoomTransform,
  getPageIndex,
  getPanZoomTransform,
  getPinchZoomTransform,
  getTouchCentroid,
  getTouchDistance,
  getZoomRect,
  IDENTITY_ZOOM,
  isDoubleTap,
  isTapGesture,
  isZoomedScale,
  MAX_ZOOM_SCALE,
  MIN_ZOOM_SCALE,
  settleZoomTransform,
} from './image-zoom';

const viewport = { width: 400, height: 600 };

describe('clampZoomScale', () => {
  it('keeps the scale between 1x and 3.5x', () => {
    expect(clampZoomScale(0.4)).toBe(MIN_ZOOM_SCALE);
    expect(clampZoomScale(2)).toBe(2);
    expect(clampZoomScale(9)).toBe(MAX_ZOOM_SCALE);
  });

  it('falls back to 1x for invalid numbers', () => {
    expect(clampZoomScale(Number.NaN)).toBe(1);
    expect(clampZoomScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('isZoomedScale', () => {
  it('ignores rounding noise around 1x', () => {
    expect(isZoomedScale(1)).toBe(false);
    expect(isZoomedScale(1.005)).toBe(false);
    expect(isZoomedScale(1.2)).toBe(true);
  });
});

describe('clampZoomTransform', () => {
  it('does not allow panning an unzoomed image', () => {
    expect(
      clampZoomTransform({ scale: 1, translateX: 50, translateY: -80 }, viewport),
    ).toEqual(IDENTITY_ZOOM);
  });

  it('limits the offset to half of the extra size on each axis', () => {
    expect(
      clampZoomTransform({ scale: 2, translateX: 999, translateY: -999 }, viewport),
    ).toEqual({ scale: 2, translateX: 200, translateY: -300 });
  });

  it('clamps the scale before computing the limits', () => {
    expect(
      clampZoomTransform({ scale: 10, translateX: 2000, translateY: 0 }, viewport),
    ).toEqual({ scale: 3.5, translateX: 500, translateY: 0 });
  });
});

describe('settleZoomTransform', () => {
  it('snaps a nearly unzoomed image back to identity', () => {
    expect(
      settleZoomTransform({ scale: 1.004, translateX: 1, translateY: 1 }, viewport),
    ).toEqual(IDENTITY_ZOOM);
  });

  it('keeps a real zoom and clamps its offset', () => {
    expect(
      settleZoomTransform({ scale: 2, translateX: 500, translateY: 0 }, viewport),
    ).toEqual({ scale: 2, translateX: 200, translateY: 0 });
  });
});

describe('getPinchZoomTransform', () => {
  it('scales by the change in finger distance', () => {
    const next = getPinchZoomTransform(IDENTITY_ZOOM, 100, 250, { x: 0, y: 0 }, viewport);
    expect(next).toEqual({ scale: 2.5, translateX: 0, translateY: 0 });
  });

  it('never zooms past the limits', () => {
    expect(
      getPinchZoomTransform(IDENTITY_ZOOM, 100, 1000, { x: 0, y: 0 }, viewport).scale,
    ).toBe(MAX_ZOOM_SCALE);
    expect(
      getPinchZoomTransform({ scale: 2, translateX: 0, translateY: 0 }, 100, 10, { x: 0, y: 0 }, viewport),
    ).toEqual(IDENTITY_ZOOM);
  });

  it('scales the existing offset and follows the fingers', () => {
    const next = getPinchZoomTransform(
      { scale: 2, translateX: 40, translateY: -20 },
      100,
      150,
      { x: 10, y: 5 },
      viewport,
    );
    expect(next).toEqual({ scale: 3, translateX: 70, translateY: -25 });
  });

  it('keeps the start transform when a distance is unusable', () => {
    const start = { scale: 2, translateX: 10, translateY: 10 };
    expect(getPinchZoomTransform(start, 0, 100, { x: 50, y: 50 }, viewport)).toEqual(start);
  });
});

describe('getPanZoomTransform', () => {
  it('moves a zoomed image by the drag distance within its bounds', () => {
    const start = { scale: 2, translateX: 0, translateY: 0 };
    expect(getPanZoomTransform(start, { x: 30, y: -40 }, viewport)).toEqual({
      scale: 2,
      translateX: 30,
      translateY: -40,
    });
    expect(getPanZoomTransform(start, { x: 900, y: 0 }, viewport).translateX).toBe(200);
  });
});

describe('getDoubleTapZoomTransform', () => {
  it('zooms to 2.2x and keeps the tapped point under the finger', () => {
    const tap = { x: 300, y: 200 };
    const next = getDoubleTapZoomTransform(IDENTITY_ZOOM, tap, viewport);
    expect(next.scale).toBe(DOUBLE_TAP_ZOOM_SCALE);

    // Screen position of the tapped content point after zooming.
    const focusX = tap.x - viewport.width / 2;
    const focusY = tap.y - viewport.height / 2;
    expect(next.translateX + next.scale * focusX).toBeCloseTo(focusX);
    expect(next.translateY + next.scale * focusY).toBeCloseTo(focusY);
  });

  it('stays inside the bounds when tapping a corner', () => {
    const next = getDoubleTapZoomTransform(IDENTITY_ZOOM, { x: 0, y: 0 }, viewport);
    expect(next.translateX).toBeCloseTo(((DOUBLE_TAP_ZOOM_SCALE - 1) * viewport.width) / 2);
    expect(next.translateY).toBeCloseTo(((DOUBLE_TAP_ZOOM_SCALE - 1) * viewport.height) / 2);
  });

  it('resets when the image is already zoomed', () => {
    expect(
      getDoubleTapZoomTransform({ scale: 2, translateX: 30, translateY: 0 }, { x: 10, y: 10 }, viewport),
    ).toEqual(IDENTITY_ZOOM);
  });
});

describe('getZoomRect', () => {
  it('centres the zoom rect on the tap', () => {
    const rect = getZoomRect({ x: 200, y: 300 }, viewport, 2);
    expect(rect).toEqual({ x: 100, y: 150, width: 200, height: 300 });
  });

  it('keeps the rect inside the content near the edges', () => {
    expect(getZoomRect({ x: 0, y: 600 }, viewport, 2)).toEqual({
      x: 0,
      y: 300,
      width: 200,
      height: 300,
    });
  });
});

describe('touch helpers', () => {
  it('measures distance and midpoint between two fingers', () => {
    expect(getTouchDistance({ x: 0, y: 0 }, { x: 30, y: 40 })).toBe(50);
    expect(getTouchCentroid({ x: 0, y: 10 }, { x: 20, y: 30 })).toEqual({ x: 10, y: 20 });
  });

  it('recognises a tap only when the touch is short and still', () => {
    const start = { time: 1000, x: 50, y: 50 };
    expect(isTapGesture(start, { time: 1120, x: 54, y: 52 })).toBe(true);
    expect(isTapGesture(start, { time: 1600, x: 50, y: 50 })).toBe(false);
    expect(isTapGesture(start, { time: 1100, x: 90, y: 50 })).toBe(false);
  });

  it('recognises a double tap close in time and place', () => {
    const first = { time: 1000, x: 100, y: 100 };
    expect(isDoubleTap(null, first)).toBe(false);
    expect(isDoubleTap(first, { time: 1250, x: 110, y: 95 })).toBe(true);
    expect(isDoubleTap(first, { time: 1400, x: 100, y: 100 })).toBe(false);
    expect(isDoubleTap(first, { time: 1200, x: 220, y: 100 })).toBe(false);
  });
});

describe('getPageIndex', () => {
  it('rounds to the nearest page and stays in range', () => {
    expect(getPageIndex(0, 400, 5)).toBe(0);
    expect(getPageIndex(610, 400, 5)).toBe(2);
    expect(getPageIndex(5000, 400, 5)).toBe(4);
    expect(getPageIndex(-30, 400, 5)).toBe(0);
  });

  it('returns the first page for unusable sizes', () => {
    expect(getPageIndex(100, 0, 5)).toBe(0);
    expect(getPageIndex(100, 400, 0)).toBe(0);
  });
});
