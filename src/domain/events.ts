export type Handler<E, K extends keyof E> = (payload: E[K]) => void;

export function createEmitter<E>() {
  const handlers = new Map<
    keyof E,
    Set<(payload: never) => void>
  >();
  return {
    on<K extends keyof E>(name: K, handler: Handler<E, K>): () => void {
      const set = handlers.get(name) ?? new Set();
      set.add(handler);
      handlers.set(name, set);
      return () => {
        set.delete(handler);
      };
    },
    emit<K extends keyof E>(name: K, payload: E[K]): void {
      for (const h of handlers.get(name) ?? []) (h as Handler<E, K>)(payload);
    },
  };
}
