import { ok, err, type Result } from "./result";
import type { Point } from "./board-object";

export type IncomingMessage =
  | { kind: "move"; id: string; x: number; y: number }
  | { kind: "delete"; id: string }
  | { kind: "ping" };
export type MessageError = "not_json" | "invalid_shape" | "unknown_kind";

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isPoint(v: unknown): v is Point {
  return (
    isRecord(v) &&
    Number.isFinite(v["x"]) &&
    Number.isFinite(v["y"]) &&
    typeof v["x"] === "number" &&
    typeof v["y"] === "number"
  );
}

export function assertIsPoint(v: unknown): asserts v is Point {
  if (!isPoint(v)) throw new TypeError("Non è un Point");
}

export function parseMessage(
  raw: string,
): Result<IncomingMessage, MessageError> {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return err("not_json");
  }
  if (!isRecord(data) || typeof data["kind"] !== "string")
    return err("invalid_shape");
  const { kind, id, x, y } = data;
  switch (kind) {
    case "ping":
      return ok({ kind });
    case "delete":
      return typeof id === "string" ? ok({ kind, id }) : err("invalid_shape");
    case "move":
      return typeof id === "string" &&
        typeof x === "number" &&
        typeof y === "number"
        ? ok({ kind, id, x, y })
        : err("invalid_shape");
    default:
      return err("unknown_kind");
  }
}
