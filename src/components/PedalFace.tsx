import { type CSSProperties, type PointerEvent, useRef } from 'react'
import {
  type BadMoodParameter,
  displayParameterValue,
  flipChordForValue,
  knobFunction,
  nearestRadioStationValue,
  RADIO_STATIONS,
  RAMP_DIP_IDS,
  STEPPED_CLOCK_LABELS,
} from '../pedal/badMood'

type Props = {
  parameters: Record<string, BadMoodParameter>
  values: Record<string, number>
  onChange: (parameter: BadMoodParameter, value: number) => void
  onTapTempo: () => void
}

const knobIds = ['time', 'mix', 'length', 'wet-modify', 'clock', 'loop-modify'] as const
type KnobId = (typeof knobIds)[number]

const secondaryLabels: Record<KnobId, string> = {
  time: 'Cross',
  mix: 'Balance · Ramp',
  length: 'Fade',
  'wet-modify': 'EQ',
  clock: 'Glue',
  'loop-modify': 'Blend',
}

const switchLabels: Record<string, string> = {
  'wet-channel': 'Sync',
  routing: 'Spread',
  'micro-looper': 'Input mod',
}

// MIX and CLOCK carry the alternate print colour on the hardware.
const altPrintKnobs = new Set<KnobId>(['mix', 'clock'])

const SWEEP = 270

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const angleFor = (value: number, min: number, max: number) => -SWEEP / 2 + ((value - min) / (max - min)) * SWEEP

// Hand-drawn feel for the enclosure print: vertical lines that ripple harder towards the middle.
const TEXTURE_PATHS = Array.from({ length: 84 }, (_, line) => {
  const x0 = line * 2.5 + 1
  const points: string[] = []
  for (let y = -3; y <= 303; y += 3) {
    const band = Math.sin(y * 0.024 + line * 0.07) ** 4
    const amplitude = 0.25 + band * 1.5
    const x = x0 + amplitude * Math.sin(y * 0.55 + line * 0.35)
    points.push(`${x.toFixed(2)},${y}`)
  }
  return `M${points.join(' L')}`
})

const SUN_PATHS = Array.from({ length: 22 }, (_, line) => {
  const y0 = line * 4.6 + 2
  const points: string[] = []
  for (let x = 0; x <= 100; x += 3) {
    const y = y0 + 1.6 * Math.sin(x * 0.28 + line * 1.3) * Math.sin(x * 0.05 + line * 0.4)
    points.push(`${x},${y.toFixed(2)}`)
  }
  return `M${points.join(' L')}`
})

function PedalTexture() {
  return (
    <svg className="pedal-texture" viewBox="0 0 208 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {TEXTURE_PATHS.map((d) => (
        <path d={d} key={d} />
      ))}
    </svg>
  )
}

