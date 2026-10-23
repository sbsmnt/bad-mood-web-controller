export type ParameterGroup = 'Pedal' | 'Hidden voices' | 'Clock' | 'DIP switches' | 'Utilities'

export type ValueOption = { label: string; value: number }

export type BadMoodParameter = {
  id: string
  name: string
  shortName?: string
  description?: string
  cc: number
  min: number
  max: number
  defaultValue: number
  kind: 'continuous' | 'toggle' | 'select' | 'action'
  group: ParameterGroup
  options?: ValueOption[]
  dangerous?: boolean
}

const offOn: ValueOption[] = [
  { label: 'Off', value: 0 },
  { label: 'On', value: 127 },
]

const divisions: ValueOption[] = [
  'Thirty-second',
  'Sixteenth',
  'Eighth triplet',
  'Eighth',
  'Quarter',
  'Half',
  'Dotted half',
  'Whole',
  'Double whole',
].map((label, value) => ({ label, value }))

const continuous = (
  id: string,
  name: string,
  cc: number,
  group: ParameterGroup,
  defaultValue = 64,
  description?: string,
): BadMoodParameter => ({
  id,
  name,
  cc,
  group,
  defaultValue,
  description,
  min: 0,
  max: 127,
  kind: 'continuous',
})

const toggle = (
  id: string,
  name: string,
  cc: number,
  group: ParameterGroup,
  description?: string,
): BadMoodParameter => ({
  id,
  name,
  cc,
  group,
  description,
  defaultValue: 0,
  min: 0,
  max: 127,
  kind: 'toggle',
  options: offOn,
})

