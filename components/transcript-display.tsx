"use client"

import { useState } from "react"
import { Copy, Download, Check, FileText, Sparkles, Hash } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildBackendUrl, extractBackendError } from "@/lib/backend-client"
import MarkdownRenderer from "@/components/markdown-renderer"
import type { TranscriptionResult } from "./transcription-app"

type TranscriptDisplayProps = {
  result: TranscriptionResult
}

export default function TranscriptDisplay({ result }: TranscriptDisplayProps) {
  const [copiedTranscript, setCopiedTranscript] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const copyToClipboard = async (text: string, type: "transcript" | "summary") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "transcript") {
        setCopiedTranscript(true)
        setTimeout(() => setCopiedTranscript(false), 2000)
      } else {
        setCopiedSummary(true)
        setTimeout(() => setCopiedSummary(false), 2000)
      }
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const downloadTranscript = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(
        buildBackendUrl(`/download-transcript?session_id=${encodeURIComponent(result.sessionId)}`)
      )

      if (!response.ok) {
        let message = "Failed to download transcript"
        try {
          message = await extractBackendError(response)
        } catch {
          // ignore parse errors
        }
        throw new Error(message)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transcript-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Failed to download transcript:", err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-border">
        <div className="flex flex-col gap-2 p-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>Session ID: {result.sessionId}</span>
          </div>
        </div>
        <Tabs defaultValue="transcript" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcript" className="gap-2">
              <FileText className="h-4 w-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Full Transcript</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.transcript, "transcript")}
                className="gap-2"
              >
                {copiedTranscript ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-4 max-h-96 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">AI Summary</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.summary, "summary")}
                className="gap-2"
              >
                {copiedSummary ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg bg-muted/60 p-4">
              <MarkdownRenderer content={result.summary} className="space-y-3 text-sm" />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Button
        onClick={downloadTranscript}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        disabled={isDownloading}
      >
        <Download className="h-4 w-4" />
        {isDownloading ? "Preparing download..." : "Download as Text"}
      </Button>
    </div>
  )
}
