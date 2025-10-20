"use client"

import { useEffect, useState } from "react"

import siteConfig from "@/config/site-config"
import { buildBackendUrl, extractBackendError } from "@/lib/backend-client"

type HealthStatus = "checking" | "healthy" | "unhealthy"

interface BackendHealthIndicatorProps {
  apiKey?: string
}

export default function BackendHealthIndicator({ apiKey }: BackendHealthIndicatorProps) {
  const [status, setStatus] = useState<HealthStatus>("checking")

  const checkHealth = async () => {
    setStatus("checking")
    try {
      const headers: HeadersInit = {}
      if (apiKey) {
        headers["X-API-Key"] = apiKey
      }
      const response = await fetch(buildBackendUrl("/health"), {
        method: "GET",
        headers,
        cache: "no-store",
      })
      if (!response.ok) {
        await extractBackendError(response)
        setStatus("unhealthy")
        return
      }
      setStatus("healthy")
    } catch {
      setStatus("unhealthy")
    }
  }

  useEffect(() => {
    void checkHealth()
    const interval = setInterval(() => {
      void checkHealth()
    }, 30000)
    return () => clearInterval(interval)
  }, [apiKey])

  return (
    <button
      onClick={() => void checkHealth()}
      className="flex items-center gap-2 rounded-full border bg-card/80 backdrop-blur-sm px-3 py-1.5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer active:scale-95"
      style={{
        borderColor: `${siteConfig.colors.accent}33`,
        boxShadow: `0 16px 32px -28px ${siteConfig.colors.accent}66`,
      }}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`h-2 w-2 rounded-full transition-all duration-500 ${
            status === "healthy"
              ? "shadow-lg animate-pulse-glow"
              : status === "unhealthy"
                ? "shadow-lg"
                : "shadow-lg animate-pulse"
          }`}
          style={{
            backgroundColor:
              status === "healthy"
                ? siteConfig.colors.status.healthy
                : status === "unhealthy"
                  ? siteConfig.colors.status.unhealthy
                  : siteConfig.colors.status.checking,
            boxShadow:
              status === "healthy"
                ? `0 0 12px ${siteConfig.colors.status.healthy}80`
                : status === "unhealthy"
                  ? `0 0 12px ${siteConfig.colors.status.unhealthy}80`
                  : `0 0 12px ${siteConfig.colors.status.checking}80`,
          }}
        />
        {status === "healthy" && (
          <div
            className="absolute inset-0 h-2 w-2 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: siteConfig.colors.status.healthy }}
          />
        )}
      </div>
      <span
        className="text-xs font-medium"
        style={{ color: status === "healthy" ? siteConfig.colors.status.healthy : status === "unhealthy" ? siteConfig.colors.status.unhealthy : siteConfig.colors.status.checking }}
      >
        {status === "healthy" ? "Backend Online" : status === "unhealthy" ? "Backend Offline" : "Checking..."}
      </span>
    </button>
  )
}
