import type { BoardObject } from "./board-object";
import { assertNever } from "./board-object";
import type { ObjectId } from "./ids";

export type BoardAction =
  | { type: "add"; object: BoardObject }
  | { type: "move"; id: ObjectId; x: number; y: number }
  | { type: "remove"; id: ObjectId };

type Snapshot = readonly BoardObject[];

export function applyAction(objects: Snapshot, action: BoardAction): Snapshot {
  switch (action.type) {
    case "add":
      return objects.some((o) => o.id === action.object.id)
        ? objects
        : [...objects, action.object];
    case "move":
      return objects.some((o) => o.id === action.id)
        ? objects.map((o) =>
            o.id === action.id ? { ...o, x: action.x, y: action.y } : o,
          )
        : objects;
    case "remove":
      return objects.some((o) => o.id === action.id)
        ? objects.filter((o) => o.id !== action.id)
        : objects;
    default:
      return assertNever(action);
  }
}

export interface History {
  readonly past: readonly Snapshot[];
  readonly present: Snapshot;
  readonly future: readonly Snapshot[];
  readonly limit: number;
}

export const createHistory = (
  initial: Snapshot = [],
  limit = 100,
): History => ({ past: [], present: initial, future: [], limit });

export function dispatch(h: History, action: BoardAction): History {
  const next = applyAction(h.present, action);
  if (next === h.present) return h;
  return {
    ...h,
    past: [...h.past, h.present].slice(-h.limit),
    present: next,
    future: [],
  };
}

export function undo(h: History): History {
  const previous = h.past.at(-1);
  if (previous === undefined) return h;
  return {
    ...h,
    past: h.past.slice(0, -1),
    present: previous,
    future: [h.present, ...h.future],
  };
}

export function redo(h: History): History {
  const [next, ...rest] = h.future;
  if (next === undefined) return h;
  return { ...h, past: [...h.past, h.present], present: next, future: rest };
}

export const canUndo = (h: History) => h.past.length > 0;
export const canRedo = (h: History) => h.future.length > 0;
