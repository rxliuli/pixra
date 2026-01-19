const HISTORY_KEY = 'pixra.commandPalette.history.v1'
const MAX_HISTORY = 100

let memoryFallback: string[] = []

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null
}

function normalizeHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').slice(0, MAX_HISTORY)
}

async function getIdb() {
  return await import('idb-keyval')
}

export async function getCommandSelectionHistory(): Promise<string[]> {
  if (!isIndexedDbAvailable()) {
    return memoryFallback
  }

  try {
    const { get } = await getIdb()
    return normalizeHistory(await get(HISTORY_KEY))
  } catch {
    return memoryFallback
  }
}

export async function recordCommandSelection(commandId: string): Promise<void> {
  if (!commandId) return

  const history = await getCommandSelectionHistory()
  const next = [commandId, ...history].slice(0, MAX_HISTORY)

  if (!isIndexedDbAvailable()) {
    memoryFallback = next
    return
  }

  try {
    const { set } = await getIdb()
    await set(HISTORY_KEY, next)
  } catch {
    memoryFallback = next
  }
}

export function sortByCommandSelectionHistory<T extends { command: string; title: string }>(
  commands: T[],
  history: string[],
): T[] {
  const scoreById = new Map<string, number>()

  // Most recent first: give higher weight to recent picks.
  for (let i = 0; i < history.length; i++) {
    const id = history[i]
    const weight = history.length - i
    scoreById.set(id, (scoreById.get(id) ?? 0) + weight)
  }

  return [...commands].sort((a, b) => {
    const scoreA = scoreById.get(a.command) ?? 0
    const scoreB = scoreById.get(b.command) ?? 0

    if (scoreA !== scoreB) return scoreB - scoreA
    return a.title.localeCompare(b.title)
  })
}
