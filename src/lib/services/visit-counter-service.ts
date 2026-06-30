// Simple in-memory page view counter. Resets on each Vercel deployment/cold start.
// No GitHub API calls. Good enough for a "since last deploy" display.

let _count = 0

export function getVisitCount(): number {
  return _count
}

export function incrementVisitCounter(): void {
  _count++
}
