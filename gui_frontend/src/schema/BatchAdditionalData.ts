import { z } from "zod";

export const BatchAdditionalDataSchema = z.object({
  current_page: z.number().int(),
  govs_per_page: z.number().int(),
  target_governor: z.number().int(),
  remaining_sec: z.number(),
  current_time: z
    .string()
    .datetime({ offset: true })
    .default("2026-06-14T05:05:32.664443+03:00"),
});
export type BatchAdditionalData = z.infer<typeof BatchAdditionalDataSchema>;
