/**
 * ESERCIZIO 3 — Tipi avanzati: mapped, conditional, template literal types
 *
 * COSA FARE: crea src/domain/type-utils.ts ed esporta tre TIPI (nessuna funzione):
 *  - Prefixed<P extends string, T>
 *      rinomina ogni chiave di T aggiungendo il prefisso P e ":".
 *      Prefixed<"board", { create: number }>  ->  { "board:create": number }
 *  - UnwrapResult<R>
 *      estrae il tipo del valore di un Result di successo.
 *      UnwrapResult<Result<number, string>>  ->  number
 *  - DottedKeys<T>
 *      per un oggetto annidato di messaggi i18n restituisce le chiavi a punti.
 *      { common: { save: "..." } }  ->  "common.save"
 *      (servirà per tipizzare le chiavi di traduzione di src/i18n/it.json)
 *
 * ATTENZIONE: qui il test vero è il compilatore. `npm run test` passa sempre;
 * se sbagli un tipo è `npm run typecheck` a segnalare l'errore.
 *
 * SUGGERIMENTI
 *  - Prefixed: mapped type con key remapping (`as`) e template literal type.
 *  - UnwrapResult: conditional type con `infer`; ricorda che si distribuisce sulle unioni.
 *  - DottedKeys: è ricorsivo; costruisci un mapped type e leggilo con [keyof T & string].
 *
 * DOCUMENTAZIONE
 *   Mapped types:         https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
 *   Conditional types:    https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
 *   Template literal:     https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
 *   keyof:                https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
 *   Indexed access:       https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
 */
import { describe, it, expectTypeOf } from "vitest";
import type { Result } from "./result";
import { parseWorkspaceId, type WorkspaceId } from "./ids";
import type { DottedKeys, Prefixed, UnwrapResult } from "./type-utils";

describe("Prefixed", () => {
  it("aggiunge un prefisso alle chiavi", () => {
    type Out = Prefixed<"board", { create: number; move: string }>;
    expectTypeOf<Out>().toEqualTypeOf<{ "board:create": number; "board:move": string }>();
  });

  it("mantiene il tipo dei valori", () => {
    type Out = Prefixed<"x", { a: { id: string } }>;
    expectTypeOf<Out["x:a"]>().toEqualTypeOf<{ id: string }>();
  });
});

describe("UnwrapResult", () => {
  it("estrae il tipo del valore", () => {
    expectTypeOf<UnwrapResult<Result<number, string>>>().toEqualTypeOf<number>();
  });

  it("funziona con il risultato di una funzione reale", () => {
    expectTypeOf<UnwrapResult<ReturnType<typeof parseWorkspaceId>>>().toEqualTypeOf<WorkspaceId>();
  });
});

describe("DottedKeys", () => {
  it("elenca le chiavi annidate separate da punti", () => {
    const messages = {
      common: { save: "Salva", cancel: "Annulla" },
      board: { title: "Lavagna", tools: { sticky: "Post-it" } },
    } as const;
    type Keys = DottedKeys<typeof messages>;
    expectTypeOf<Keys>().toEqualTypeOf<"common.save" | "common.cancel" | "board.title" | "board.tools.sticky">();
  });
});
