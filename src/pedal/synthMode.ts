import type { BadMoodParameter, ValueOption } from './badMood'

const continuous = (
  id: string,
  name: string,
  cc: number,
  defaultValue: number,
  description?: string,
): BadMoodParameter => ({
  id,
  name,
  cc,
  defaultValue,
  description,
  min: 0,
  max: 127,
  kind: 'continuous',
  group: 'Utilities',
})

const octaveOptions: ValueOption[] = Array.from({ length: 9 }, (_, index) => ({
  label: `${(index + 1) * 12} semitones`,
  value: index + 1,
}))

export const SYNTH_PARAMETERS: BadMoodParameter[] = [
  {
    id: 'synth-output-type',
    name: 'Output Type',
    cc: 58,
    defaultValue: 0,
    min: 0,
    max: 127,
    kind: 'select',
    group: 'Utilities',
    options: [
      { label: 'Open', value: 0 },
      { label: 'Note On / Off', value: 1 },
      { label: 'ADSR', value: 127 },
    ],
  },
  continuous('synth-attack', 'Attack', 80, 0),
  continuous('synth-decay', 'Decay', 81, 0),
  continuous('synth-sustain', 'Sustain', 82, 127),
  continuous('synth-release', 'Release', 83, 0),
  {
    id: 'synth-octave-transpose',
    name: 'Octave Transpose',
    cc: 57,
    defaultValue: 3,
    min: 1,
    max: 9,
    kind: 'select',
    group: 'Utilities',
    options: octaveOptions,
  },
  continuous('synth-portamento', 'Portamento', 84, 0, 'Glide time between notes'),
  continuous('synth-pitch-bend', 'Pitch Bend', 0, 64, 'Range ±4 semitones'),
  continuous('synth-mod-wheel', 'Modulation Wheel', 1, 0),
]

export const SYNTH_DEFAULTS = Object.fromEntries(
  SYNTH_PARAMETERS.map((parameter) => [parameter.id, parameter.defaultValue]),
)

export function synthParameterValue(parameter: BadMoodParameter, value: number) {
  const option = parameter.options?.find((candidate) => candidate.value === value)
  if (option) return option.label
  if (parameter.id === 'synth-pitch-bend') {
    const semitones = value >= 64 ? ((value - 64) / 63) * 4 : ((value - 64) / 64) * 4
    return `${semitones >= 0 ? '+' : ''}${semitones.toFixed(1)} st`
  }
  return String(value)
}
