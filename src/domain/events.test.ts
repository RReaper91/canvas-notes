/**
 * ESERCIZIO 4 — Event emitter tipizzato (generics + keyof)
 *
 * COSA FARE: crea src/domain/events.ts ed esporta:
 *  - createEmitter<E>(): un oggetto con due metodi
 *      on(name, handler)   registra un handler e restituisce una funzione
 *                          che lo rimuove (unsubscribe)
 *      emit(name, payload) chiama, nell'ordine di registrazione, gli handler
 *                          registrati per quel nome
 *    E è una mappa "nome evento -> tipo del payload". Il compilatore deve
 *    garantire che: il nome sia una chiave di E; l'handler riceva il payload
 *    di QUEL nome; emit richieda il payload di QUEL nome.
 *  - il tipo Handler<E, K extends keyof E> = (payload: E[K]) => void
 *
 * VINCOLO: niente `any` nel codice.
 *
 * SUGGERIMENTI
 *  - i metodi sono generici su K extends keyof E.
 *  - per tenere gli handler puoi usare una Map di Set; un solo cast, ben
 *    motivato, nell'implementazione di emit è accettabile.
 *
 * DOCUMENTAZIONE
 *   Generic constraints: https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints
 *   keyof:               https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
 *   Indexed access:      https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html
 *   Map e Set (MDN):     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { createEmitter } from "./events";

type Events = {
  "board:move": { id: string; x: number; y: number };
  "board:delete": { id: string };
};

describe("createEmitter", () => {
  it("consegna il payload agli handler registrati", () => {
    const emitter = createEmitter<Events>();
    const received: unknown[] = [];
    emitter.on("board:move", (p) => received.push(p));
    emitter.emit("board:move", { id: "a", x: 1, y: 2 });
    expect(received).toEqual([{ id: "a", x: 1, y: 2 }]);
  });

  it("chiama gli handler nell'ordine di registrazione", () => {
    const emitter = createEmitter<Events>();
    const order: string[] = [];
    emitter.on("board:delete", () => order.push("primo"));
    emitter.on("board:delete", () => order.push("secondo"));
    emitter.emit("board:delete", { id: "a" });
    expect(order).toEqual(["primo", "secondo"]);
  });

  it("la funzione restituita da on() rimuove l'handler", () => {
    const emitter = createEmitter<Events>();
    let count = 0;
    const off = emitter.on("board:delete", () => count++);
    emitter.emit("board:delete", { id: "a" });
    off();
    emitter.emit("board:delete", { id: "a" });
    expect(count).toBe(1);
  });

  it("emettere un evento senza handler non fa nulla", () => {
    const emitter = createEmitter<Events>();
    expect(() => emitter.emit("board:delete", { id: "a" })).not.toThrow();
  });

  it("gli eventi sono indipendenti", () => {
    const emitter = createEmitter<Events>();
    let moves = 0;
    emitter.on("board:move", () => moves++);
    emitter.emit("board:delete", { id: "a" });
    expect(moves).toBe(0);
  });
});

describe("tipi", () => {
  it("l'handler riceve il payload dell'evento giusto", () => {
    const emitter = createEmitter<Events>();
    emitter.on("board:delete", (p) => {
      expectTypeOf(p).toEqualTypeOf<{ id: string }>();
    });
    emitter.on("board:move", (p) => {
      expectTypeOf(p).toEqualTypeOf<{ id: string; x: number; y: number }>();
    });
    expect(true).toBe(true);
  });

  it("emit rifiuta payload sbagliati e nomi sconosciuti", () => {
    const emitter = createEmitter<Events>();
    // @ts-expect-error: mancano x e y
    emitter.emit("board:move", { id: "a" });
    // @ts-expect-error: evento inesistente
    emitter.emit("board:unknown", {});
    expect(true).toBe(true);
  });
});
