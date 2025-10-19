"use client"

import type React from "react"

import { useState } from "react"
import { Youtube, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ApiConfiguration, TranscriptionResult } from "./transcription-app"

type YoutubeInputProps = {
  config: ApiConfiguration
  onTranscriptionComplete: (result: TranscriptionResult) => void
  onProcessingStart: () => void
  onError: (error: string) => void
}

export default function YoutubeInput({ config, onTranscriptionComplete, onProcessingStart, onError }: YoutubeInputProps) {
  const [url, setUrl] = useState("")
  const [isValidating, setIsValidating] = useState(false)

  const validateYoutubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    return youtubeRegex.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      onError("Please enter a YouTube URL")
      return
    }

    if (!validateYoutubeUrl(url)) {
      onError("Invalid YouTube URL. Please check the link and try again.")
      return
    }

    setIsValidating(true)
    onProcessingStart()

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (config.apiKey) {
        headers["X-API-Key"] = config.apiKey
      }

      const payload = {
        url,
        apiKey: config.apiKey || undefined,
        sttModel: config.sttModel || undefined,
        summaryModel: config.summaryModel || undefined,
        summaryMaxTokens: config.summaryMaxTokens || undefined,
      }

      const response = await fetch("/api/transcribe-youtube", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let message = "Failed to transcribe YouTube video. Please try again."
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            message = errorData.error
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(message)
      }

      const data: TranscriptionResult = await response.json()

      if (!data.sessionId || !data.transcript) {
        throw new Error("Received incomplete response from transcription service.")
      }

      onTranscriptionComplete(data)
      setUrl("")
    } catch (err) {
      onError(err instanceof Error ? err.message : "An error occurred during transcription")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="youtube-url" className="text-sm font-medium text-foreground">
          YouTube Video URL
        </label>
        <div className="relative">
          <Youtube className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="youtube-url"
            type="text"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10"
            disabled={isValidating}
          />
        </div>
        <p className="text-xs text-muted-foreground">Paste the full URL of the YouTube video you want to transcribe</p>
      </div>

      <Button
        type="submit"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        disabled={isValidating || !url.trim()}
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Transcribe Video"
        )}
      </Button>
    </form>
  )
}
