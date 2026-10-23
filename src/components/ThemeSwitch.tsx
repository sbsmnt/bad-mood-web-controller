import type { Theme } from '../theme'

type Props = {
  theme: Theme
  onChange: (theme: Theme) => void
}

const finishes: { value: Theme; label: string; hint: string }[] = [
  { value: 'pink', label: 'Pink', hint: 'Light' },
  { value: 'grey', label: 'Grey', hint: 'Dark' },
]

export function ThemeSwitch({ theme, onChange }: Props) {
  return (
    <fieldset className="theme-switch">
      <legend className="visually-hidden">Pedal finish</legend>
      {finishes.map((finish) => (
        <label
          className={`theme-option ${finish.value}`}
          title={`${finish.label} finish · ${finish.hint} mode`}
          key={finish.value}
        >
          <input
            className="visually-hidden"
            type="radio"
            name="pedal-finish"
            value={finish.value}
            checked={theme === finish.value}
            onChange={() => onChange(finish.value)}
          />
          <span className="theme-swatch" aria-hidden="true" />
          <span className="theme-label">{finish.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
