import {
  type BadMoodParameter,
  FLIP_CHORDS,
  type FlipChord,
  flipChordForValue,
  flipChordMidiValue,
} from '../pedal/badMood'

type Props = {
  parameter: BadMoodParameter
  wetChannelParameter: BadMoodParameter
  value: number
  wetChannelValue: number
  onChange: (parameter: BadMoodParameter, value: number) => void
}

export function FlipChordSelector({ parameter, wetChannelParameter, value, wetChannelValue, onChange }: Props) {
  const selectedChord = flipChordForValue(value)
  const flipIsActive = wetChannelValue === 3

  const selectChord = (chord: FlipChord) => {
    onChange(parameter, flipChordMidiValue(chord))
  }

  return (
    <section className="flip-panel" aria-labelledby="flip-heading">
      <div className="flip-heading">
        <div>
          <div className="panel-kicker">Wet channel · CC 17</div>
          <h2 id="flip-heading">FLIP chord selections</h2>
          <p>Choose the pitch voices assigned to the Wet Modify control while the wet channel is in FLIP mode.</p>
        </div>
        <div className={`flip-status ${flipIsActive ? 'active' : ''}`}>
          <span>{flipIsActive ? 'FLIP is active' : 'FLIP is not active'}</span>
          <button
            className="button secondary"
            type="button"
            disabled={flipIsActive}
            onClick={() => onChange(wetChannelParameter, 3)}
          >
            Activate FLIP
          </button>
        </div>
      </div>

      <div className="flip-current">
        <div className="flip-chord-number">
          <span>Current chord</span>
          <strong>{String(selectedChord.chord).padStart(2, '0')}</strong>
        </div>
        <div className="flip-current-notes">
          <span className="visually-hidden">Chord {selectedChord.chord} notes:</span>
          {selectedChord.notes.map((note) => (
            <b key={note}>{note}</b>
          ))}
        </div>
        <div className="flip-midi-value">
          <span>Active MIDI value</span>
          <strong>{value}</strong>
          <small>
            Range {selectedChord.min}–{selectedChord.max}
          </small>
        </div>
      </div>

      <div className="flip-library-heading">
        <strong>All 48 voicings</strong>
        <small>Select a card to send the midpoint of its documented value range.</small>
      </div>
      <div className="flip-chord-grid">
        {FLIP_CHORDS.map((chord) => {
          const selected = chord.chord === selectedChord.chord
          return (
            <button
              className={`flip-chord-card ${selected ? 'selected' : ''}`}
              type="button"
              aria-pressed={selected}
              onClick={() => selectChord(chord)}
              key={chord.chord}
            >
              <span>
                <b>{String(chord.chord).padStart(2, '0')}</b>
                <small>
                  {chord.min}–{chord.max}
                </small>
              </span>
              <strong>{chord.notes.join('  ')}</strong>
            </button>
          )
        })}
      </div>
    </section>
  )
}
