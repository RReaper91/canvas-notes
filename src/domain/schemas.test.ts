/**
 * ESERCIZIO 5 (parte A) — Zod come fonte unica di verità
 *
 * COSA FARE: crea src/domain/schemas.ts ed esporta:
 *  - boardObjectSchema: uno schema Zod (z.discriminatedUnion su "type") che
 *    descrive gli stessi cinque oggetti dell'Esercizio 2, con queste regole:
 *      id: stringa non vuota
 *      x, y: numeri (NaN non è accettato)
 *      sticky:  text stringa di max 500 caratteri; color uno tra
 *               "yellow" | "pink" | "blue" | "green"
 *      shape:   shape "rect" | "ellipse"; width e height numeri positivi
 *      arrow:   from e to con { x, y } numerici
 *      text:    text stringa; fontSize numero positivo
 *      image:   src stringa non vuota; width e height numeri positivi
 *  - BoardObjectInput: il tipo ricavato dallo schema con z.infer (non scriverlo a mano)
 *  - parseBoardObject(raw: unknown): Result<BoardObjectInput, string[]>
 *      usa safeParse. In caso di errore restituisce una lista di messaggi
 *      nel formato "percorso: messaggio", per esempio "from.y: ...".
 *      Il percorso si ottiene con issue.path.map(String).join(".")
 *
 * PRIMA DI INIZIARE: controlla la versione installata con `npm ls zod`
 * (questa consegna funziona con Zod 3 e 4).
 *
 * DOCUMENTAZIONE
 *   Zod, guida base (safeParse, infer): https://zod.dev/basics
 *   Zod, API (unioni discriminate, enum, number, string): https://zod.dev/api
 *   Zod, formattare gli errori:         https://zod.dev/error-formatting
 *   Zod 3 (se hai installato la 3):     https://v3.zod.dev
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { parseBoardObject, type BoardObjectInput } from "./schemas";

const sticky = { type: "sticky", id: "a", x: 10, y: 20, text: "ciao", color: "yellow" };
const arrow = { type: "arrow", id: "b", x: 0, y: 0, from: { x: 1, y: 2 }, to: { x: 3, y: 4 } };

const errorsOf = (raw: unknown): string[] => {
  const r = parseBoardObject(raw);
  if (r.ok) throw new Error("era atteso un errore di validazione");
  return r.error;
};

describe("parseBoardObject", () => {
  it("accetta un post-it valido", () => {
    const r = parseBoardObject(sticky);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(sticky);
  });

  it("accetta una freccia valida", () => {
    expect(parseBoardObject(arrow).ok).toBe(true);
  });

  it("rifiuta un colore sconosciuto indicando il campo", () => {
    expect(errorsOf({ ...sticky, color: "red" }).some((m) => m.startsWith("color"))).toBe(true);
  });

  it("rifiuta un testo oltre i 500 caratteri", () => {
    expect(errorsOf({ ...sticky, text: "x".repeat(501) }).some((m) => m.startsWith("text"))).toBe(true);
  });

  it("rifiuta coordinate NaN", () => {
    expect(errorsOf({ ...sticky, x: Number.NaN }).some((m) => m.startsWith("x"))).toBe(true);
  });

  it("rifiuta una larghezza non positiva", () => {
    const shape = { type: "shape", id: "c", x: 0, y: 0, shape: "rect", width: 0, height: 5 };
    expect(errorsOf(shape).some((m) => m.startsWith("width"))).toBe(true);
  });

  it("riporta il percorso dei campi annidati", () => {
    const bad = { ...arrow, from: { x: 1 } };
    expect(errorsOf(bad).some((m) => m.startsWith("from"))).toBe(true);
  });

  it("rifiuta un tipo sconosciuto e valori che non sono oggetti", () => {
    expect(parseBoardObject({ type: "circle", id: "z", x: 0, y: 0 }).ok).toBe(false);
    expect(parseBoardObject(null).ok).toBe(false);
    expect(parseBoardObject("sticky").ok).toBe(false);
  });
});

describe("tipi", () => {
  it("il tipo ricavato dallo schema ha il discriminante corretto", () => {
    expectTypeOf<BoardObjectInput["type"]>().toEqualTypeOf<"sticky" | "shape" | "arrow" | "text" | "image">();
  });

  it("l'errore è una lista di stringhe", () => {
    const r = parseBoardObject(null);
    if (!r.ok) expectTypeOf(r.error).toEqualTypeOf<string[]>();
    expect(r.ok).toBe(false);
  });
});
