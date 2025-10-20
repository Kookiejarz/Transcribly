"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { buildBackendUrl, extractBackendError } from "@/lib/backend-client"
import type { ProcessingStage, ProcessingFlow } from "@/lib/processing"
import type { ApiConfiguration, TranscriptionResult } from "./transcription-app"

type FileUploadProps = {
  config: ApiConfiguration
  onTranscriptionComplete: (result: TranscriptionResult) => void
  onProcessingStart: (flow: ProcessingFlow, initialStage: ProcessingStage) => void
  onProcessingStageChange: (stage: ProcessingStage) => void
  onError: (error: string) => void
}

export default function FileUpload({
  config,
  onTranscriptionComplete,
  onProcessingStart,
  onProcessingStageChange,
  onError,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "video/mp4"]

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|mp4)$/i)) {
          onError("Unsupported file type. Please upload MP3, WAV, or MP4 files.")
          return
        }

        setFile(selectedFile)
        setUploadProgress(0)
      }
    },
    [onError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "video/mp4": [".mp4"],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file) return

    onProcessingStart("file", "uploading")
    onProcessingStageChange("uploading")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)
    if (config.apiKey) {
      formData.append("apiKey", config.apiKey)
    }
    if (config.provider === "openai") {
      formData.append("sttModel", config.openaiModel)
    } else {
      formData.append("assemblyModel", config.assemblyModel)
    }
    if (config.summaryModel) {
      formData.append("summaryModel", config.summaryModel)
    }
    if (config.summaryMaxTokens) {
      formData.append("summaryMaxTokens", String(config.summaryMaxTokens))
    }
    formData.append("provider", config.provider)
    if (config.assemblyApiKey) {
      formData.append("assemblyApiKey", config.assemblyApiKey)
    }

    let progressInterval: ReturnType<typeof setInterval> | null = null
    try {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) {
              clearInterval(progressInterval)
            }
            return 90
          }
          return prev + 10
        })
      }, 200)

      const headers: Record<string, string> = {}
      if (config.apiKey) {
        headers["X-API-Key"] = config.apiKey
      }
      if (config.assemblyApiKey) {
        headers["X-AssemblyAI-Key"] = config.assemblyApiKey
      }

      const response = await fetch(buildBackendUrl("/upload-audio"), {
        method: "POST",
        body: formData,
        headers,
      })

      setUploadProgress(100)
      onProcessingStageChange("transcribing")

      if (!response.ok) {
        let message = "Transcription failed. Please try again."
        try {
          message = await extractBackendError(response)
        } catch {
          // ignore parse errors
        }
        throw new Error(message)
      }

      onProcessingStageChange("summarizing")
      await new Promise((resolve) => setTimeout(resolve, 350))

      const raw = await response.json()
      const data: TranscriptionResult = {
        sessionId: raw.session_id ?? raw.sessionId ?? "",
        transcript: raw.transcript ?? "",
        summary: raw.summary ?? "",
      }

      if (!data.sessionId || !data.transcript) {
        throw new Error("Received incomplete response from transcription service.")
      }

      onTranscriptionComplete(data)
      setFile(null)
      setUploadProgress(0)
    } catch (err) {
      onError(err instanceof Error ? err.message : "An error occurred during upload")
      setUploadProgress(0)
      onProcessingStageChange("idle")
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploadProgress(0)
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent hover:bg-accent/5"
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-2">
            {isDragActive ? "Drop your file here" : "Drag & drop your audio file"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
          <p className="text-xs text-muted-foreground">Supports MP3, WAV, and MP4 files</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
              <File className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={uploadProgress > 0}
          >
            Start Transcription
          </Button>
        </div>
      )}
    </div>
  )
}
