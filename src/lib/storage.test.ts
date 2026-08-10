import { beforeEach, describe, expect, it } from 'vitest'
import { emptyStore, loadStore, mergeStores, parseStore, saveStore } from './storage'
import type { DayRecord, Store } from './types'

/** Minimal in-memory Storage so these tests run without a DOM. */
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  failWrites = false

  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('QuotaExceededError')
    this.data.set(key, value)
  }
}

function record(date: string, overrides: Partial<DayRecord> = {}): DayRecord {
  return {
    date,
    status: 'solved',
    cluesUsed: 2,
    durationMs: 45_000,
    wrongGuesses: 1,
    completedAt: 100,
    ...overrides,
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
})

describe('parseStore', () => {
  it('keeps good days and drops only the broken ones', () => {
    const parsed = parseStore({
      version: 1,
      records: {
        '2026-09-01': record('2026-09-01'),
        '2026-09-02': { status: 'nonsense' },
        'not-a-date': record('2026-09-03'),
      },
    })

    expect(Object.keys(parsed.records)).toEqual(['2026-09-01'])
  })

  it('survives complete garbage', () => {
    expect(parseStore(null).records).toEqual({})
    expect(parseStore('nope').records).toEqual({})
    expect(parseStore([1, 2, 3]).settings.previewDate).toBeNull()
  })

  it('discards in-flight progress for a day that already finished', () => {
    const parsed = parseStore({
      records: { '2026-09-01': record('2026-09-01') },
      progress: { '2026-09-01': { cluesRevealed: 2 } },
    })
    expect(parsed.progress['2026-09-01']).toBeUndefined()
  })
})

describe('loadStore / saveStore', () => {
  it('round-trips a store', () => {
    const store: Store = { ...emptyStore(), records: { '2026-09-01': record('2026-09-01') } }
    expect(saveStore(store, storage)).toBe(true)
    expect(loadStore(storage).records['2026-09-01'].durationMs).toBe(45_000)
  })

  it('falls back to the backup when the live key is corrupted', () => {
    saveStore({ ...emptyStore(), records: { '2026-09-01': record('2026-09-01') } }, storage)
    // A second write moves the good value into the backup slot.
    saveStore({ ...emptyStore(), records: { '2026-09-02': record('2026-09-02') } }, storage)
    storage.setItem('wotd:store:v1', '{ this is not json')

    const recovered = loadStore(storage)
    expect(Object.keys(recovered.records)).toEqual(['2026-09-01'])
  })

  it('quarantines unreadable data instead of dropping it', () => {
    storage.setItem('wotd:store:v1', '<<corrupt>>')
    loadStore(storage)
    const quarantined = [...Array(storage.length).keys()]
      .map((i) => storage.key(i))
      .filter((key): key is string => Boolean(key?.startsWith('wotd:corrupt:')))
    expect(quarantined).toHaveLength(1)
  })

  it('reports failure rather than throwing when storage is unavailable', () => {
    storage.failWrites = true
    expect(saveStore(emptyStore(), storage)).toBe(false)
  })
})

describe('mergeStores', () => {
  it('never deletes existing history', () => {
    const current: Store = { ...emptyStore(), records: { '2026-09-01': record('2026-09-01') } }
    const incoming: Store = { ...emptyStore(), records: { '2026-09-02': record('2026-09-02') } }

    const merged = mergeStores(current, incoming)
    expect(Object.keys(merged.records).sort()).toEqual(['2026-09-01', '2026-09-02'])
  })

  it('keeps the earlier completion when both sides have the same day', () => {
    const current: Store = {
      ...emptyStore(),
      records: { '2026-09-01': record('2026-09-01', { completedAt: 500, durationMs: 1 }) },
    }
    const incoming: Store = {
      ...emptyStore(),
      records: { '2026-09-01': record('2026-09-01', { completedAt: 100, durationMs: 2 }) },
    }

    expect(mergeStores(current, incoming).records['2026-09-01'].durationMs).toBe(2)
  })
})
