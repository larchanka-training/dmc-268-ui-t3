import { z } from 'zod'

/** Only absolute https URLs reach an `href` or `src`; `javascript:` and other schemes fail validation. */
export const httpsUrl = z
  .string()
  .refine((value) => URL.canParse(value) && new URL(value).protocol === 'https:', {
    message: 'must be an absolute https URL',
  })
