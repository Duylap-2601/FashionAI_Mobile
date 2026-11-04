import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  View,
  useAnimatedValue,
} from 'react-native';
import type {
  AccessibilityActionEvent,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import {
  IDENTITY_ZOOM,
  MAX_ZOOM_SCALE,
  MIN_ZOOM_SCALE,
  getDoubleTapZoomTransform,
  getPanZoomTransform,
  getPinchZoomTransform,
  getTouchCentroid,
  getTouchDistance,
  getZoomRect,
  isDoubleTap,
  isTapGesture,
  isZoomedScale,
  settleZoomTransform,
} from '../utils/image-zoom';
import type {
  TouchSample,
  ZoomPoint,
  ZoomSize,
  ZoomTransform,
} from '../utils/image-zoom';

export interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  accessibilityLabel: string;
  /** False once the page is swiped away; the zoom is then reset. */
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
  onError: () => void;
}

const ZOOM_ANIMATION_MS = 200;
const ACCESSIBILITY_ACTIONS = [
  { name: 'activate', label: 'Phóng to hoặc thu nhỏ ảnh' },
] as const;

interface TapStart {
  sample: TouchSample;
  focus: ZoomPoint;
}

/**
 * Detects double taps from raw touch events. Touch events reach the view
 * whichever component holds the responder, and a scroll or pinch either moves
 * the finger too far or cancels the touch, so neither counts as a tap.
 */
function useDoubleTap(onDoubleTap: (focus: ZoomPoint) => void) {
  const tapStartRef = useRef<TapStart | null>(null);
  const lastTapRef = useRef<TouchSample | null>(null);

  const onTouchStart = useCallback((event: GestureResponderEvent) => {
    const { touches, pageX, pageY, locationX, locationY, timestamp } =
      event.nativeEvent;
    tapStartRef.current =
      touches.length === 1
        ? {
            sample: { time: timestamp, x: pageX, y: pageY },
            focus: { x: locationX, y: locationY },
          }
        : null;
  }, []);

  const onTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const start = tapStartRef.current;
      const { touches, pageX, pageY, timestamp } = event.nativeEvent;
      tapStartRef.current = null;
      if (!start || touches.length > 0) return;

      const end: TouchSample = { time: timestamp, x: pageX, y: pageY };
      if (!isTapGesture(start.sample, end)) return;

      if (isDoubleTap(lastTapRef.current, end)) {
        lastTapRef.current = null;
        onDoubleTap(start.focus);
      } else {
        lastTapRef.current = end;
      }
    },
    [onDoubleTap],
  );

  const onTouchCancel = useCallback(() => {
    tapStartRef.current = null;
  }, []);

  return { onTouchStart, onTouchEnd, onTouchCancel };
}

export function ZoomableImage(props: ZoomableImageProps) {
  // iOS zooms natively inside a ScrollView. Android ScrollView has no zoom,
  // so the other platforms use responder events with an Animated transform.
  return Platform.OS === 'ios' ? (
    <ScrollViewZoomableImage {...props} />
  ) : (
    <ResponderZoomableImage {...props} />
  );
}

function ScrollViewZoomableImage({
  uri,
  width,
  height,
  accessibilityLabel,
  active,
  onZoomChange,
  onError,
}: ZoomableImageProps) {
  const scrollRef = useRef<ScrollView>(null);
  const zoomedRef = useRef(false);

  const zoomTo = useCallback(
    (focus: ZoomPoint | null) => {
      scrollRef.current?.scrollResponderZoomTo(
        focus
          ? getZoomRect(focus, { width, height })
          : { x: 0, y: 0, width, height },
      );
    },
    [height, width],
  );

  const toggleZoom = useCallback(
    (focus: ZoomPoint) => zoomTo(zoomedRef.current ? null : focus),
    [zoomTo],
  );
  const tapHandlers = useDoubleTap(toggleZoom);

  useEffect(() => {
    if (!active && zoomedRef.current) {
      zoomTo(null);
    }
  }, [active, zoomTo]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const zoomed = isZoomedScale(event.nativeEvent.zoomScale);
      if (zoomed !== zoomedRef.current) {
        zoomedRef.current = zoomed;
        onZoomChange(zoomed);
      }
    },
    [onZoomChange],
  );

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'activate') {
        toggleZoom({ x: width / 2, y: height / 2 });
      }
    },
    [height, toggleZoom, width],
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={{ width, height }}
      contentContainerStyle={{ width, height }}
      minimumZoomScale={MIN_ZOOM_SCALE}
      maximumZoomScale={MAX_ZOOM_SCALE}
      bouncesZoom
      centerContent
      // Unzoomed, the image must not rubber-band and steal swipes from the pager.
      alwaysBounceVertical={false}
      alwaysBounceHorizontal={false}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Chạm hai lần để phóng to hoặc thu nhỏ ảnh"
        accessibilityActions={ACCESSIBILITY_ACTIONS}
        onAccessibilityAction={handleAccessibilityAction}
        {...tapHandlers}
      >
        <Image
          source={{ uri }}
          contentFit="contain"
          transition={150}
          style={{ width, height }}
          onError={onError}
        />
      </View>
    </ScrollView>
  );
}

interface GestureBaseline {
  start: ZoomTransform;
  touchCount: number;
  startDistance: number;
  startPoint: ZoomPoint;
}

function readTouches(event: GestureResponderEvent): ZoomPoint[] {
  return event.nativeEvent.touches.map((touch) => ({
    x: touch.pageX,
    y: touch.pageY,
  }));
}

