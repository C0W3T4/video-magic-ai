import { z } from 'zod'

export const generateAiCompletionRequestBodySchema = z.object({
  videoId: z.string().uuid(),
  prompt: z.string(),
  temperature: z.number().min(0).max(1).default(0.5),
})
