import { describe, expect, it } from 'vitest'
import {
  BAD_MOOD_DEFAULTS,
  BAD_MOOD_PARAMETERS,
  type BadMoodParameter,
  displayParameterValue,
  FLIP_CHORDS,
  flipChordForValue,
  flipChordMidiValue,
  knobFunction,
  loopModeForValue,
  nearestRadioStationValue,
  PERFORMANCE_ACTIONS,
  STEPPED_CLOCK_LABELS,
  wetModeForValue,
} from './badMood'
import { SYNTH_PARAMETERS } from './synthMode'

const byId = (id: string) => {
  const parameter = BAD_MOOD_PARAMETERS.find((candidate) => candidate.id === id)
  if (!parameter) throw new Error(`Unknown parameter ${id}`)
  return parameter
}

/** Pedal state with every default, overridden where a test needs it. */
const pedal = (overrides: Record<string, number> = {}) => ({ ...BAD_MOOD_DEFAULTS, ...overrides })

/** Asserts that `[min, max]` ranges cover 0–127 in order with no gaps or overlaps. */
const expectContiguousRanges = (ranges: [number, number][]) => {
  expect(ranges[0][0]).toBe(0)
  expect(ranges.at(-1)?.[1]).toBe(127)
  ranges.slice(1).forEach(([min], index) => {
    expect(min).toBe(ranges[index][1] + 1)
  })
}