export const BAD_MOOD_PARAMETERS: BadMoodParameter[] = [
  continuous('time', 'Time', 14, 'Pedal', 64),
  continuous('mix', 'Mix', 15, 'Pedal', 64),
  continuous('length', 'Length', 16, 'Pedal', 64),
  continuous('wet-modify', 'Wet Modify', 17, 'Pedal', 64),
  continuous('clock', 'Clock', 18, 'Pedal', 64, 'Uses stepped sample-rate ranges; see the value readout.'),
  continuous(
    'loop-modify',
    'Loop Modify',
    19,
    'Pedal',
    64,
    'Radio stations: Tape 0, Ambient 32, Orchestral 63, Shoegaze 97, Dance 127.',
  ),
  continuous('ramp-speed', 'Ramp Speed', 20, 'Pedal', 64),
  {
    id: 'wet-channel',
    name: 'Wet Channel',
    cc: 21,
    group: 'Pedal',
    defaultValue: 0,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Soup', value: 0 },
      { label: 'Relay', value: 2 },
      { label: 'Flip', value: 3 },
    ],
  },
  {
    id: 'routing',
    name: 'Routing',
    cc: 22,
    group: 'Pedal',
    defaultValue: 0,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Input → Loop → Wet', value: 0 },
      { label: 'Parallel', value: 2 },
      { label: 'Input → Wet → Loop', value: 3 },
    ],
  },
  {
    id: 'micro-looper',
    name: 'Micro-looper',
    cc: 23,
    group: 'Pedal',
    defaultValue: 0,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Burst', value: 0 },
      { label: 'Radio', value: 2 },
      { label: 'Mask', value: 3 },
    ],
  },
  toggle('loop-bypass', 'Micro-looper bypass', 102, 'Pedal'),
  toggle('wet-bypass', 'Wet bypass', 103, 'Pedal'),
  toggle('hidden-options', 'Hidden options', 104, 'Pedal'),
  toggle('freeze', 'Freeze', 105, 'Pedal'),
  toggle('overdub', 'Overdub', 106, 'Pedal'),

  // Defaults follow the manual's Hidden Options page.
  continuous('cross', 'Cross', 24, 'Hidden voices', 0, 'Off by default'),
  continuous('balance', 'Balance', 25, 'Hidden voices', 64, 'Even at noon'),
  continuous('fade', 'Fade', 26, 'Hidden voices', 127, 'Max = no fade while overdubbing'),
  continuous('eq', 'EQ', 27, 'Hidden voices', 64, 'Noon = flat'),
  continuous('glue', 'Glue', 28, 'Hidden voices'),
  continuous('blend', 'Blend', 29, 'Hidden voices', 0, 'Clean micro-loop through the wet channel'),
  continuous(
    'master-volume',
    'Master Volume',
    30,
    'Hidden voices',
    64,
    'Noon ≈ unity · right footswitch + MIX on the pedal',
  ),
  {
    id: 'sync',
    name: 'Sync',
    cc: 31,
    group: 'Hidden voices',
    defaultValue: 2,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Loop follows wet', value: 0 },
      { label: 'No sync', value: 2 },
      { label: 'Wet follows loop', value: 3 },
    ],
  },
  {
    id: 'spread',
    name: 'Spread',
    cc: 32,
    group: 'Hidden voices',
    defaultValue: 2,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Wet only', value: 0 },
      { label: 'Both', value: 2 },
      { label: 'Loop only', value: 3 },
    ],
  },
  {
    id: 'cross-input',
    name: 'Cross Input',
    cc: 33,
    group: 'Hidden voices',
    defaultValue: 2,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Wet into loop', value: 0 },
      { label: 'Main input', value: 2 },
      { label: 'Loop into wet', value: 3 },
    ],
  },

  {
    id: 'wet-division',
    name: 'Wet Clock Division',
    cc: 53,
    group: 'Clock',
    defaultValue: 4,
    min: 0,
    max: 8,
    kind: 'select',
    options: divisions,
    description: 'Under 60 BPM shifts pitch',
  },
  {
    id: 'loop-division',
    name: 'Loop Clock Division',
    cc: 54,
    group: 'Clock',
    defaultValue: 4,
    min: 0,
    max: 8,
    kind: 'select',
    options: divisions,
    description: 'Under 60 BPM shifts pitch',
  },
  {
    id: 'clock-ignore',
    name: 'Follow MIDI Clock',
    cc: 51,
    group: 'Clock',
    defaultValue: 127,
    min: 0,
    max: 127,
    kind: 'toggle',
    options: [
      { label: 'Ignore', value: 0 },
      { label: 'Follow', value: 127 },
    ],
  },

  toggle('dip-time', 'Time', 61, 'DIP switches'),
  toggle('dip-wet-modify', 'Wet Modify', 62, 'DIP switches'),
  toggle('dip-clock', 'Clock', 63, 'DIP switches'),
  toggle('dip-loop-modify', 'Loop Modify', 64, 'DIP switches'),
  toggle('dip-length', 'Length', 65, 'DIP switches'),
  toggle('dip-bounce', 'Bounce', 66, 'DIP switches'),
  {
    ...toggle('dip-sweep', 'Sweep', 67, 'DIP switches'),
    options: [
      { label: 'Bottom', value: 0 },
      { label: 'Top', value: 127 },
    ],
  },
  {
    ...toggle('dip-polarity', 'Polarity', 68, 'DIP switches'),
    options: [
      { label: 'Falling', value: 0 },
      { label: 'Rising', value: 127 },
    ],
  },
  toggle('dip-miso', 'MISO', 71, 'DIP switches'),
  toggle('dip-spread', 'Spread', 72, 'DIP switches'),
  toggle('dip-dry-kill', 'Dry Kill', 73, 'DIP switches'),
  toggle('dip-trails', 'Trails', 74, 'DIP switches'),
  toggle('dip-latch', 'Latch', 75, 'DIP switches'),
  toggle('dip-half', 'Half', 76, 'DIP switches'),
  toggle('dip-smooth', 'Smooth', 77, 'DIP switches'),
  toggle('dip-dry-glue', 'Dry Glue', 78, 'DIP switches'),

  {
    ...toggle('stop-ramping', 'Ramping', 52, 'Utilities'),
    options: [
      { label: 'Stop', value: 0 },
      { label: 'Resume', value: 127 },
    ],
  },
  toggle('true-bypass', 'True Bypass Mode', 55, 'Utilities'),
  {
    id: 'eq-per-channel',
    name: 'EQ Per Channel',
    cc: 85,
    group: 'Utilities',
    defaultValue: 2,
    min: 0,
    max: 3,
    kind: 'select',
    options: [
      { label: 'Wet only', value: 0 },
      { label: 'Both', value: 2 },
      { label: 'Loop only', value: 3 },
    ],
  },
  continuous('expression', 'Expression', 100, 'Utilities', 0, 'Moves the knobs picked with the Control dip switches'),
]

export const PERFORMANCE_ACTIONS: BadMoodParameter[] = [
  {
    id: 'tap-tempo',
    name: 'Tap tempo',
    cc: 93,
    group: 'Utilities',
    defaultValue: 127,
    min: 0,
    max: 127,
    kind: 'action',
    description: 'Hold a footswitch and turn TIME to exit',
  },
  {
    id: 'midi-reset',
    name: 'MIDI reset',
    cc: 110,
    group: 'Utilities',
    defaultValue: 127,
    min: 0,
    max: 127,
    kind: 'action',
    description: 'Restores the manual’s documented MIDI defaults.',
  },
  {
    id: 'factory-reset',
    name: 'Factory reset',
    cc: 56,
    group: 'Utilities',
    defaultValue: 127,
    min: 0,
    max: 127,
    kind: 'action',
    dangerous: true,
  },
]

