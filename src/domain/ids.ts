import { err, ok, type Result } from "./result";

declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };
export type WorkspaceId = Brand<string, "WorkspaceId">;
export type PageId = Brand<string, "PageId">;
export type ObjectId = Brand<string, "ObjectId">;

const parser =
  <I extends string>() =>
  (raw: string): Result<I, "empty_id"> =>
    raw.trim() === "" ? err("empty_id") : ok(raw as I);

export const parseWorkspaceId = parser<WorkspaceId>();
export const parsePageId = parser<PageId>();
export const parseObjectId = parser<ObjectId>();
