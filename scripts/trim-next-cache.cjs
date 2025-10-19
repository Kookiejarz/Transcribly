#!/usr/bin/env node

const fs = require("fs")
const fsp = require("fs/promises")
const path = require("path")

async function main() {
  const cacheDir = path.resolve(".next", "cache")
  if (!fs.existsSync(cacheDir)) {
    return
  }

  try {
    await fsp.rm(cacheDir, { recursive: true, force: true })
    console.log(`[trim-next-cache] Removed ${cacheDir}`)
  } catch (error) {
    console.warn(`[trim-next-cache] Failed to remove ${cacheDir}:`, error)
  }
}

main()
