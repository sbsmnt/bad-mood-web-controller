import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPreset, loadPresets, type Preset, storePresets } from './presets'

const STORAGE_KEY = 'bad-mood-editor.presets.v1'

function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key)
    },
    setItem: (key, value) => {
      items.set(key, String(value))
    },
  }
}

const preset = (overrides: Partial<Preset> = {}): Preset => ({
  id: 'preset-1',
  name: 'Broken radio',
  values: { time: 90, mix: 40 },
  createdAt: 1,
  updatedAt: 2,
  ...overrides,
})

let storage: Storage

beforeEach(() => {
  storage = memoryStorage()
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loadPresets', () => {
  it('returns an empty library when nothing is stored', () => {
    expect(loadPresets()).toEqual([])
  })

  it('round-trips presets through storage', () => {
    const presets = [preset(), preset({ id: 'preset-2', name: 'Tape wobble' })]

    storePresets(presets)

    expect(loadPresets()).toEqual(presets)
  })

  it('ignores corrupted JSON', () => {
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadPresets()).toEqual([])
  })

  it('ignores stored data that is not a list', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ presets: [preset()] }))
    expect(loadPresets()).toEqual([])
  })

  it('drops malformed entries and keeps valid ones', () => {
    const valid = preset()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify([valid, null, 'text', { ...valid, id: 7 }, { ...valid, values: null }, { name: 'No id' }]),
    )

    expect(loadPresets()).toEqual([valid])
  })

  it('returns an empty library when storage is blocked', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('SecurityError')
        },
      },
    })

    expect(loadPresets()).toEqual([])
  })
})

describe('createPreset', () => {
  it('trims the name and stamps both timestamps with the current time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'))

    const created = createPreset('  Shimmer pad  ', { time: 10 })

    expect(created.name).toBe('Shimmer pad')
    expect(created.createdAt).toBe(Date.parse('2026-07-01T12:00:00Z'))
    expect(created.updatedAt).toBe(created.createdAt)
  })

  it('copies the values so later edits do not change the preset', () => {
    const values = { time: 10, mix: 20 }

    const created = createPreset('Copy', values)
    values.time = 99

    expect(created.values).toEqual({ time: 10, mix: 20 })
  })

  it('gives every preset a unique id', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createPreset('Same name', {}).id))
    expect(ids.size).toBe(20)
  })
})
