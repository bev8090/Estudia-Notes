import { z } from "zod";
import { HttpError } from "./errors.ts";

// Parse untrusted input (body, params) or reject the request with a 400.
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    const where = first?.path.length ? `${first.path.join(".")}: ` : "";
    throw new HttpError(400, `${where}${first?.message ?? "Invalid request"}`);
  }
  return result.data;
}

// Route params like /notes/:id. A malformed id is treated as "not found", not a server error.
export const idParams = z.object({ id: z.uuid() });

export function parseId(params: unknown): string {
  const result = idParams.safeParse(params);
  if (!result.success) throw new HttpError(404, "Not found");
  return result.data.id;
}
