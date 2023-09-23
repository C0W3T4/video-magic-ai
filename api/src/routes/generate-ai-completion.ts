import { OpenAIStream, streamToResponse } from 'ai'
import { FastifyInstance } from 'fastify'
import { openai } from '../lib/openai'
import { prisma } from '../lib/prisma'
import { generateAiCompletionRequestBodySchema } from '../schemas/ai-completions'

export async function generateAiCompletionRoute(app: FastifyInstance) {
  app.post('/ai/complete', async (req, reply) => {
    const { videoId, prompt, temperature } =
      generateAiCompletionRequestBodySchema.parse(req.body)

    const video = await prisma.videos.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    })

    if (!video.transcription) {
      return reply
        .status(400)
        .send({ error: 'Video transcription was not generated yet.' })
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [{ role: 'user', content: promptMessage }],
      stream: true,
    })

    const stream = OpenAIStream(response)

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    })
  })
}
