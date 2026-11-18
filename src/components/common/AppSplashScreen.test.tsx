/**
 * @jest-environment jsdom
 */
import React from 'react';
import { AppSplashScreen } from './AppSplashScreen';

interface TestTree {
  toJSON(): unknown;
  unmount(): void;
}

const { create, act } = jest.requireActual('react-test-renderer') as {
  create(element: React.ReactElement): TestTree;
  act(callback: () => void | Promise<void>): void | Promise<void>;
};

beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
afterAll(() => Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('AppSplashScreen', () => {
  it('renders default message properly', () => {
    let tree: TestTree | undefined;
    act(() => {
      tree = create(<AppSplashScreen />);
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree?.toJSON());
    expect(str).toContain('Đang khởi động không gian may đo...');
    expect(str).toContain('Atelier & AI Styling');
    expect(str).toContain('Saigon Editorial · Made-to-Measure');
  });

  it('renders custom message properly', () => {
    let tree: TestTree | undefined;
    act(() => {
      tree = create(<AppSplashScreen message="Đang kết nối hệ thống..." />);
    });
    const str = JSON.stringify(tree?.toJSON());
    expect(str).toContain('Đang kết nối hệ thống...');
  });
});
