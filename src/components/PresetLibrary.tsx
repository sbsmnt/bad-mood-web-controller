import { type FormEvent, useState } from 'react'
import type { Preset } from '../presets'

type Props = {
  presets: Preset[]
  onSave: (name: string) => void
  onRecall: (preset: Preset) => void
  onRename: (id: string, name: string) => void
  onUpdate: (id: string) => void
  onDelete: (id: string) => void
}

export function PresetLibrary({ presets, onSave, onRecall, onRename, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const savePreset = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    onSave(name)
    setName('')
  }

  const finishRename = (event: FormEvent, id: string) => {
    event.preventDefault()
    if (!editingName.trim()) return
    onRename(id, editingName)
    setEditingId(null)
  }

  return (
    <section className="browser-presets-panel">
      <form className="preset-create card" onSubmit={savePreset}>
        <div className="panel-kicker">Capture</div>
        <h3>Save current sound</h3>
        <p>Stores every editor setting in this browser so you can recall it later.</p>
        <label htmlFor="preset-name">Preset name</label>
        <div className="preset-create-row">
          <input
            id="preset-name"
            type="text"
            maxLength={48}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Broken radio"
          />
          <button className="button primary" type="submit" disabled={!name.trim()}>
            Save
          </button>
        </div>
      </form>

      <div className="preset-collection">
        <div className="preset-collection-heading">
          <h3>Library</h3>
          <small>
            {presets.length} {presets.length === 1 ? 'preset' : 'presets'}
          </small>
        </div>
        {presets.length === 0 ? (
          <div className="preset-empty">
            <strong>No presets yet</strong>
            <span>Dial in a sound, name it, and save it here.</span>
          </div>
        ) : (
          <ul className="preset-list">
            {presets.map((preset) => (
              <li key={preset.id}>
                {editingId === preset.id ? (
                  <form className="preset-rename" onSubmit={(event) => finishRename(event, preset.id)}>
                    <input
                      aria-label="Preset name"
                      ref={(input) => input?.focus()}
                      maxLength={48}
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                    <button className="button primary small" type="submit">
                      Save
                    </button>
                    <button className="button ghost small" type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="preset-meta">
                      <strong>{preset.name}</strong>
                      <small>Updated {new Date(preset.updatedAt).toLocaleDateString()}</small>
                    </div>
                    <div className="preset-actions">
                      <button className="button primary small" type="button" onClick={() => onRecall(preset)}>
                        Load
                      </button>
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => {
                          setEditingId(preset.id)
                          setEditingName(preset.name)
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="button ghost small"
                        type="button"
                        onClick={() => onUpdate(preset.id)}
                        title="Overwrite with the current settings"
                      >
                        Update
                      </button>
                      <button className="button ghost small danger" type="button" onClick={() => onDelete(preset.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
