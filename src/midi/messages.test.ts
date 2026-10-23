import { describe, expect, it } from 'vitest'
import { clampMidiValue, controlChangeMessage, programChangeMessage } from './messages'

describe('clampMidiValue', () => {
  it('keeps values inside the 7-bit MIDI range', () => {
    expect(clampMidiValue(0)).toBe(0)
    expect(clampMidiValue(64)).toBe(64)
    expect(clampMidiValue(127)).toBe(127)
  })

  it('clamps out-of-range values', () => {
    expect(clampMidiValue(-10)).toBe(0)
    expect(clampMidiValue(200)).toBe(127)
  })

  it('rounds fractional values', () => {
    expect(clampMidiValue(63.4)).toBe(63)
    expect(clampMidiValue(63.5)).toBe(64)
  })
})

describe('controlChangeMessage', () => {
  it('builds a Control Change on the requested channel', () => {
    // Status byte 0xB0 + (channel - 1): BAD MOOD listens on channel 2 by default.
    expect(controlChangeMessage(2, 14, 100)).toEqual([0xb1, 14, 100])
    expect(controlChangeMessage(1, 0, 0)).toEqual([0xb0, 0, 0])
    expect(controlChangeMessage(16, 127, 127)).toEqual([0xbf, 127, 127])
  })

  it('clamps the channel to 1–16', () => {
    expect(controlChangeMessage(0, 14, 1)[0]).toBe(0xb0)
    expect(controlChangeMessage(99, 14, 1)[0]).toBe(0xbf)
  })

  it('clamps the controller number and value', () => {
    expect(controlChangeMessage(1, 300, -4)).toEqual([0xb0, 127, 0])
  })
})

describe('programChangeMessage', () => {
  it('builds a two-byte Program Change', () => {
    expect(programChangeMessage(2, 0)).toEqual([0xc1, 0])
    expect(programChangeMessage(2, 122)).toEqual([0xc1, 122])
  })

  it('clamps the channel and program number', () => {
    expect(programChangeMessage(-3, 500)).toEqual([0xc0, 127])
  })
})
