"use client"

import { useState } from "react"
import { Upload, Youtube, FileAudio, Loader2, KeyRound, Settings2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FileUpload from "@/components/file-upload"
import YoutubeInput from "@/components/youtube-input"
import TranscriptDisplay from "@/components/transcript-display"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DEFAULT_STT_MODEL = process.env.NEXT_PUBLIC_DEFAULT_STT_MODEL ?? "gpt-4o-mini-transcribe"
const DEFAULT_SUMMARY_MODEL = process.env.NEXT_PUBLIC_DEFAULT_SUMMARY_MODEL ?? "gpt-4o-mini"
const DEFAULT_SUMMARY_MAX_TOKENS = Number(process.env.NEXT_PUBLIC_DEFAULT_SUMMARY_MAX_TOKENS ?? 350)

export type TranscriptionResult = {
  sessionId: string
  transcript: string
  summary: string
}

export type ApiConfiguration = {
  apiKey: string
  sttModel: string
  summaryModel: string
  summaryMaxTokens: number
}

export default function TranscriptionApp() {
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<ApiConfiguration>({
    apiKey: "",
    sttModel: DEFAULT_STT_MODEL,
    summaryModel: DEFAULT_SUMMARY_MODEL,
    summaryMaxTokens: DEFAULT_SUMMARY_MAX_TOKENS,
  })

  const handleTranscriptionComplete = (data: TranscriptionResult | null) => {
    setResult(data)
    setIsProcessing(false)
    setError(null)
  }

  const handleProcessingStart = () => {
    setIsProcessing(true)
    setError(null)
    setResult(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setIsProcessing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileAudio className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TranscribeAI</h1>
              <p className="text-sm text-muted-foreground">Transcribe and summarize audio & video content</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Provide your API credentials and preferred models. Leave the API key blank to use backend defaults.
              </p>
            </div>

            <Card className="border-2 border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">API Settings</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
                    API Key
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="sk-..."
                      value={config.apiKey}
                      onChange={(event) =>
                        setConfig((prev) => ({
                          ...prev,
                          apiKey: event.target.value,
                        }))
                      }
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stored locally only for this session. Leave blank if the backend manages credentials.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stt-model" className="text-sm font-medium text-foreground">
                      Speech-to-Text Model
                    </Label>
                    <Input
                      id="stt-model"
                      type="text"
                      value={config.sttModel}
                      onChange={(event) =>
                        setConfig((prev) => ({
                          ...prev,
                          sttModel: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary-model" className="text-sm font-medium text-foreground">
                      Summarization Model
                    </Label>
                    <Input
                      id="summary-model"
                      type="text"
                      value={config.summaryModel}
                      onChange={(event) =>
                        setConfig((prev) => ({
                          ...prev,
                          summaryModel: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary-max-tokens" className="text-sm font-medium text-foreground">
                    Summary Max Tokens
                  </Label>
                  <Input
                    id="summary-max-tokens"
                    type="number"
                    min={50}
                    max={2000}
                    value={config.summaryMaxTokens}
                    onChange={(event) =>
                      setConfig((prev) => ({
                        ...prev,
                        summaryMaxTokens: Number(event.target.value) || DEFAULT_SUMMARY_MAX_TOKENS,
                      }))
                    }
                  />
                </div>
              </div>
            </Card>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Upload Content</h2>
              <p className="text-sm text-muted-foreground">
                Choose your preferred method to upload audio or video content for transcription
              </p>
            </div>

            <Card className="border-2 border-border">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="p-6">
                  <FileUpload
                    config={config}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onProcessingStart={handleProcessingStart}
                    onError={handleError}
                  />
                </TabsContent>
                <TabsContent value="youtube" className="p-6">
                  <YoutubeInput
                    config={config}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onProcessingStart={handleProcessingStart}
                    onError={handleError}
                  />
                </TabsContent>
              </Tabs>
            </Card>

            {/* Processing Status */}
            {isProcessing && (
              <Card className="border-2 border-accent bg-accent/5 p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  <div>
                    <p className="font-medium text-accent-foreground">Processing your content...</p>
                    <p className="text-sm text-muted-foreground">
                      This may take a few moments depending on the file size
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-2 border-destructive bg-destructive/5 p-6">
                <div>
                  <p className="font-medium text-destructive-foreground">Error occurred</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Results</h2>
              <p className="text-sm text-muted-foreground">View and download your transcript and summary</p>
            </div>

            {result ? (
              <TranscriptDisplay result={result} />
            ) : (
              <Card className="border-2 border-dashed border-border p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileAudio className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No transcript yet</h3>
                  <p className="text-sm text-muted-foreground">Upload a file or paste a YouTube URL to get started</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
