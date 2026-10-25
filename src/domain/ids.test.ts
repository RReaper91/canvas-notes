/**
 * ESERCIZIO 1 — Result e id "nominali" (branded types)
 *
 * COSA FARE
 *  1. Crea src/domain/result.ts ed esporta:
 *     - il tipo Result<T, E>: unione discriminata sul campo `ok`
 *         { ok: true; value: T } | { ok: false; error: E }
 *     - ok(value)   -> Result<T, never>
 *     - err(error)  -> Result<never, E>
 *     - map(result, fn) -> applica fn al valore solo se result.ok è true;
 *       se è un errore lo restituisce invariato
 *  2. Crea src/domain/ids.ts ed esporta:
 *     - i tipi WorkspaceId, PageId, ObjectId: sono stringhe ma NON sono
 *       intercambiabili tra loro (branded types)
 *     - parseWorkspaceId, parsePageId, parseObjectId: (raw: string) =>
 *       Result<IdTipizzato, "empty_id">. Errore "empty_id" se la stringa è
 *       vuota o fatta di soli spazi; altrimenti ok(raw) con raw invariato.
 *
 * COME VERIFICARE
 *   npm run test        controlla il comportamento (a runtime)
 *   npm run typecheck   controlla i tipi (incluse le righe @ts-expect-error)
 *
 * DOCUMENTAZIONE
 *   Unioni discriminate: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
 *   Generics:            https://www.typescriptlang.org/docs/handbook/2/generics.html
 *   Intersection types:  https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types
 *   unique symbol:       https://www.typescriptlang.org/docs/handbook/symbols.html
 *   Vitest:              https://vitest.dev/api/
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { ok, err, map, type Result } from "./result";
import {
  parseWorkspaceId,
  parsePageId,
  parseObjectId,
  type WorkspaceId,
  type PageId,
  type ObjectId,
} from "./ids";

describe("Result", () => {
  it("ok() e err() costruiscono i due casi", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("boom")).toEqual({ ok: false, error: "boom" });
  });

  it("map trasforma solo il caso ok", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(map(err("boom"), (n: number) => n * 2)).toEqual(err("boom"));
  });

  it("controllando .ok il compilatore distingue i due casi", () => {
    const check = (r: Result<number, string>) => {
      if (r.ok) expectTypeOf(r.value).toEqualTypeOf<number>();
      else expectTypeOf(r.error).toEqualTypeOf<string>();
    };
    expect(typeof check).toBe("function");
  });
});

describe("id", () => {
  it("accetta un id non vuoto e lo restituisce invariato", () => {
    expect(parseWorkspaceId("ws_123")).toEqual(ok("ws_123"));
    expect(parsePageId("p_1")).toEqual(ok("p_1"));
    expect(parseObjectId("o_1")).toEqual(ok("o_1"));
  });

  it("rifiuta stringhe vuote o di soli spazi", () => {
    expect(parseWorkspaceId("")).toEqual(err("empty_id"));
    expect(parsePageId("   ")).toEqual(err("empty_id"));
    expect(parseObjectId("\t\n")).toEqual(err("empty_id"));
  });

  it("i tre tipi di id sono distinti", () => {
    expectTypeOf<WorkspaceId>().not.toEqualTypeOf<PageId>();
    expectTypeOf<PageId>().not.toEqualTypeOf<ObjectId>();
  });

  it("un id si usa come string, ma una string qualsiasi non è un id", () => {
    const r = parseWorkspaceId("ws_1");
    if (r.ok) {
      const s: string = r.value;
      expect(s).toBe("ws_1");
    }
    // @ts-expect-error: una string qualsiasi non è un WorkspaceId
    const w: WorkspaceId = "ws_1";
    expect(w).toBe("ws_1");
  });

  it("un PageId non si può passare dove serve un WorkspaceId", () => {
    const needsWorkspace = (_id: WorkspaceId): void => {};
    const page = parsePageId("p_1");
    if (page.ok) {
      // @ts-expect-error: un PageId non è un WorkspaceId
      needsWorkspace(page.value);
    }
    expect(page.ok).toBe(true);
  });
});
