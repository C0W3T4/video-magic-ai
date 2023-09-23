import { api } from '@/lib/axios'
import { getFFmpeg } from '@/lib/ffmpeg/ffmpeg'
import { VideoStatus } from '@/types/videos'
import { statusMessages } from '@/utils/statusMessages'
import { fetchFile } from '@ffmpeg/util'
import { FileVideo, Upload } from 'lucide-react'
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react'
import { Button } from './ui/Button'
import { Label } from './ui/Label'
import { Separator } from './ui/Separator'
import { Textarea } from './ui/Textarea'

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void
}

export function VideoInputForm(props: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('WAITING')

  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>): void {
    const { files } = event.currentTarget

    if (!files) {
      return
    }

    const selectedFile = files[0]

    setVideoFile(selectedFile)
  }

  async function convertVideoToAudio(video: File): Promise<File> {
    const ffmpeg = await getFFmpeg()

    await ffmpeg.writeFile('input.mp4', await fetchFile(video))

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3',
    ])

    const data = await ffmpeg.readFile('output.mp3')

    const audioFileBlob = new Blob([data], { type: 'audio/mp3' })
    const audioFile = new File([audioFileBlob], 'output.mp3', {
      type: 'audio/mpeg',
    })

    return audioFile
  }

  async function handleUploadVideo(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    const prompt = promptInputRef.current?.value

    if (!videoFile) {
      return
    }

    setVideoStatus('CONVERTING')

    const audioFile = await convertVideoToAudio(videoFile)

    const data = new FormData()

    data.append('file', audioFile)

    setVideoStatus('UPLOADING')

    const response = await api.post('/videos', data)

    const videoId = response.data.video.id

    setVideoStatus('GENERATING')

    await api.post(`/videos/${videoId}/transcription`, {
      prompt,
    })

    setVideoStatus('SUCCESS')

    props.onVideoUploaded(videoId)
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null
    }

    return URL.createObjectURL(videoFile)
  }, [videoFile])

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Select a video
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Transcription prompt</Label>
        <Textarea
          ref={promptInputRef}
          disabled={videoStatus !== 'WAITING'}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Include keywords mentioned in the video separated by commas (,)"
        />
      </div>
      <Button
        data-success={videoStatus === 'SUCCESS'}
        disabled={videoStatus !== 'WAITING'}
        type="submit"
        className="w-full data-[success=true]:bg-emerald-400"
      >
        {videoStatus === 'WAITING' ? (
          <>
            Upload video
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : (
          statusMessages.get(videoStatus)
        )}
      </Button>
    </form>
  )
}
