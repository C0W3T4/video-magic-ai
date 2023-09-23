import { VideoStatus } from '@/types/videos'

export const statusMessages = new Map<VideoStatus, string>([
  ['CONVERTING', 'Converting...'],
  ['GENERATING', 'Transcribing...'],
  ['UPLOADING', 'Loading...'],
  ['SUCCESS', 'Success!'],
])
