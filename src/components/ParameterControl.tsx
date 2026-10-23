import { type BadMoodParameter, displayParameterValue } from '../pedal/badMood'

type Props = {
  parameter: BadMoodParameter
  value: number
  disabled: boolean
  onChange: (value: number) => void
}

export function ParameterControl({ parameter, value, disabled, onChange }: Props) {
  if (parameter.kind === 'toggle') {
    const isOn = value !== parameter.options?.[0]?.value
    const next = isOn ? (parameter.options?.[0]?.value ?? 0) : (parameter.options?.[1]?.value ?? 127)
    return (
      <button
        className={`toggle-control ${isOn ? 'on' : ''}`}
        onClick={() => onChange(next)}
        disabled={disabled}
        type="button"
        role="switch"
        aria-checked={isOn}
      >
        <span className="toggle-track" aria-hidden="true">
          <span />
        </span>
        <span className="control-copy">
          <strong>{parameter.name}</strong>
          <small>
            CC {parameter.cc} · {displayParameterValue(parameter, value)}
          </small>
        </span>
      </button>
    )
  }

  if (parameter.kind === 'select') {
    return (
      <label className="select-control">
        <span className="control-copy">
          <strong>{parameter.name}</strong>
          <small>
            CC {parameter.cc}
            {parameter.description ? ` · ${parameter.description}` : ''}
          </small>
        </span>
        <select value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))}>
          {parameter.options?.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className="range-control">
      <span className="control-copy">
        <strong>{parameter.name}</strong>
        <small>
          CC {parameter.cc}
          {parameter.description ? ` · ${parameter.description}` : ''}
        </small>
      </span>
      <output>{displayParameterValue(parameter, value)}</output>
      <input
        type="range"
        min={parameter.min}
        max={parameter.max}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
