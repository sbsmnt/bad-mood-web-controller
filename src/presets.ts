export type Preset = {
  id: string
  name: string
  values: Record<string, number>
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'bad-mood-editor.presets.v1'

export function loadPresets(): Preset[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is Preset => {
      if (!item || typeof item !== 'object') return false
      const preset = item as Partial<Preset>
      return (
        typeof preset.id === 'string' &&
        typeof preset.name === 'string' &&
        typeof preset.createdAt === 'number' &&
        typeof preset.updatedAt === 'number' &&
        Boolean(preset.values) &&
        typeof preset.values === 'object'
      )
    })
  } catch {
    return []
  }
}

export function storePresets(presets: Preset[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function createPreset(name: string, values: Record<string, number>): Preset {
  const now = Date.now()
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`,
    name: name.trim(),
    values: { ...values },
    createdAt: now,
    updatedAt: now,
  }
}