describe('BAD MOOD parameter map', () => {
  const everyParameter: BadMoodParameter[] = [...BAD_MOOD_PARAMETERS, ...PERFORMANCE_ACTIONS, ...SYNTH_PARAMETERS]

  it('uses a unique id for every control', () => {
    const ids = everyParameter.map((parameter) => parameter.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never maps two controls to the same CC', () => {
    const ccs = everyParameter.map((parameter) => parameter.cc)
    const duplicates = ccs.filter((cc, index) => ccs.indexOf(cc) !== index)
    expect(duplicates).toEqual([])
  })

  it('keeps every CC number, default, and option value inside its range', () => {
    for (const parameter of everyParameter) {
      expect(parameter.cc, parameter.id).toBeGreaterThanOrEqual(0)
      expect(parameter.cc, parameter.id).toBeLessThanOrEqual(127)
      expect(parameter.defaultValue, parameter.id).toBeGreaterThanOrEqual(parameter.min)
      expect(parameter.defaultValue, parameter.id).toBeLessThanOrEqual(parameter.max)
      for (const option of parameter.options ?? []) {
        expect(option.value, `${parameter.id}: ${option.label}`).toBeGreaterThanOrEqual(parameter.min)
        expect(option.value, `${parameter.id}: ${option.label}`).toBeLessThanOrEqual(parameter.max)
      }
    }
  })

  it('matches the CC numbers in the MIDI manual', () => {
    expect(byId('time').cc).toBe(14)
    expect(byId('wet-modify').cc).toBe(17)
    expect(byId('wet-channel').cc).toBe(21)
    expect(byId('cross-input').cc).toBe(33)
    expect(byId('dip-time').cc).toBe(61)
    expect(byId('dip-dry-glue').cc).toBe(78)
    expect(byId('expression').cc).toBe(100)
    expect(byId('overdub').cc).toBe(106)
  })

  it('uses the Hidden Options defaults from the user manual', () => {
    expect(BAD_MOOD_DEFAULTS).toMatchObject({
      cross: 0,
      balance: 64,
      fade: 127,
      eq: 64,
      blend: 0,
      'master-volume': 64,
    })
  })

  it('confirms the factory reset before sending it', () => {
    expect(PERFORMANCE_ACTIONS.find((action) => action.id === 'factory-reset')?.dangerous).toBe(true)
  })
})

describe('STEPPED_CLOCK_LABELS', () => {
  it('covers 0–127 with no gaps or overlaps', () => {
    expectContiguousRanges(STEPPED_CLOCK_LABELS.map(([min, max]) => [min, max]))
  })
})

describe('FLIP_CHORDS', () => {
  it('lists the 48 chords in order', () => {
    expect(FLIP_CHORDS.map((chord) => chord.chord)).toEqual(Array.from({ length: 48 }, (_, index) => index + 1))
  })

  it('covers 0–127 with no gaps or overlaps', () => {
    expectContiguousRanges(FLIP_CHORDS.map((chord) => [chord.min, chord.max]))
  })

  it('never repeats a note inside a chord', () => {
    for (const chord of FLIP_CHORDS) {
      expect(new Set(chord.notes).size, `chord ${chord.chord}`).toBe(chord.notes.length)
    }
  })

  it('finds the chord for any CC 17 value', () => {
    expect(flipChordForValue(0).chord).toBe(1)
    expect(flipChordForValue(64).chord).toBe(25)
    expect(flipChordForValue(127).chord).toBe(48)
  })

  it('sends a value that recalls the same chord', () => {
    for (const chord of FLIP_CHORDS) {
      expect(flipChordForValue(flipChordMidiValue(chord)).chord).toBe(chord.chord)
    }
  })
})

describe('toggle modes', () => {
  it('reads the three-way toggles like the pedal (0–1, 2, 3+)', () => {
    expect([0, 1, 2, 3, 127].map(wetModeForValue)).toEqual(['soup', 'soup', 'relay', 'flip', 'flip'])
    expect([0, 1, 2, 3, 127].map(loopModeForValue)).toEqual(['burst', 'burst', 'radio', 'mask', 'mask'])
  })
})

describe('knobFunction', () => {
  it('describes the wet knobs for each wet channel mode', () => {
    expect(knobFunction('time', pedal({ 'wet-channel': 0 }))).toBe('Decay')
    expect(knobFunction('time', pedal({ 'wet-channel': 2 }))).toBe('Delay')
    expect(knobFunction('wet-modify', pedal({ 'wet-channel': 2 }))).toBe('Repeats')
    expect(knobFunction('wet-modify', pedal({ 'wet-channel': 3 }))).toBe('Harmony')
  })

  it('describes the loop knobs for each micro-looper mode', () => {
    expect(knobFunction('length', pedal({ 'micro-looper': 0 }))).toBe('Step size')
    expect(knobFunction('loop-modify', pedal({ 'micro-looper': 3 }))).toBe('Threshold')
  })

  it('follows the selected radio station for LENGTH', () => {
    expect(knobFunction('length', pedal({ 'micro-looper': 2, 'loop-modify': 0 }))).toBe('Speed')
    expect(knobFunction('length', pedal({ 'micro-looper': 2, 'loop-modify': 60 }))).toBe('Voices')
    expect(knobFunction('length', pedal({ 'micro-looper': 2, 'loop-modify': 127 }))).toBe('Rotation')
  })

  it('has no mode label for the shared knobs', () => {
    expect(knobFunction('mix', pedal())).toBeNull()
    expect(knobFunction('clock', pedal())).toBeNull()
  })
})

describe('nearestRadioStationValue', () => {
  it('snaps to the closest station', () => {
    expect(nearestRadioStationValue(10)).toBe(0)
    expect(nearestRadioStationValue(40)).toBe(32)
    expect(nearestRadioStationValue(90)).toBe(97)
    expect(nearestRadioStationValue(120)).toBe(127)
  })
})

describe('displayParameterValue', () => {
  it('shows the option label for switch positions', () => {
    expect(displayParameterValue(byId('wet-channel'), 3)).toBe('Flip')
    expect(displayParameterValue(byId('sync'), 0)).toBe('Loop follows wet')
  })

  it('shows the sample rate for the clock knob', () => {
    expect(displayParameterValue(byId('clock'), 0)).toBe('2k')
    expect(displayParameterValue(byId('clock'), 64)).toBe('12k')
    expect(displayParameterValue(byId('clock'), 127)).toBe('64k')
  })

  it('names the radio station for loop modify unless asked not to', () => {
    expect(displayParameterValue(byId('loop-modify'), 32)).toBe('Ambient · 32')
    expect(displayParameterValue(byId('loop-modify'), 32, { showRadioStationLabel: false })).toBe('32')
  })

  it('falls back to the raw value', () => {
    expect(displayParameterValue(byId('time'), 64)).toBe('64')
  })
})
