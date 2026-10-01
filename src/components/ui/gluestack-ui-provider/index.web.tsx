'use client';
import React, { useEffect, useLayoutEffect } from 'react';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';
import { setFlushStyles } from '@gluestack-ui/utils/nativewind-utils';
import { colors, type ModeType } from './config';

export type { ModeType };

const variableStyleTagId = 'nativewind-style';

const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// On web the CSS variables go into a <style> tag on :root instead of a wrapping View.
const cssVariables = `:root { ${Object.entries(colors.light)
  .map(([name, value]) => `${name}: ${value};`)
  .join(' ')} }`;

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
}) {
  setFlushStyles(cssVariables);

  useSafeLayoutEffect(() => {
    const documentElement = document.documentElement;
    documentElement.classList.add(mode);
    documentElement.style.colorScheme = mode;
  }, [mode]);

  useSafeLayoutEffect(() => {
    const head = document.documentElement.querySelector('head');
    if (head && !head.querySelector(`[id='${variableStyleTagId}']`)) {
      const style = document.createElement('style');
      style.id = variableStyleTagId;
      style.innerHTML = cssVariables;
      head.appendChild(style);
    }
  }, []);

  return (
    <OverlayProvider>
      <ToastProvider>{props.children}</ToastProvider>
    </OverlayProvider>
  );
}
