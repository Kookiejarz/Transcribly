"use client"

import { useState, useMemo } from "react"
import { Upload, Youtube, FileAudio, Loader2, KeyRound, Settings2, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FileUpload from "@/components/file-upload"
import YoutubeInput from "@/components/youtube-input"
import TranscriptDisplay from "@/components/transcript-display"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BackendHealthIndicator from "@/components/backend-health-indicator"
import siteConfig from "@/config/site-config"
import type { ProcessingFlow, ProcessingStage } from "@/lib/processing"

const DEFAULT_STT_MODEL = process.env.NEXT_PUBLIC_DEFAULT_STT_MODEL ?? "gpt-4o-mini-transcribe"
const DEFAULT_SUMMARY_MODEL = process.env.NEXT_PUBLIC_DEFAULT_SUMMARY_MODEL ?? "gpt-4o-mini"
const DEFAULT_SUMMARY_MAX_TOKENS = 350

const processingStepsMap: Record<ProcessingFlow, { id: Exclude<ProcessingStage, "idle">; label: string }[]> = {
  file: [
    { id: "uploading", label: "Uploading media" },
    { id: "transcribing", label: "Transcribing audio" },
    { id: "summarizing", label: "Generating summary" },
  ],
  youtube: [
    { id: "downloading", label: "Fetching video audio" },
    { id: "transcribing", label: "Transcribing audio" },
    { id: "summarizing", label: "Generating summary" },
  ],
}

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
  const [error, setError] = useState<string | null>(null)
  const [processingStage, setProcessingStage] = useState<ProcessingStage>("idle")
  const [processingFlow, setProcessingFlow] = useState<ProcessingFlow | null>(null)
  const [config, setConfig] = useState<ApiConfiguration>({
    apiKey: "",
    sttModel: DEFAULT_STT_MODEL,
    summaryModel: DEFAULT_SUMMARY_MODEL,
    summaryMaxTokens: DEFAULT_SUMMARY_MAX_TOKENS,
  })

  const accentColor = siteConfig.colors.accent
  const accentSecondary = siteConfig.colors.accentSecondary

  const setStage = (stage: ProcessingStage) => {
    setProcessingStage(stage)
    if (stage === "idle") {
      setProcessingFlow(null)
    }
  }

  const handleTranscriptionComplete = (data: TranscriptionResult | null) => {
    setResult(data)
    setStage("idle")
    setError(null)
  }

  const handleProcessingStart = (flow: ProcessingFlow, initialStage: ProcessingStage) => {
    setProcessingFlow(flow)
    setStage(initialStage)
    setError(null)
    setResult(null)
  }

  const handleProcessingStageChange = (stage: ProcessingStage) => {
    setStage(stage)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setStage("idle")
  }

  const activeSteps = useMemo(() => {
    if (!processingFlow) {
      return []
    }
    return processingStepsMap[processingFlow]
  }, [processingFlow])

  const activeIndex = activeSteps.findIndex((step) => step.id === processingStage)
  const progress =
    processingStage === "idle" || activeSteps.length === 0
      ? 0
      : Math.max(5, Math.min(100, Math.round(((activeIndex + 1) / activeSteps.length) * 100)))
  const currentStep = useMemo(
    () => (activeIndex >= 0 && activeIndex < activeSteps.length ? activeSteps[activeIndex] : null),
    [activeIndex, activeSteps]
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="relative border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${siteConfig.colors.accent}1A, transparent, ${siteConfig.colors.accentSecondary}1A)`,
          }}
        />
        <div className="container relative mx-auto px-4 py-8">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-top-2 duration-700 delay-300">
            <BackendHealthIndicator apiKey={config.apiKey} />
          </div>
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl animate-pulse-glow shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${siteConfig.colors.accent}, ${siteConfig.colors.accentSecondary})`,
                boxShadow: `0 20px 40px -18px ${siteConfig.colors.accent}33`,
              }}
            >
              <FileAudio className="h-7 w-7 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {siteConfig.name || "Audio Transcription Studio"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {siteConfig.tagline || "Transform audio into text with AI-powered precision"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" style={{ color: siteConfig.colors.accent }} />
                <h2 className="text-2xl font-bold text-foreground">Configuration</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Provide your API credentials and preferred models. Leave the API key blank to use backend defaults.
              </p>
            </div>

            <Card
              className="gradient-border shadow-xl transition-all duration-300 hover:shadow-2xl animate-in fade-in slide-in-from-left-8 duration-700 delay-100"
              style={{
                boxShadow: `0 25px 55px -30px ${siteConfig.colors.accent}33`,
              }}
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${siteConfig.colors.accent}1a` }}
                  >
                    <Settings2 className="h-5 w-5" style={{ color: siteConfig.colors.accent }} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">API Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
                      API Key
                    </Label>
                    <div className="relative group">
                      <KeyRound
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-300"
                        style={{ color: siteConfig.colors.accent }}
                      />
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
                        className="pl-10 transition-all duration-300 focus:ring-2"
                        style={{ boxShadow: `0 0 0 2px transparent`, borderColor: `${siteConfig.colors.accent}33` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stored locally only for this session. Leave blank if the backend manages credentials.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
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
                        className="transition-all duration-300 focus:ring-2"
                        style={{ boxShadow: `0 0 0 2px transparent`, borderColor: `${siteConfig.colors.accent}33` }}
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
                        className="transition-all duration-300 focus:ring-2"
                        style={{ boxShadow: `0 0 0 2px transparent`, borderColor: `${siteConfig.colors.accent}33` }}
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
                      className="transition-all duration-300 focus:ring-2"
                      style={{ boxShadow: `0 0 0 2px transparent`, borderColor: `${siteConfig.colors.accent}33` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-3 animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" style={{ color: siteConfig.colors.accent }} />
                <h2 className="text-2xl font-bold text-foreground">Upload Content</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose your preferred method to upload audio or video content for transcription
              </p>
            </div>

            <Card
              className="gradient-border shadow-xl transition-all duration-300 hover:shadow-2xl animate-in fade-in slide-in-from-left-8 duration-700 delay-300"
              style={{
                boxShadow: `0 25px 55px -30px ${siteConfig.colors.accent}33`,
              }}
            >
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger
                    value="file"
                    className="gap-2 transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                    style={{
                      backgroundColor: `${siteConfig.colors.accent}0f`,
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    className="gap-2 transition-all duration-300 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                    style={{
                      backgroundColor: `${siteConfig.colors.accent}0f`,
                    }}
                  >
                    <Youtube className="h-4 w-4" />
                    YouTube URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="p-6">
                  <FileUpload
                    config={config}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onProcessingStart={handleProcessingStart}
                    onProcessingStageChange={handleProcessingStageChange}
                    onError={handleError}
                  />
                </TabsContent>
                <TabsContent value="youtube" className="p-6">
                  <YoutubeInput
                    config={config}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    onProcessingStart={handleProcessingStart}
                    onProcessingStageChange={handleProcessingStageChange}
                    onError={handleError}
                  />
                </TabsContent>
              </Tabs>
            </Card>

            {processingStage !== "idle" && processingFlow && currentStep && (
              <Card
                className="border-2 p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{
                  borderColor: `${accentColor}4d`,
                  background: `linear-gradient(135deg, ${accentColor}1a, ${accentSecondary}0f)`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: accentColor }} />
                    <span className="text-sm font-semibold text-foreground">
                      {processingFlow === "file" ? "Processing uploaded file" : "Processing YouTube video"}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {Math.max(activeIndex + 1, 1)} of {activeSteps.length}
                  </span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundImage: `linear-gradient(90deg, ${accentColor}, ${accentSecondary})`,
                      backgroundSize: "200% 100%",
                      animation: "progress-shimmer 1.5s linear infinite",
                      boxShadow: `0 0 18px ${accentColor}33`,
                    }}
                  />
                </div>
                <div className="mt-6 min-h-[68px] overflow-hidden">
                  <div
                    key={currentStep.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-4 py-3 text-sm shadow-sm animate-in fade-in slide-in-from-left-4 duration-300"
                    style={{
                      borderColor: `${accentColor}30`,
                      boxShadow: `0 18px 32px -24px ${accentColor}8f`,
                    }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white shadow"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
                        boxShadow: `0 10px 20px -12px ${accentColor}bf`,
                      }}
                    >
                      {activeIndex + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{currentStep.label}</span>
                      <span className="text-xs text-muted-foreground">Hang tight, this step usually completes in a moment.</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {error && (
              <Card
                className="border-2 p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{
                  borderColor: "#ef44444d",
                  background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.08))",
                  boxShadow: "0 20px 40px -25px rgba(239,68,68,0.35)",
                }}
              >
                <div>
                  <p className="font-semibold text-destructive-foreground">Error occurred</p>
                  <p className="text-sm text-muted-foreground mt-2">{error}</p>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: siteConfig.colors.accent }} />
                <h2 className="text-2xl font-bold text-foreground">Results</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                View and download your transcript and summary
              </p>
            </div>

            {result ? (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
                <TranscriptDisplay result={result} />
              </div>
            ) : (
              <Card className="border-2 border-dashed border-border/50 p-16 transition-all duration-300 hover:border-accent/30 hover:bg-accent/5 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 animate-float">
                    <FileAudio className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">No transcript yet</h3>
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
