#!/usr/bin/env node
/**
 * Pushes .env.production into Vercel production env.
 * Requires: `npx vercel login` then `npx vercel link`
 */
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const envFile = new URL('../.env.production', import.meta.url)
const keys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const raw = readFileSync(envFile, 'utf8')
const values = Object.fromEntries(
  raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const eq = line.indexOf('=')
      return [line.slice(0, eq), line.slice(eq + 1)]
    }),
)

for (const key of keys) {
  const value = values[key]
  if (!value) {
    console.error(`Missing ${key} in .env.production`)
    process.exit(1)
  }
  console.log(`Setting ${key} (production)`)
  const result = spawnSync('npx', ['vercel', 'env', 'add', key, 'production'], {
    input: `${value}\n`,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  if (result.status !== 0) {
    console.error(`Could not set ${key}. If it already exists, remove it in the Vercel dashboard and re-run.`)
    process.exit(result.status ?? 1)
  }
}

console.log('Vercel production env is set. Run: npx vercel --prod')
