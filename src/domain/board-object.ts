import type { ObjectId } from "./ids";

export type Point = { x: number; y: number };
export type StickyColor = "yellow" | "pink" | "blue" | "green";

interface Base {
  id: ObjectId;
  x: number;
  y: number;
}

export interface StickyNote extends Base {
  type: "sticky";
  text: string;
  color: StickyColor;
}

export interface Shape extends Base {
  type: "shape";
  shape: "rect" | "ellipse";
  width: number;
  height: number;
}

export interface Arrow extends Base {
  type: "arrow";
  from: Point;
  to: Point;
}

export interface TextBox extends Base {
  type: "text";
  text: string;
  fontSize: number;
}

export interface ImageObject extends Base {
  type: "image";
  src: string;
  width: number;
  height: number;
}

export type BoardObject = StickyNote | Shape | Arrow | TextBox | ImageObject;

export const STICKY_COLORS = {
  yellow: "#FFE066",
  pink: "#FF9EB5",
  blue: "#8ECAE6",
  green: "#95D5B2",
} as const satisfies Record<StickyColor, string>;

export function assertNever(value: never): never {
  throw new Error(`Caso non gestito: ${String(value)}`);
}

export function describeObject(obj: BoardObject): string {
  switch (obj.type) {
    case "sticky":
      return `sticky(${obj.color}): ${obj.text}`;
    case "shape":
      return `${obj.shape} ${obj.width}x${obj.height}`;
    case "arrow":
      return `arrow (${obj.from.x},${obj.from.y}) -> (${obj.to.x},${obj.to.y})`;
    case "text":
      return `text(${obj.fontSize}px): ${obj.text}`;
    case "image":
      return `image ${obj.width}x${obj.height}`;
    default:
      assertNever(obj);
  }
}
