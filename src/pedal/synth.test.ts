import { describe, expect, it } from 'vitest'
import { envelopePointsAttribute, getEnvelopePoints } from './synthEnvelope'
import { SYNTH_DEFAULTS, SYNTH_PARAMETERS, synthParameterValue } from './synthMode'

const byId = (id: string) => {
  const parameter = SYNTH_PARAMETERS.find((candidate) => candidate.id === id)
  if (!parameter) throw new Error(`Unknown synth parameter ${id}`)
  return parameter
}

describe('synthParameterValue', () => {
  it('shows pitch bend in semitones around the centre', () => {
    const pitchBend = byId('synth-pitch-bend')
    expect(synthParameterValue(pitchBend, 64)).toBe('+0.0 st')
    expect(synthParameterValue(pitchBend, 127)).toBe('+4.0 st')
    expect(synthParameterValue(pitchBend, 0)).toBe('-4.0 st')
  })

  it('shows option labels for output type and octave range', () => {
    expect(synthParameterValue(byId('synth-output-type'), 127)).toBe('ADSR')
    expect(synthParameterValue(byId('synth-octave-transpose'), 3)).toBe('36 semitones')
  })

  it('falls back to the raw value', () => {
    expect(synthParameterValue(byId('synth-attack'), 42)).toBe('42')
  })

  it('starts with the documented defaults', () => {
    expect(SYNTH_DEFAULTS).toMatchObject({
      'synth-output-type': 0,
      'synth-sustain': 127,
      'synth-octave-transpose': 3,
      'synth-pitch-bend': 64,
    })
  })
})

describe('getEnvelopePoints', () => {
  it('collapses attack, decay, and release at zero', () => {
    const [start, attack, decay, sustainEnd, release] = getEnvelopePoints(0, 0, 127, 0)

    expect(start).toEqual({ x: 4, y: 88 })
    expect(attack).toEqual({ x: 4, y: 12 })
    expect(decay).toEqual({ x: 4, y: 12 })
    expect(sustainEnd).toEqual({ x: 68, y: 12 })
    expect(release).toEqual({ x: 68, y: 88 })
  })

  it('stretches each stage to its full width at maximum', () => {
    const [, attack, decay, sustainEnd, release] = getEnvelopePoints(127, 127, 0, 127)

    expect(attack.x).toBe(27)
    expect(decay).toEqual({ x: 50, y: 88 })
    expect(sustainEnd).toEqual({ x: 68, y: 88 })
    expect(release.x).toBe(96)
  })

  it('clamps values outside the MIDI range', () => {
    expect(getEnvelopePoints(200, -5, 300, 999)).toEqual(getEnvelopePoints(127, 0, 127, 127))
  })

  it('formats points for an SVG polyline', () => {
    expect(
      envelopePointsAttribute([
        { x: 4, y: 88 },
        { x: 10.5, y: 12 },
      ]),
    ).toBe('4,88 10.5,12')
  })
})
