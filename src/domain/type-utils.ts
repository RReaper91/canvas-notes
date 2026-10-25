export type Prefixed<P extends string, T> = {
  [K in keyof T & string as `${P}:${K}`]: T[K];
};

export type UnwrapResult<R> = R extends { ok: true; value: infer T }
  ? T
  : never;

export type DottedKeys<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? `${K}.${DottedKeys<T[K]>}`
    : K;
}[keyof T & string];
