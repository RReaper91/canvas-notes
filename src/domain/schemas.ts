import { parse, z, ZodXID } from "zod";
import { err, ok, type Result } from "./result";

const point = z.object({ x: z.number(), y: z.number() });
const base = { id: z.string().min(1), x: z.number(), y: z.number() };

export const boardObjectSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("sticky"),
    text: z.string().max(500),
    color: z.enum(["yellow", "pink", "blue", "green"]),
  }),
  z.object({
    ...base,
    type: z.literal("shape"),
    shape: z.enum(["rect", "ellipse"]),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  z.object({
    ...base,
    type: z.literal("arrow"),
    from: point,
    to: point,
  }),
  z.object({
    ...base,
    type: z.literal("text"),
    text: z.string(),
    fontSize: z.number().positive(),
  }),
  z.object({
    ...base,
    type: z.literal("image"),
    src: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
]);

export type BoardObjectInput = z.infer<typeof boardObjectSchema>;

export function parseBoardObject(
  raw: unknown,
): Result<BoardObjectInput, string[]> {
  const parsed = boardObjectSchema.safeParse(raw);
  if (parsed.success) return ok(parsed.data);
  return err(
    parsed.error.issues.map(
      (i) => `${i.path.map(String).join(".")}: ${i.message}`,
    ),
  );
}