export const BAD_MOOD_DEFAULTS = Object.fromEntries(
  BAD_MOOD_PARAMETERS.map((parameter) => [parameter.id, parameter.defaultValue]),
)

export const STEPPED_CLOCK_LABELS = [
  [0, 4, '2k'],
  [5, 15, '3k'],
  [16, 28, '4k'],
  [29, 40, '6k'],
  [41, 53, '8k'],
  [54, 69, '12k'],
  [70, 83, '16k'],
  [84, 95, '24k'],
  [96, 109, '32k'],
  [110, 121, '48k'],
  [122, 127, '64k'],
] as const

export const RADIO_STATIONS = [
  { value: 0, label: 'Tape' },
  { value: 32, label: 'Ambient' },
  { value: 63, label: 'Orchestral' },
  { value: 97, label: 'Shoegaze' },
  { value: 127, label: 'Dance' },
] as const

export function nearestRadioStationValue(value: number) {
  return RADIO_STATIONS.reduce((nearest, station) =>
    Math.abs(station.value - value) < Math.abs(nearest.value - value) ? station : nearest,
  ).value
}

export type FlipChord = {
  chord: number
  min: number
  max: number
  notes: string[]
}

export const FLIP_CHORDS: FlipChord[] = [
  { chord: 1, min: 0, max: 2, notes: ['−Oct'] },
  { chord: 2, min: 3, max: 5, notes: ['−5th'] },
  { chord: 3, min: 6, max: 7, notes: ['−4th'] },
  { chord: 4, min: 8, max: 10, notes: ['+4th'] },
  { chord: 5, min: 11, max: 13, notes: ['+5th'] },
  { chord: 6, min: 14, max: 15, notes: ['+Oct'] },
  { chord: 7, min: 16, max: 18, notes: ['−Oct', '−5th'] },
  { chord: 8, min: 19, max: 21, notes: ['−5th', '+Oct'] },
  { chord: 9, min: 22, max: 23, notes: ['−Oct', '−4th'] },
  { chord: 10, min: 24, max: 26, notes: ['−4th', '+Oct'] },
  { chord: 11, min: 27, max: 29, notes: ['−Oct', '+4th'] },
  { chord: 12, min: 30, max: 31, notes: ['+4th', '+Oct'] },
  { chord: 13, min: 32, max: 34, notes: ['−Oct', '+5th'] },
  { chord: 14, min: 35, max: 37, notes: ['+5th', '+Oct'] },
  { chord: 15, min: 38, max: 39, notes: ['−Oct', '+Oct'] },
  { chord: 16, min: 40, max: 42, notes: ['−5th', '−4th'] },
  { chord: 17, min: 43, max: 44, notes: ['−4th', '+4th'] },
  { chord: 18, min: 45, max: 47, notes: ['−5th', '+4th'] },
  { chord: 19, min: 48, max: 50, notes: ['−5th', '+5th'] },
  { chord: 20, min: 51, max: 52, notes: ['−4th', '+5th'] },
  { chord: 21, min: 53, max: 55, notes: ['+4th', '+5th'] },
  { chord: 22, min: 56, max: 58, notes: ['−Oct', '−5th', '−4th'] },
  { chord: 23, min: 59, max: 60, notes: ['−5th', '−4th', '+4th'] },
  { chord: 24, min: 61, max: 63, notes: ['+Oct', '+5th', '+4th'] },
  { chord: 25, min: 64, max: 66, notes: ['+5th', '+4th', '−4th'] },
  { chord: 26, min: 67, max: 68, notes: ['−Oct', '−5th', '+4th'] },
  { chord: 27, min: 69, max: 71, notes: ['−5th', '+4th', '+5th'] },
  { chord: 28, min: 72, max: 74, notes: ['+Oct', '+5th', '−5th'] },
  { chord: 29, min: 75, max: 76, notes: ['+5th', '−5th', '−Oct'] },
  { chord: 30, min: 77, max: 79, notes: ['−Oct', '−5th', '+Oct'] },
  { chord: 31, min: 80, max: 82, notes: ['−Oct', '−4th', '+4th'] },
  { chord: 32, min: 83, max: 84, notes: ['−4th', '+4th', '+Oct'] },
  { chord: 33, min: 85, max: 87, notes: ['+Oct', '+5th', '−4th'] },
  { chord: 34, min: 88, max: 89, notes: ['+5th', '−4th', '−Oct'] },
  { chord: 35, min: 90, max: 92, notes: ['−Oct', '−4th', '+Oct'] },
  { chord: 36, min: 93, max: 95, notes: ['−5th', '−4th', '+5th'] },
  { chord: 37, min: 96, max: 97, notes: ['−Oct', '+4th', '+5th'] },
  { chord: 38, min: 98, max: 100, notes: ['+Oct', '−4th', '−5th'] },
  { chord: 39, min: 101, max: 103, notes: ['−Oct', '+4th', '+Oct'] },
  { chord: 40, min: 104, max: 105, notes: ['+Oct', '+5th', '−Oct'] },
  { chord: 41, min: 106, max: 108, notes: ['−Oct', '−5th', '−4th', '+4th'] },
  { chord: 42, min: 109, max: 111, notes: ['−5th', '−4th', '+5th', '−Oct'] },
  { chord: 43, min: 112, max: 113, notes: ['−4th', '+Oct', '−Oct', '−5th'] },
  { chord: 44, min: 114, max: 116, notes: ['+5th', '−Oct', '−5th', '+4th'] },
  { chord: 45, min: 117, max: 119, notes: ['−5th', '+4th', '+Oct', '−Oct'] },
  { chord: 46, min: 120, max: 121, notes: ['+5th', '+Oct', '−Oct', '−5th'] },
  { chord: 47, min: 122, max: 124, notes: ['+4th', '+5th', '−Oct', '−4th'] },
  { chord: 48, min: 125, max: 127, notes: ['+4th', '+Oct', '−Oct', '−4th'] },
]

