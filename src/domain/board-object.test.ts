/**
 * ESERCIZIO 2 — Unioni discriminate e `satisfies`
 *
 * COSA FARE: crea src/domain/board-object.ts (usa gli id dell'Esercizio 1) ed esporta:
 *  - Point = { x: number; y: number }
 *  - StickyColor = "yellow" | "pink" | "blue" | "green"
 *  - cinque tipi, ognuno con { id: ObjectId; x: number; y: number } più:
 *      StickyNote  type "sticky"  text: string, color: StickyColor
 *      Shape       type "shape"   shape: "rect" | "ellipse", width: number, height: number
 *      Arrow       type "arrow"   from: Point, to: Point
 *      TextBox     type "text"    text: string, fontSize: number
 *      ImageObject type "image"   src: string, width: number, height: number
 *  - BoardObject: l'unione dei cinque tipi
 *  - STICKY_COLORS: oggetto costante { yellow: "#FFE066", pink: "#FF9EB5",
 *      blue: "#8ECAE6", green: "#95D5B2" } dichiarato con `as const satisfies
 *      Record<StickyColor, string>`, così il compilatore controlla le chiavi
 *      ma conserva i valori letterali
 *  - assertNever(value: never): never  -> lancia un Error il cui messaggio
 *      contiene "non gestito"
 *  - describeObject(obj: BoardObject): string, con uno switch ESAUSTIVO su
 *      obj.type e assertNever nel default. Formato dell'output:
 *        sticky -> "sticky(yellow): ciao"     shape -> "rect 10x20"
 *        arrow  -> "arrow (1,2) -> (3,4)"      text  -> "text(24px): titolo"
 *        image  -> "image 100x50"
 *
 * COME VERIFICARE: npm run test e npm run typecheck
 *
 * DOCUMENTAZIONE
 *   Esaustività con never: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
 *   satisfies:             https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
 *   const assertions:      https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-inference
 *   Extract<T, U>:         https://www.typescriptlang.org/docs/handbook/utility-types.html#extracttype-union
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { parseObjectId } from "./ids";
import {
  STICKY_COLORS,
  assertNever,
  describeObject,
  type Arrow,
  type BoardObject,
  type Point,
} from "./board-object";

const id = (raw: string) => {
  const r = parseObjectId(raw);
  if (!r.ok) throw new Error("id non valido nel test");
  return r.value;
};

describe("describeObject", () => {
  it("descrive ogni tipo di oggetto", () => {
    const objects: BoardObject[] = [
      {
        type: "sticky",
        id: id("a"),
        x: 0,
        y: 0,
        text: "ciao",
        color: "yellow",
      },
      {
        type: "shape",
        id: id("b"),
        x: 0,
        y: 0,
        shape: "rect",
        width: 10,
        height: 20,
      },
      {
        type: "arrow",
        id: id("c"),
        x: 0,
        y: 0,
        from: { x: 1, y: 2 },
        to: { x: 3, y: 4 },
      },
      { type: "text", id: id("d"), x: 0, y: 0, text: "titolo", fontSize: 24 },
      {
        type: "image",
        id: id("e"),
        x: 0,
        y: 0,
        src: "https://example.com/a.png",
        width: 100,
        height: 50,
      },
    ];
    expect(objects.map(describeObject)).toEqual([
      "sticky(yellow): ciao",
      "rect 10x20",
      "arrow (1,2) -> (3,4)",
      "text(24px): titolo",
      "image 100x50",
    ]);
  });

  it("non accetta tipi sconosciuti", () => {
    expect(() =>
      // @ts-expect-error: "circle" non è un tipo di oggetto della lavagna
      describeObject({ type: "circle", id: id("z"), x: 0, y: 0 }),
    ).toThrow();
  });
});

describe("tipi", () => {
  it("il campo type è l'unione dei cinque valori", () => {
    expectTypeOf<BoardObject["type"]>().toEqualTypeOf<
      "sticky" | "shape" | "arrow" | "text" | "image"
    >();
  });

  it("Extract recupera il tipo giusto dall'unione", () => {
    expectTypeOf<
      Extract<BoardObject, { type: "arrow" }>
    >().toEqualTypeOf<Arrow>();
    expectTypeOf<Arrow["from"]>().toEqualTypeOf<Point>();
  });
});

describe("STICKY_COLORS", () => {
  it("contiene i quattro colori", () => {
    expect(Object.keys(STICKY_COLORS).sort()).toEqual([
      "blue",
      "green",
      "pink",
      "yellow",
    ]);
    expect(STICKY_COLORS.pink).toBe("#FF9EB5");
  });

  it("con satisfies i valori restano letterali", () => {
    expectTypeOf(STICKY_COLORS.yellow).toEqualTypeOf<"#FFE066">();
  });
});

describe("assertNever", () => {
  it("lancia un errore se viene raggiunta a runtime", () => {
    expect(() => assertNever("x" as never)).toThrow(/non gestito/i);
  });
});
