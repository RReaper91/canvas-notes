/**
 * ESERCIZIO 7 — Reducer puro e cronologia undo/redo
 *
 * COSA FARE: crea src/domain/board-state.ts (usa Esercizi 1 e 2) ed esporta:
 *  - BoardAction = { type: "add"; object: BoardObject }
 *                | { type: "move"; id: ObjectId; x: number; y: number }
 *                | { type: "remove"; id: ObjectId }
 *  - applyAction(objects: readonly BoardObject[], action: BoardAction): readonly BoardObject[]
 *      funzione PURA: non modifica mai l'array in ingresso né gli oggetti.
 *      add: aggiunge in fondo; se esiste già un oggetto con quell'id restituisce
 *           lo STESSO array ricevuto.
 *      move: cambia solo x e y dell'oggetto con quell'id (copia nuova); gli altri
 *           oggetti mantengono lo stesso riferimento; id inesistente -> stesso array.
 *      remove: toglie l'oggetto; id inesistente -> stesso array.
 *      Usa uno switch esaustivo con assertNever (Esercizio 2).
 *  - History: { past, present, future, limit } (past e future sono array di stati)
 *  - createHistory(initial = [], limit = 100): History
 *  - dispatch(history, action): History
 *      applica l'azione al present; se lo stato non cambia (stesso riferimento)
 *      restituisce la STESSA history; altrimenti sposta il present in past
 *      (scartando i più vecchi oltre `limit`) e svuota future.
 *  - undo(history) e redo(history): History
 *      se non c'è nulla da annullare/ripetere restituiscono la STESSA history.
 *  - canUndo(history) e canRedo(history): boolean
 *
 * PERCHÉ IL "STESSO RIFERIMENTO": in React evita rendering inutili.
 *
 * DOCUMENTAZIONE
 *   Esaustività:     https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
 *   readonly array:  https://www.typescriptlang.org/docs/handbook/2/objects.html#the-readonlyarray-type
 *   Spread (MDN):    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
 *   Array.map/filter/slice (MDN): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
 *   Object.freeze (MDN): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { parseObjectId } from "./ids";
import type { BoardObject, StickyNote } from "./board-object";
import { applyAction, canRedo, canUndo, createHistory, dispatch, redo, undo, type BoardAction } from "./board-state";

const id = (raw: string) => {
  const r = parseObjectId(raw);
  if (!r.ok) throw new Error("id non valido nel test");
  return r.value;
};
const sticky = (raw: string, x = 0, y = 0): StickyNote => ({ type: "sticky", id: id(raw), x, y, text: raw, color: "yellow" });
const A = sticky("a");
const B = sticky("b", 5, 5);
const C = sticky("c", 9, 9);

describe("applyAction", () => {
  it("add aggiunge in fondo senza toccare lo stato precedente", () => {
    const state: readonly BoardObject[] = Object.freeze([A]);
    const next = applyAction(state, { type: "add", object: B });
    expect(next).toEqual([A, B]);
    expect(state).toEqual([A]);
  });

  it("add con id già presente restituisce lo stesso stato", () => {
    const state = [A];
    expect(applyAction(state, { type: "add", object: { ...A, x: 99 } })).toBe(state);
  });

  it("move cambia solo x e y dell'oggetto indicato", () => {
    const state = [A, B];
    const next = applyAction(state, { type: "move", id: A.id, x: 7, y: 8 });
    expect(next).toEqual([{ ...A, x: 7, y: 8 }, B]);
    expect(next[1]).toBe(B);
    expect(A.x).toBe(0);
  });

  it("move con id inesistente restituisce lo stesso stato", () => {
    const state = [A];
    expect(applyAction(state, { type: "move", id: id("zzz"), x: 1, y: 1 })).toBe(state);
  });

  it("remove toglie l'oggetto; con id inesistente non cambia nulla", () => {
    const state = [A, B];
    expect(applyAction(state, { type: "remove", id: A.id })).toEqual([B]);
    expect(applyAction(state, { type: "remove", id: id("zzz") })).toBe(state);
  });

  it("rifiuta azioni sconosciute", () => {
    // @ts-expect-error: "rotate" non è un'azione prevista
    expect(() => applyAction([], { type: "rotate", id: A.id })).toThrow();
  });
});

describe("history", () => {
  it("parte vuota e senza undo/redo", () => {
    const h = createHistory();
    expect(h.present).toEqual([]);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("dispatch, undo e redo", () => {
    const h0 = createHistory();
    const h1 = dispatch(h0, { type: "add", object: A });
    expect(h1.present).toEqual([A]);
    expect(h0.present).toEqual([]);
    expect(canUndo(h1)).toBe(true);

    const h2 = undo(h1);
    expect(h2.present).toEqual([]);
    expect(canRedo(h2)).toBe(true);

    const h3 = redo(h2);
    expect(h3.present).toEqual([A]);
    expect(canRedo(h3)).toBe(false);
  });

  it("una nuova azione dopo un undo cancella il futuro", () => {
    const h = undo(dispatch(createHistory(), { type: "add", object: A }));
    const next = dispatch(h, { type: "add", object: B });
    expect(canRedo(next)).toBe(false);
    expect(next.present).toEqual([B]);
  });

  it("un'azione senza effetto non crea voci di cronologia", () => {
    const h = createHistory([A]);
    expect(dispatch(h, { type: "remove", id: id("zzz") })).toBe(h);
  });

  it("undo e redo senza nulla da fare restituiscono la stessa history", () => {
    const h = createHistory();
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it("il limite scarta le voci più vecchie", () => {
    let h = createHistory([], 2);
    for (const object of [A, B, C]) h = dispatch(h, { type: "add", object });
    expect(h.past.length).toBe(2);
    h = undo(undo(h));
    expect(h.present).toEqual([A]);
    expect(canUndo(h)).toBe(false);
  });
});

describe("tipi", () => {
  it("applyAction restituisce un array readonly di oggetti", () => {
    const next = applyAction([], { type: "remove", id: A.id });
    expectTypeOf(next).toEqualTypeOf<readonly BoardObject[]>();
    const action: BoardAction = { type: "remove", id: A.id };
    expect(action.type).toBe("remove");
  });
});
