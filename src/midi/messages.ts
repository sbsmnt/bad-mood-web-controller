export const MIDI_CHANNEL_COUNT = 16

export function clampMidiValue(value: number): number {
  return Math.max(0, Math.min(127, Math.round(value)))
}

export function controlChangeMessage(channel: number, cc: number, value: number): number[] {
  const safeChannel = Math.max(1, Math.min(MIDI_CHANNEL_COUNT, Math.round(channel)))
  return [0xb0 + safeChannel - 1, clampMidiValue(cc), clampMidiValue(value)]
}

export function programChangeMessage(channel: number, program: number): number[] {
  const safeChannel = Math.max(1, Math.min(MIDI_CHANNEL_COUNT, Math.round(channel)))
  return [0xc0 + safeChannel - 1, clampMidiValue(program)]
}