function ResponderZoomableImage({
  uri,
  width,
  height,
  accessibilityLabel,
  active,
  onZoomChange,
  onError,
}: ZoomableImageProps) {
  const scale = useAnimatedValue(1);
  const translateX = useAnimatedValue(0);
  const translateY = useAnimatedValue(0);
  const transformRef = useRef<ZoomTransform>(IDENTITY_ZOOM);
  const baselineRef = useRef<GestureBaseline | null>(null);
  const zoomedRef = useRef(false);

  const reportZoom = useCallback(
    (transform: ZoomTransform) => {
      transformRef.current = transform;
      const zoomed = isZoomedScale(transform.scale);
      if (zoomed !== zoomedRef.current) {
        zoomedRef.current = zoomed;
        onZoomChange(zoomed);
      }
    },
    [onZoomChange],
  );

  const setTransform = useCallback(
    (transform: ZoomTransform) => {
      reportZoom(transform);
      scale.setValue(transform.scale);
      translateX.setValue(transform.translateX);
      translateY.setValue(transform.translateY);
    },
    [reportZoom, scale, translateX, translateY],
  );

  const animateTransform = useCallback(
    (transform: ZoomTransform) => {
      reportZoom(transform);
      const config = {
        duration: ZOOM_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      };
      Animated.parallel([
        Animated.timing(scale, { ...config, toValue: transform.scale }),
        Animated.timing(translateX, { ...config, toValue: transform.translateX }),
        Animated.timing(translateY, { ...config, toValue: transform.translateY }),
      ]).start();
    },
    [reportZoom, scale, translateX, translateY],
  );

  const toggleZoom = useCallback(
    (focus: ZoomPoint) => {
      animateTransform(
        getDoubleTapZoomTransform(transformRef.current, focus, { width, height }),
      );
    },
    [animateTransform, height, width],
  );
  const tapHandlers = useDoubleTap(toggleZoom);

  useEffect(() => {
    if (!active && zoomedRef.current) {
      setTransform(IDENTITY_ZOOM);
    }
  }, [active, setTransform]);

  const beginGesture = useCallback((event: GestureResponderEvent) => {
    const touches = readTouches(event);
    const [first = { x: 0, y: 0 }, second] = touches;
    baselineRef.current = {
      start: transformRef.current,
      touchCount: second ? 2 : 1,
      startDistance: second ? getTouchDistance(first, second) : 0,
      startPoint: second ? getTouchCentroid(first, second) : first,
    };
  }, []);

  // A pinch always belongs to the image. A one-finger drag only does while
  // zoomed; otherwise it stays with the pager so the user can swipe.
  const shouldClaimTouch = useCallback(
    (event: GestureResponderEvent) =>
      event.nativeEvent.touches.length >= 2 || zoomedRef.current,
    [],
  );

  const handleGrant = useCallback(
    (event: GestureResponderEvent) => {
      beginGesture(event);
      // Returning true stops the native pager from taking over mid-gesture.
      return true;
    },
    [beginGesture],
  );

  const handleMove = useCallback(
    (event: GestureResponderEvent) => {
      const touches = readTouches(event);
      const touchCount = touches.length >= 2 ? 2 : 1;
      if (baselineRef.current?.touchCount !== touchCount) {
        beginGesture(event);
      }
      const baseline = baselineRef.current;
      const [first, second] = touches;
      if (!baseline || !first) return;

      const viewport: ZoomSize = { width, height };
      if (second) {
        const centroid = getTouchCentroid(first, second);
        setTransform(
          getPinchZoomTransform(
            baseline.start,
            baseline.startDistance,
            getTouchDistance(first, second),
            {
              x: centroid.x - baseline.startPoint.x,
              y: centroid.y - baseline.startPoint.y,
            },
            viewport,
          ),
        );
      } else if (isZoomedScale(baseline.start.scale)) {
        setTransform(
          getPanZoomTransform(
            baseline.start,
            {
              x: first.x - baseline.startPoint.x,
              y: first.y - baseline.startPoint.y,
            },
            viewport,
          ),
        );
      }
    },
    [beginGesture, height, setTransform, width],
  );

  const handleEnd = useCallback(() => {
    baselineRef.current = null;
    const current = transformRef.current;
    const settled = settleZoomTransform(current, { width, height });
    if (
      settled.scale !== current.scale ||
      settled.translateX !== current.translateX ||
      settled.translateY !== current.translateY
    ) {
      animateTransform(settled);
    }
  }, [animateTransform, height, width]);

  const handleAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'activate') {
        toggleZoom({ x: width / 2, y: height / 2 });
      }
    },
    [height, toggleZoom, width],
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Chạm hai lần để phóng to hoặc thu nhỏ ảnh"
      accessibilityActions={ACCESSIBILITY_ACTIONS}
      onAccessibilityAction={handleAccessibilityAction}
      className="overflow-hidden"
      style={{ width, height }}
      onStartShouldSetResponder={shouldClaimTouch}
      onMoveShouldSetResponder={shouldClaimTouch}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleEnd}
      onResponderTerminate={handleEnd}
      onResponderTerminationRequest={() => false}
      {...tapHandlers}
    >
      {/* Animated transforms need a style object; NativeWind cannot drive them. */}
      <Animated.View
        style={{
          width,
          height,
          transform: [{ translateX }, { translateY }, { scale }],
        }}
      >
        <Image
          source={{ uri }}
          contentFit="contain"
          transition={150}
          style={{ width, height }}
          onError={onError}
        />
      </Animated.View>
    </View>
  );
}