function ClockScale({ value }: { value: number }) {
  return (
    <svg className="clock-scale" viewBox="-75 -75 150 150" aria-hidden="true">
      {STEPPED_CLOCK_LABELS.map(([min, max, label]) => {
        const angle = (angleFor((min + max) / 2, 0, 127) * Math.PI) / 180
        const selected = value >= min && value <= max
        return (
          <text
            x={Math.sin(angle) * 52}
            y={-Math.cos(angle) * 52 + 2.5}
            className={selected ? 'selected' : ''}
            key={label}
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

function RadioStations({ value }: { value: number }) {
  const selectedStationValue = nearestRadioStationValue(value)
  return (
    <svg className="radio-station-labels" viewBox="0 0 136 136" aria-hidden="true">
      <defs>
        <path id="radio-tape-path" d="M 17 108 Q 7 91 12 72" />
        <path id="radio-ambient-path" d="M 13 67 Q 20 38 42 25" />
        <path id="radio-orchestral-path" d="M 43 23 Q 68 12 93 23" />
        <path id="radio-shoegaze-path" d="M 94 25 Q 116 38 123 67" />
        <path id="radio-dance-path" d="M 124 72 Q 129 91 119 108" />
      </defs>
      {RADIO_STATIONS.map((station) => (
        <text className={station.value === selectedStationValue ? 'selected' : ''} key={station.value}>
          <textPath href={`#radio-${station.label.toLowerCase()}-path`} startOffset="50%">
            {station.label}
          </textPath>
        </text>
      ))}
    </svg>
  )
}

function PedalKnob({
  id,
  parameter,
  value,
  onChange,
  label,
  modeLabel,
  radioMode = false,
  flipMode = false,
  smoothClock = false,
  halfLoop = false,
}: {
  id: KnobId
  parameter: BadMoodParameter
  value: number
  onChange: (value: number) => void
  label?: string
  /** What the knob does in the current mode, shown ahead of the value. */
  modeLabel?: string | null
  radioMode?: boolean
  flipMode?: boolean
  smoothClock?: boolean
  halfLoop?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const drag = useRef<{ y: number; value: number } | null>(null)

  const startDrag = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { y: event.clientY, value }
    inputRef.current?.focus({ preventScroll: true })
  }

  const moveDrag = (event: PointerEvent<HTMLSpanElement>) => {
    if (!drag.current) return
    // ~200px of travel covers the full range; hold Shift for fine adjustments.
    const sensitivity = event.shiftKey ? 0.12 : 0.64
    const next = Math.round(
      clamp(drag.current.value + (drag.current.y - event.clientY) * sensitivity, parameter.min, parameter.max),
    )
    if (next !== value) onChange(next)
  }

  const endDrag = () => {
    drag.current = null
  }

  const flipChord = flipMode ? flipChordForValue(value) : null
  const clockPrefix =
    id !== 'clock' ? '' : smoothClock && halfLoop ? 'Smooth ½' : smoothClock ? 'Smooth' : halfLoop ? '½ loop' : ''
  const prefix = modeLabel ?? (clockPrefix || null)
  const shownValue =
    smoothClock && id === 'clock'
      ? String(value)
      : String(displayParameterValue(parameter, value, { showRadioStationLabel: id !== 'loop-modify' || radioMode }))
  const valueText = flipChord
    ? `Chord ${flipChord.chord}: ${flipChord.notes.join(', ')}`
    : prefix
      ? `${prefix}: ${shownValue}`
      : shownValue

  return (
    <div
      className={`pedal-knob-control knob-${id} ${altPrintKnobs.has(id) ? 'alt-print' : ''} ${radioMode ? 'radio-mode' : ''} ${flipChord ? 'flip-mode' : ''}`}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer drag surface; the range input inside is the focusable, keyboard-accessible control. */}
      <span
        className="pedal-knob"
        style={{ '--knob-rotation': `${angleFor(value, parameter.min, parameter.max)}deg` } as CSSProperties}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onChange(parameter.defaultValue)}
        title={`${parameter.name} · drag up or down · double-click to reset`}
      >
        {id === 'clock' && !smoothClock && <ClockScale value={value} />}
        {id === 'loop-modify' && <RadioStations value={value} />}
        <span className="knob-cap">
          <i />
        </span>
        <input
          ref={inputRef}
          aria-label={parameter.name}
          type="range"
          min={parameter.min}
          max={parameter.max}
          value={value}
          aria-valuetext={valueText}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </span>
      <strong>{label ?? parameter.name.replace('Wet ', '').replace('Loop ', '')}</strong>
      <small>{secondaryLabels[id]}</small>
      {flipChord ? (
        <output className="flip-chord-label" title={valueText}>
          <b>Chord {String(flipChord.chord).padStart(2, '0')}</b>
          <span>{flipChord.notes.join(' ')}</span>
        </output>
      ) : (
        <output title={valueText}>
          {prefix && <em>{prefix}</em>}
          {shownValue}
        </output>
      )}
    </div>
  )
}

function ThreeWaySwitch({
  parameter,
  label,
  value,
  onChange,
}: {
  parameter: BadMoodParameter
  label: string
  value: number
  onChange: (value: number) => void
}) {
  const options = parameter.options ?? []
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const cycle = () => onChange(options[(selectedIndex + 1) % options.length].value)

  return (
    <fieldset className="pedal-switch-control">
      <legend className="visually-hidden">{parameter.name}</legend>
      <div
        className="switch-hardware"
        data-position={selectedIndex}
        aria-hidden="true"
        onClick={cycle}
        title={`${parameter.name} · click to cycle`}
      >
        <svg className="switch-nut" viewBox="-20 -20 40 40" aria-hidden="true">
          <polygon points="-9.5,-17 9.5,-17 19,0 9.5,17 -9.5,17 -19,0" />
          <circle r="8.5" className="switch-washer" />
          <g className="switch-lever">
            <rect x="-3.5" y="-15" width="7" height="17" rx="3.5" />
            <circle cy="-12" r="3.5" />
          </g>
        </svg>
      </div>
      <div className="switch-options">
        {options.map((option) => (
          <button
            type="button"
            className={option.value === value ? 'selected' : ''}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            title={option.label}
            key={option.value}
          >
            {option.label.replace('Input → ', '').replace(' → Wet', '').replace(' → Loop', '')}
          </button>
        ))}
      </div>
      <small className="switch-caption">{label}</small>
    </fieldset>
  )
}

function LedButton({
  parameter,
  value,
  onChange,
}: {
  parameter: BadMoodParameter
  value: number
  onChange: (value: number) => void
}) {
  const isOn = value !== 0
  return (
    <button
      type="button"
      className={`pedal-led ${isOn ? 'on' : ''}`}
      onClick={() => onChange(isOn ? 0 : 127)}
      aria-pressed={isOn}
    >
      <span aria-hidden="true">
        <i />
      </span>
      <small>{parameter.name}</small>
    </button>
  )
}

function Footswitch({
  value,
  side,
  onChange,
}: {
  value: number
  side: 'wet' | 'loop'
  onChange: (value: number) => void
}) {
  const isOn = value !== 0
  return (
    <button
      type="button"
      className={`pedal-footswitch ${isOn ? 'on' : ''}`}
      onClick={() => onChange(isOn ? 0 : 127)}
      aria-pressed={isOn}
    >
      <span className="footswitch-led" aria-hidden="true" />
      <span className="footswitch-metal" aria-hidden="true">
        <i />
      </span>
      <small>
        {side === 'wet' ? 'Wet' : 'Micro-loop'}
        <b>{isOn ? 'On' : 'Bypassed'}</b>
      </small>
    </button>
  )
}

export function PedalFace({ parameters, values, onChange, onTapTempo }: Props) {
  const radioMode = values['micro-looper'] === 2
  const flipMode = values['wet-channel'] === 3
  // Any ramp dip switch hands the MIX knob over to ramp speed.
  const rampActive = RAMP_DIP_IDS.some((id) => values[id] !== 0)

  return (
    <section className="pedal-shell" aria-label="BAD MOOD pedal controls">
      <PedalTexture />

      <div className="pedal-knobs">
        {knobIds.map((id) => {
          const parameter = id === 'mix' && rampActive ? parameters['ramp-speed'] : parameters[id]
          return (
            <PedalKnob
              key={id}
              id={id}
              parameter={parameter}
              value={values[parameter.id]}
              label={id === 'mix' && rampActive ? 'Ramp' : undefined}
              modeLabel={id === 'loop-modify' && radioMode ? null : knobFunction(id, values)}
              radioMode={id === 'loop-modify' && radioMode}
              flipMode={id === 'wet-modify' && flipMode}
              smoothClock={id === 'clock' && values['dip-smooth'] !== 0}
              halfLoop={id === 'clock' && values['dip-half'] !== 0}
              onChange={(value) => onChange(parameter, value)}
            />
          )
        })}
      </div>

      <div className="pedal-switches">
        {['wet-channel', 'routing', 'micro-looper'].map((id) => (
          <ThreeWaySwitch
            key={id}
            parameter={parameters[id]}
            label={switchLabels[id]}
            value={values[id]}
            onChange={(value) => onChange(parameters[id], value)}
          />
        ))}
      </div>

      <div className="pedal-brand" aria-hidden="true">
        <svg className="pedal-sun" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <clipPath id="pedal-sun-clip">
              <circle cx="50" cy="50" r="50" />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="50" className="pedal-sun-disc" />
          <g clipPath="url(#pedal-sun-clip)">
            {SUN_PATHS.map((d) => (
              <path d={d} key={d} />
            ))}
          </g>
        </svg>
        <span className="wordmark">
          <b>BAD</b>MOOD
        </span>
      </div>

      <div className="pedal-led-row">
        <LedButton
          parameter={parameters.freeze}
          value={values.freeze}
          onChange={(value) => onChange(parameters.freeze, value)}
        />
        <button
          type="button"
          className="center-tap"
          onClick={onTapTempo}
          title="Tap tempo · on the pedal, hold a footswitch and turn TIME to exit"
        >
          <span aria-hidden="true">
            <i />
          </span>
          <small>Tap</small>
        </button>
        <LedButton
          parameter={parameters.overdub}
          value={values.overdub}
          onChange={(value) => onChange(parameters.overdub, value)}
        />
      </div>

      <div className="pedal-foot-row">
        <Footswitch
          value={values['wet-bypass']}
          side="wet"
          onChange={(value) => onChange(parameters['wet-bypass'], value)}
        />
        <Footswitch
          value={values['loop-bypass']}
          side="loop"
          onChange={(value) => onChange(parameters['loop-bypass'], value)}
        />
      </div>
    </section>
  )
}
