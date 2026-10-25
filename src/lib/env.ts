import { z } from "zod";
import { err, ok, type Result } from "../domain/result";

const httpUrl = z.string().regex(/^https?:\/\//);

const envSchema = z.object({
  SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
  raw: Record<string, string | undefined>,
): Result<Env, string[]> {
  const parsed = envSchema.safeParse(raw);
  if (parsed.success) return ok(parsed.data);
  return err(
    parsed.error.issues.map(
      (i) => `${i.path.map(String).join(".")}: ${i.message}`,
    ),
  );
}
