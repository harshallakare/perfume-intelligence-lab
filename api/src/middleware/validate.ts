import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type Part = "body" | "query" | "params";

/** Returns Express middleware that validates req[part] against a Zod schema. */
export function validate(schema: ZodSchema, part: Part = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    // Replace raw input with the parsed (and potentially coerced) data
    (req as unknown as Record<string, unknown>)[part] = result.data;
    return next();
  };
}
