import { FastifyInstance } from 'fastify'
import { createReadStream } from 'node:fs'
import { openai } from '../lib/openai'
import { prisma } from '../lib/prisma'
import {
  createTranscriptionRequestBodySchema,
  createTranscriptionRequestParamsSchema,
} from '../schemas/transcriptions'

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req) => {
    const { videoId } = createTranscriptionRequestParamsSchema.parse(req.params)

    const { prompt } = createTranscriptionRequestBodySchema.parse(req.body)

    const video = await prisma.videos.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    })

    const videoPath = video.path
    const audioReadStream = createReadStream(videoPath)

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'en',
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    const transcription = response.text

    await prisma.videos.update({
      where: {
        id: videoId,
      },
      data: {
        transcription,
      },
    })

    return {
      transcription,
    }
  })
}