export function flipChordForValue(value: number) {
  return FLIP_CHORDS.find((chord) => value >= chord.min && value <= chord.max) ?? FLIP_CHORDS[0]
}

export function flipChordMidiValue(chord: FlipChord) {
  return Math.round((chord.min + chord.max) / 2)
}

export type WetMode = 'soup' | 'relay' | 'flip'
export type LoopMode = 'burst' | 'radio' | 'mask'

// Three-way toggles: 0–1 left, 2 middle, 3+ right.
export const wetModeForValue = (value: number): WetMode => (value <= 1 ? 'soup' : value === 2 ? 'relay' : 'flip')
export const loopModeForValue = (value: number): LoopMode => (value <= 1 ? 'burst' : value === 2 ? 'radio' : 'mask')

const RADIO_LENGTH_FUNCTIONS: Record<string, string> = {
  Tape: 'Speed',
  Ambient: 'Stretch',
  Orchestral: 'Voices',
  Shoegaze: 'Moment',
  Dance: 'Rotation',
}

/** What a mode-dependent knob does in the current mode, per the manual's control pages. */
export function knobFunction(id: string, values: Record<string, number>) {
  const wetMode = wetModeForValue(values['wet-channel'])
  const loopMode = loopModeForValue(values['micro-looper'])
  switch (id) {
    case 'time':
      return { soup: 'Decay', relay: 'Delay', flip: 'Lag' }[wetMode]
    case 'wet-modify':
      return { soup: 'Character', relay: 'Repeats', flip: 'Harmony' }[wetMode]
    case 'length': {
      if (loopMode !== 'radio') return { burst: 'Step size', mask: 'Character' }[loopMode]
      const station = RADIO_STATIONS.find(
        (candidate) => candidate.value === nearestRadioStationValue(values['loop-modify']),
      )
      return station ? RADIO_LENGTH_FUNCTIONS[station.label] : 'Station'
    }
    case 'loop-modify':
      return { burst: 'Sensitivity', radio: 'Scan', mask: 'Threshold' }[loopMode]
    default:
      return null
  }
}

export const RAMP_DIP_IDS = ['dip-time', 'dip-wet-modify', 'dip-clock', 'dip-loop-modify', 'dip-length'] as const

export function displayParameterValue(
  parameter: BadMoodParameter,
  value: number,
  options?: { showRadioStationLabel?: boolean },
) {
  const option = parameter.options?.find((candidate) => candidate.value === value)
  if (option) return option.label
  if (parameter.id === 'clock')
    return STEPPED_CLOCK_LABELS.find(([min, max]) => value >= min && value <= max)?.[2] ?? value
  if (parameter.id === 'loop-modify' && options?.showRadioStationLabel !== false) {
    const stationValue = nearestRadioStationValue(value)
    const station = RADIO_STATIONS.find((candidate) => candidate.value === stationValue)
    if (station) return `${station.label} · ${value}`
  }
  return String(value)
}
