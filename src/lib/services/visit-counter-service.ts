import { updateJsonWithRetry, getPublicJsonFile } from '@/lib/github/client'

const COUNTER_PATH = 'data/visit-counter.json'

type CounterData = {
  total: number
  updatedAt: string
}

// In-memory buffer to batch writes
let _buffer = 0
let _lastWrite = 0
const BATCH_INTERVAL = 30_000  // flush at most once per 30s
const BATCH_THRESHOLD = 30     // or after 30 visits
let _flushPromise: Promise<void> | null = null

export async function getVisitCount(): Promise<number> {
  // Return in-memory value + pending buffer for approximate real-time count
  try {
    const data = await getPublicJsonFile<CounterData>(COUNTER_PATH)
    return (data?.total || 0) + _buffer
  } catch {
    return _buffer
  }
}

export async function incrementVisitCounter(): Promise<void> {
  _buffer++
  const now = Date.now()
  if (now - _lastWrite < BATCH_INTERVAL && _buffer < BATCH_THRESHOLD) return

  // Flush buffer to GitHub
  if (_flushPromise) return // already flushing

  _flushPromise = flushBuffer().finally(() => { _flushPromise = null })
}

async function flushBuffer(): Promise<void> {
  const toAdd = _buffer
  if (toAdd === 0) return

  try {
    await updateJsonWithRetry<CounterData>(COUNTER_PATH, current => ({
      total: (current?.total || 0) + toAdd,
      updatedAt: new Date().toISOString(),
    }))
    _buffer = 0
    _lastWrite = Date.now()
  } catch {
    // Failed to write. Keep buffer for next attempt.
  }
}
