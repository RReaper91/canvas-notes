/**
 * ESERCIZIO 6 — `unknown`, type guard e assertion function
 *
 * COSA FARE: crea src/domain/guards.ts (senza usare Zod: qui impari il
 * narrowing a mano) ed esporta:
 *  - isRecord(value: unknown): value is Record<string, unknown>
 *      true solo per oggetti non null e non array
 *  - isPoint(value: unknown): value is Point   (Point viene da board-object.ts)
 *      true se è un record con x e y numeri FINITI (NaN e Infinity no)
 *  - assertIsPoint(value: unknown): asserts value is Point
 *      lancia un TypeError se non è un Point.
 *      Dichiarala con `function` (non con una const): le assertion function
 *      lo richiedono per funzionare.
 *  - i tipi IncomingMessage e MessageError:
 *      IncomingMessage = { kind: "move"; id: string; x: number; y: number }
 *                      | { kind: "delete"; id: string }
 *                      | { kind: "ping" }
 *      MessageError = "not_json" | "invalid_shape" | "unknown_kind"
 *  - parseMessage(raw: string): Result<IncomingMessage, MessageError>
 *      "not_json"       se JSON.parse fallisce
 *      "invalid_shape"  se il JSON non è un record, se kind non è una stringa
 *                       o se i campi richiesti dal kind mancano o hanno tipo sbagliato
 *      "unknown_kind"   se kind è una stringa ma non è uno dei tre noti
 *    Assegna il risultato di JSON.parse a una variabile di tipo `unknown`.
 *
 * VINCOLO: niente `any`.
 *
 * DOCUMENTAZIONE
 *   Type predicates:    https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 *   Il tipo unknown:    https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown
 *   Assertion functions: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions
 *   JSON.parse (MDN):   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 *   Number.isFinite:    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { ok, err } from "./result";
import type { Point } from "./board-object";
import { assertIsPoint, isPoint, isRecord, parseMessage } from "./guards";

describe("isRecord", () => {
  it("accetta solo oggetti semplici", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
    expect(isRecord("x")).toBe(false);
  });

  it("restringe il tipo", () => {
    const v: unknown = { a: 1 };
    if (isRecord(v)) expectTypeOf(v).toEqualTypeOf<Record<string, unknown>>();
    expect(isRecord(v)).toBe(true);
  });
});

describe("isPoint e assertIsPoint", () => {
  it("riconosce i punti validi, anche con campi extra", () => {
    expect(isPoint({ x: 1, y: 2 })).toBe(true);
    expect(isPoint({ x: 1, y: 2, z: 3 })).toBe(true);
  });

  it("rifiuta tutto il resto", () => {
    expect(isPoint({ x: 1 })).toBe(false);
    expect(isPoint({ x: "1", y: 2 })).toBe(false);
    expect(isPoint({ x: Number.NaN, y: 0 })).toBe(false);
    expect(isPoint(null)).toBe(false);
  });

  it("assertIsPoint lancia TypeError e restringe il tipo", () => {
    expect(() => assertIsPoint("no")).toThrow(TypeError);
    const v: unknown = { x: 1, y: 2 };
    assertIsPoint(v);
    expectTypeOf(v).toEqualTypeOf<Point>();
    expect(v.x).toBe(1);
  });
});

describe("parseMessage", () => {
  it("legge i tre tipi di messaggio", () => {
    expect(parseMessage('{"kind":"move","id":"a","x":1,"y":2}')).toEqual(ok({ kind: "move", id: "a", x: 1, y: 2 }));
    expect(parseMessage('{"kind":"delete","id":"a"}')).toEqual(ok({ kind: "delete", id: "a" }));
    expect(parseMessage('{"kind":"ping"}')).toEqual(ok({ kind: "ping" }));
  });

  it("segnala not_json", () => {
    expect(parseMessage("{non json")).toEqual(err("not_json"));
  });

  it("segnala invalid_shape", () => {
    expect(parseMessage("null")).toEqual(err("invalid_shape"));
    expect(parseMessage("[1,2]")).toEqual(err("invalid_shape"));
    expect(parseMessage('{"kind":5}')).toEqual(err("invalid_shape"));
    expect(parseMessage('{"kind":"move","id":"a","x":"1","y":2}')).toEqual(err("invalid_shape"));
    expect(parseMessage('{"kind":"delete"}')).toEqual(err("invalid_shape"));
  });

  it("segnala unknown_kind", () => {
    expect(parseMessage('{"kind":"teleport"}')).toEqual(err("unknown_kind"));
  });
});
