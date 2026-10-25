/**
 * ESERCIZIO 5 (parte B) — Validare le variabili d'ambiente con Zod
 *
 * COSA FARE: crea src/lib/env.ts ed esporta:
 *  - parseEnv(raw: Record<string, string | undefined>): Result<Env, string[]>
 *    (è la forma di process.env). Schema:
 *      SUPABASE_URL                    stringa che inizia con http:// o https://
 *      NEXT_PUBLIC_SUPABASE_URL        stessa regola
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY   stringa non vuota
 *      PORT                            numero intero positivo; arriva come stringa,
 *                                      va convertito (z.coerce); default 3000
 *    In caso di errore: lista di messaggi "NOME: messaggio" come nell'Esercizio 5A.
 *  - Env: il tipo ricavato dallo schema con z.infer
 *
 * Qui NON si legge process.env: la funzione riceve l'oggetto, così è testabile.
 * (Più avanti la chiameremo una volta sola all'avvio dell'app.)
 *
 * DOCUMENTAZIONE
 *   Zod, coercion e default: https://zod.dev/api
 *   Zod, guida base:         https://zod.dev/basics
 *   Espressioni regolari (MDN): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { parseEnv } from "./env";

const valid = {
  SUPABASE_URL: "http://host.docker.internal:54321",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

const errorsOf = (raw: Record<string, string | undefined>): string[] => {
  const r = parseEnv(raw);
  if (r.ok) throw new Error("era atteso un errore di validazione");
  return r.error;
};

describe("parseEnv", () => {
  it("accetta una configurazione valida e imposta PORT=3000 di default", () => {
    const r = parseEnv(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.PORT).toBe(3000);
      expect(r.value.SUPABASE_URL).toBe(valid.SUPABASE_URL);
      expectTypeOf(r.value.PORT).toEqualTypeOf<number>();
    }
  });

  it("converte PORT da stringa a numero", () => {
    const r = parseEnv({ ...valid, PORT: "4000" });
    expect(r.ok && r.value.PORT).toBe(4000);
  });

  it("elenca le variabili mancanti", () => {
    const errors = errorsOf({ NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL });
    expect(errors.some((m) => m.startsWith("SUPABASE_URL"))).toBe(true);
    expect(errors.some((m) => m.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY"))).toBe(true);
  });

  it("rifiuta un URL non valido", () => {
    expect(errorsOf({ ...valid, SUPABASE_URL: "non-un-url" }).some((m) => m.startsWith("SUPABASE_URL"))).toBe(true);
  });

  it("rifiuta una PORT non numerica o non positiva", () => {
    expect(errorsOf({ ...valid, PORT: "abc" }).some((m) => m.startsWith("PORT"))).toBe(true);
    expect(errorsOf({ ...valid, PORT: "-5" }).some((m) => m.startsWith("PORT"))).toBe(true);
  });
});
