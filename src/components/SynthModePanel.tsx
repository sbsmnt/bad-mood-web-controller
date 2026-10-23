import type { BadMoodParameter } from '../pedal/badMood'
import { envelopePointsAttribute, getEnvelopePoints } from '../pedal/synthEnvelope'
import { synthParameterValue } from '../pedal/synthMode'

type Props = {
  parameters: Record<string, BadMoodParameter>
  values: Record<string, number>
  onChange: (parameter: BadMoodParameter, value: number) => void
}

type SliderProps = {
  parameter: BadMoodParameter
  value: number
  onChange: (value: number) => void
  accent?: string
  onReset?: () => void
}

const outputModes = [
  {
    name: 'Open',
    value: 0,
    eyebrow: 'Drone',
    description: 'Sound stays open continuously while MIDI notes transpose the pedal.',
  },
  {
    name: 'On / Off',
    value: 1,
    eyebrow: 'Gate',
    description: 'Sound follows Note On and Note Off with instant attack and release.',
  },
  {
    name: 'ADSR',
    value: 127,
    eyebrow: 'Envelope',
    description: 'Notes follow the attack, decay, sustain, and release controls.',
  },
]

function SynthSlider({ parameter, value, onChange, accent = 'var(--accent)', onReset }: SliderProps) {
  const progress = ((value - parameter.min) / (parameter.max - parameter.min)) * 100
  return (
    <label
      className="synth-slider"
      style={{ '--synth-progress': `${progress}%`, '--synth-accent': accent } as React.CSSProperties}
    >
      <span className="synth-slider-heading">
        <span>
          <strong>{parameter.name}</strong>
          <small>
            CC {parameter.cc}
            {parameter.description ? ` · ${parameter.description}` : ''}
          </small>
        </span>
        <output>{synthParameterValue(parameter, value)}</output>
      </span>
      <input
        type="range"
        min={parameter.min}
        max={parameter.max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {onReset && (
        <button type="button" onClick={onReset}>
          Center
        </button>
      )}
    </label>
  )
}

function EnvelopeDisplay({
  attack,
  decay,
  sustain,
  release,
}: {
  attack: number
  decay: number
  sustain: number
  release: number
}) {
  const envelopePoints = getEnvelopePoints(attack, decay, sustain, release)
  const points = envelopePointsAttribute(envelopePoints)
  const path = envelopePoints.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x},${y}`).join(' ')

  return (
    <div className="envelope-display" role="img" aria-label="ADSR envelope visualization">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="envelope-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--grad-a)" />
            <stop offset="1" stopColor="var(--grad-b)" />
          </linearGradient>
        </defs>
        <path d={path} className="envelope-fill" />
        <polyline points={points} />
      </svg>
      <div className="envelope-labels">
        <span>A</span>
        <span>D</span>
        <span>S</span>
        <span>R</span>
      </div>
    </div>
  )
}

export function SynthModePanel({ parameters, values, onChange }: Props) {
  const outputValue = values['synth-output-type']
  const activeOutput = outputValue === 0 ? 0 : outputValue === 1 ? 1 : 127
  const envelopeIds = ['synth-attack', 'synth-decay', 'synth-sustain', 'synth-release'] as const
  const octaveParameter = parameters['synth-octave-transpose']

  return (
    <div className="synth-workspace">
      <section className="synth-intro">
        <div>
          <div className="panel-kicker">Monophonic instrument</div>
          <h2>Shape the strange</h2>
          <p>
            BAD MOOD follows MIDI notes by moving its clock in semitones. Send a note from your keyboard or sequencer to
            engage the pedal’s Synth Mode.
          </p>
        </div>
        <div className="synth-ready-card">
          <span className="synth-ready-light" aria-hidden="true" />
          <div>
            <strong>Waiting for MIDI notes</strong>
            <small>Synth settings are global · MIDI clock is ignored</small>
          </div>
        </div>
      </section>

      <section className="synth-section output-section">
        <div className="synth-section-heading">
          <div>
            <div className="panel-kicker">CC 58</div>
            <h3>Output type</h3>
          </div>
          <p>Choose how incoming MIDI notes open and close the sound.</p>
        </div>
        <div className="output-mode-grid">
          {outputModes.map((mode) => (
            <button
              type="button"
              className={activeOutput === mode.value ? 'selected' : ''}
              aria-pressed={activeOutput === mode.value}
              onClick={() => onChange(parameters['synth-output-type'], mode.value)}
              key={mode.value}
            >
              <small>{mode.eyebrow}</small>
              <strong>{mode.name}</strong>
              <span>{mode.description}</span>
            </button>
          ))}
        </div>
        {activeOutput !== 0 && (
          <p className="synth-output-note">
            The pedal stays silent until a note plays. Leave this view or turn CLOCK on the pedal to exit Synth Mode.
          </p>
        )}
      </section>

      <section className={`synth-section envelope-section ${activeOutput === 127 ? 'enabled' : ''}`}>
        <div className="synth-section-heading">
          <div>
            <div className="panel-kicker">CC 80–83</div>
            <h3>ADSR envelope</h3>
          </div>
          <p>
            {activeOutput === 127
              ? 'The envelope is active for every incoming note.'
              : 'These values are saved now and become active when Output Type is set to ADSR.'}
          </p>
        </div>
        <div className="envelope-layout">
          <EnvelopeDisplay
            attack={values['synth-attack']}
            decay={values['synth-decay']}
            sustain={values['synth-sustain']}
            release={values['synth-release']}
          />
          <div className="envelope-controls">
            {envelopeIds.map((id, index) => (
              <SynthSlider
                parameter={parameters[id]}
                value={values[id]}
                accent={
                  [
                    'var(--grad-a)',
                    'color-mix(in srgb, var(--grad-a) 66%, var(--grad-b))',
                    'color-mix(in srgb, var(--grad-b) 66%, var(--grad-a))',
                    'var(--grad-b)',
                  ][index]
                }
                onChange={(value) => onChange(parameters[id], value)}
                key={id}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="synth-section performance-section">
        <div className="synth-section-heading">
          <div>
            <div className="panel-kicker">Global controls</div>
            <h3>Pitch & movement</h3>
          </div>
          <p>Set the keyboard range, glide, pitch bend, and modulation response.</p>
        </div>
        <div className="octave-control">
          <div className="octave-copy">
            <strong>Octave transpose</strong>
            <small>CC 57 · maximum keyboard range</small>
          </div>
          <div className="octave-options">
            {octaveParameter.options?.map((option) => (
              <button
                type="button"
                className={values[octaveParameter.id] === option.value ? 'selected' : ''}
                aria-pressed={values[octaveParameter.id] === option.value}
                onClick={() => onChange(octaveParameter, option.value)}
                key={option.value}
              >
                <strong>{option.value}</strong>
                <span>{option.value} oct</span>
                <small>{option.label}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="performance-controls">
          <SynthSlider
            parameter={parameters['synth-portamento']}
            value={values['synth-portamento']}
            accent="var(--grad-a)"
            onChange={(value) => onChange(parameters['synth-portamento'], value)}
          />
          <SynthSlider
            parameter={parameters['synth-pitch-bend']}
            value={values['synth-pitch-bend']}
            accent="color-mix(in srgb, var(--grad-a) 50%, var(--grad-b))"
            onChange={(value) => onChange(parameters['synth-pitch-bend'], value)}
            onReset={() => onChange(parameters['synth-pitch-bend'], 64)}
          />
          <SynthSlider
            parameter={parameters['synth-mod-wheel']}
            value={values['synth-mod-wheel']}
            accent="var(--grad-b)"
            onChange={(value) => onChange(parameters['synth-mod-wheel'], value)}
          />
        </div>
      </section>
    </div>
  )
}
