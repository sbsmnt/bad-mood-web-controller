import type { ReturnTypeUseWebMidi } from '../types/app'

type Props = { midi: ReturnTypeUseWebMidi; notice: string }

export function MidiSetup({ midi, notice }: Props) {
  const connected = Boolean(midi.selectedOutputId)
  const state = connected ? 'connected' : midi.enabled ? 'waiting' : 'off'

  return (
    <section className={`midi-bar ${state}`} aria-label="MIDI connection">
      <div className="connection-copy">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>{connected ? 'Connected' : midi.enabled ? 'Choose an output' : 'MIDI off'}</strong>
          <small>
            {midi.error ||
              (midi.supported ? 'Chrome or Edge · localhost or HTTPS' : 'Web MIDI is not supported in this browser')}
          </small>
        </div>
      </div>

      <div className="connection-fields">
        {!midi.enabled ? (
          <button className="button primary" type="button" onClick={midi.connect} disabled={!midi.supported}>
            Enable MIDI
          </button>
        ) : (
          <label className="field output-field">
            <span>Output</span>
            <select
              value={midi.selectedOutputId || ''}
              onChange={(event) => midi.selectOutput(event.target.value || null)}
            >
              <option value="">Select MIDI output…</option>
              {midi.outputs.map((output) => (
                <option value={output.id} key={output.id}>
                  {output.manufacturer ? `${output.manufacturer} · ` : ''}
                  {output.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field channel-field">
          <span>Channel</span>
          <select value={midi.channel} onChange={(event) => midi.setChannel(Number(event.target.value))}>
            {Array.from({ length: 16 }, (_, index) => index + 1).map((channel) => (
              <option value={channel} key={channel}>
                {channel}
              </option>
            ))}
          </select>
        </label>
      </div>

      <output className="midi-monitor" aria-live="polite">
        <span aria-hidden="true">MIDI</span>
        {notice}
      </output>
    </section>
  )
}
