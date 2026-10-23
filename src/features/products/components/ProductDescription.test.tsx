import React, { act } from "react";
import { ProductDescription } from "./ProductDescription";

jest.mock("react-native", () => ({
  Text: "Text",
  View: "View",
  Pressable: "Pressable",
}));
jest.mock("react-native-web", () => ({
  Text: "Text",
  View: "View",
  Pressable: "Pressable",
}));

beforeAll(() => Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }));
afterAll(() => Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT"));

interface TestNode {
  props: Record<string, unknown>;
  findByProps(props: Record<string, unknown>): TestNode;
  findAllByProps(props: Record<string, unknown>): TestNode[];
}
interface TestTree {
  root: TestNode;
  update(element: React.ReactElement): void;
  unmount(): void;
}
const { create } = jest.requireActual("react-test-renderer") as {
  create(element: React.ReactElement): TestTree;
};

let tree: TestTree;
function renderDescription(id: string, description: string) {
  act(() => {
    tree = create(<ProductDescription key={id} description={description} />);
  });
}
function measureLines(count: number) {
  const measure = tree.root.findByProps({ testID: "description-measure" });
  act(() => {
    (measure.props.onTextLayout as (event: unknown) => void)({
      nativeEvent: { lines: Array.from({ length: count }, () => ({})) },
    });
  });
}
afterEach(() => act(() => tree?.unmount()));

it("keeps short descriptions complete without an expand action", () => {
  renderDescription("short", "Chất liệu thoáng mát.");
  measureLines(3);
  expect(
    tree.root.findAllByProps({ accessibilityRole: "button" }),
  ).toHaveLength(0);
});

it("collapses long descriptions to four lines and toggles without changing the text", () => {
  const description = "Mô tả đầy đủ của sản phẩm.\n".repeat(12);
  renderDescription("long", description);
  measureLines(12);
  const text = () => tree.root.findByProps({ testID: "product-description" });
  const toggle = () => tree.root.findByProps({ accessibilityRole: "button" });
  expect(text().props.numberOfLines).toBe(4);
  expect(text().props.children).toBe(description);
  act(() => (toggle().props.onPress as () => void)());
  expect(text().props.numberOfLines).toBeUndefined();
  expect(toggle().props.accessibilityState).toEqual({ expanded: true });
  act(() => (toggle().props.onPress as () => void)());
  expect(text().props.numberOfLines).toBe(4);
});

it("resets expansion when the product changes and responds to width remeasurement", () => {
  renderDescription("first", "Nội dung sản phẩm đầu tiên.");
  measureLines(8);
  act(() =>
    (
      tree.root.findByProps({ accessibilityRole: "button" }).props
        .onPress as () => void
    )(),
  );
  act(() =>
    tree.update(
      <ProductDescription key="second" description="Nội dung sản phẩm khác." />,
    ),
  );
  measureLines(7);
  expect(
    tree.root.findByProps({ testID: "product-description" }).props
      .numberOfLines,
  ).toBe(4);
  measureLines(4);
  expect(
    tree.root.findAllByProps({ accessibilityRole: "button" }),
  ).toHaveLength(0);
});
