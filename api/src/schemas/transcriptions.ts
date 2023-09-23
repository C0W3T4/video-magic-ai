import { z } from 'zod'

export const createTranscriptionRequestParamsSchema = z.object({
  videoId: z.string().uuid(),
})

export const createTranscriptionRequestBodySchema = z.object({
  prompt: z.string(),
})
