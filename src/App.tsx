import { useEffect, useMemo, useState } from 'react'
import { FlipChordSelector } from './components/FlipChordSelector'
import { MidiSetup } from './components/MidiSetup'
import { ParameterControl } from './components/ParameterControl'
import { PedalFace } from './components/PedalFace'
import { PresetLibrary } from './components/PresetLibrary'
import { SynthModePanel } from './components/SynthModePanel'
import { ThemeSwitch } from './components/ThemeSwitch'
import { useWebMidi } from './midi/useWebMidi'
import {
  BAD_MOOD_DEFAULTS,
  BAD_MOOD_PARAMETERS,
  type BadMoodParameter,
  type ParameterGroup,
  PERFORMANCE_ACTIONS,
} from './pedal/badMood'
import { SYNTH_DEFAULTS, SYNTH_PARAMETERS } from './pedal/synthMode'
import { createPreset, loadPresets, type Preset, storePresets } from './presets'
import { useTheme } from './theme'
import './styles.css'

const groups: ParameterGroup[] = ['Hidden voices', 'Clock', 'DIP switches', 'Utilities']
const dipSwitchBanks = [
  {
    name: 'Control',
    description: 'Ramping and external control',
    ids: [
      'dip-time',
      'dip-wet-modify',
      'dip-clock',
      'dip-loop-modify',
      'dip-length',
      'dip-bounce',
      'dip-sweep',
      'dip-polarity',
    ],
  },
  {
    name: 'Customize',
    description: 'Alternate pedal behaviors',
    ids: [
      'dip-miso',
      'dip-spread',
      'dip-dry-kill',
      'dip-trails',
      'dip-latch',
      'dip-half',
      'dip-smooth',
      'dip-dry-glue',
    ],
  },
] as const
type AppView = 'pedal' | 'synth' | 'presets'
const views: { id: AppView; label: string; hint: string }[] = [
  { id: 'pedal', label: 'Pedal', hint: 'Main controls' },
  { id: 'synth', label: 'Synth', hint: 'Instrument mode' },
  { id: 'presets', label: 'Presets', hint: 'Saved sounds' },
]
const MAX_PROGRAM = 122
// Slots 1 and 2 are the two positions of the preset toggle on the pedal.
const slotLabel = (program: number) =>
  program === 0
    ? 'Live'
    : program === 1
      ? 'Slot 1 · toggle right'
      : program === 2
        ? 'Slot 2 · toggle left'
        : `Slot ${program}`
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function App() {
  const midi = useWebMidi()
  const { theme, setTheme } = useTheme()
  const [values, setValues] = useState<Record<string, number>>(() => ({ ...BAD_MOOD_DEFAULTS, ...SYNTH_DEFAULTS }))
  const [program, setProgram] = useState(0)
  const [activeView, setActiveView] = useState<AppView>('pedal')
  const [presets, setPresets] = useState<Preset[]>(loadPresets)
  const [notice, setNotice] = useState('Connect a MIDI output to begin.')
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)
  const [openGroups, setOpenGroups] = useState(() => new Set<ParameterGroup>(['Clock']))
  const canSend = Boolean(midi.selectedOutputId)

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const markInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setShowInstallHelp(false)
    }
    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    window.addEventListener('appinstalled', markInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
      window.removeEventListener('appinstalled', markInstalled)
    }
  }, [])

  const parametersByGroup = useMemo(
    () =>
      Object.fromEntries(
        groups.map((group) => [group, BAD_MOOD_PARAMETERS.filter((parameter) => parameter.group === group)]),
      ) as Record<ParameterGroup, BadMoodParameter[]>,
    [],
  )

  const parametersById = useMemo(
    () =>
      Object.fromEntries(BAD_MOOD_PARAMETERS.map((parameter) => [parameter.id, parameter])) as Record<
        string,
        BadMoodParameter
      >,
    [],
  )

  const synthParametersById = useMemo(
    () =>
      Object.fromEntries(SYNTH_PARAMETERS.map((parameter) => [parameter.id, parameter])) as Record<
        string,
        BadMoodParameter
      >,
    [],
  )

  const sendParameter = (parameter: BadMoodParameter, value: number) => {
    setValues((current) => ({ ...current, [parameter.id]: value }))
    if (!canSend) {
      setNotice(`${parameter.name} staged at ${value} · connect MIDI to send`)
      return
    }
    try {
      midi.sendCC(parameter.cc, value)
      setNotice(`${parameter.name} → CC ${parameter.cc}, value ${value}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send MIDI.')
    }
  }

  const recallProgram = () => {
    try {
      midi.sendPC(program)
      setNotice(program === 0 ? 'Live mode recalled · PC 0' : `Preset ${program} recalled · PC ${program}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send MIDI.')
    }
  }

  const saveProgram = () => {
    if (
      program === 0 ||
      !window.confirm(`Save the pedal's current state to preset ${program}? This overwrites that slot.`)
    )
      return
    try {
      midi.sendCC(111, program)
      setNotice(`Current pedal state saved to preset ${program} · CC 111`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send MIDI.')
    }
  }

  const runAction = (parameter: BadMoodParameter) => {
    if (parameter.dangerous && !window.confirm('Factory reset the BAD MOOD? This is a destructive pedal operation.'))
      return
    try {
      midi.sendCC(parameter.cc, parameter.defaultValue)
      setNotice(`${parameter.name} sent · CC ${parameter.cc}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send MIDI.')
    }
  }

  const tapTempo = () => {
    const action = PERFORMANCE_ACTIONS.find((parameter) => parameter.id === 'tap-tempo')
    if (action) runAction(action)
  }

  const changeProgram = (next: number) => {
    setProgram(Math.max(0, Math.min(MAX_PROGRAM, Math.round(next) || 0)))
  }

  const toggleGroup = (group: ParameterGroup) => {
    setOpenGroups((current) => {
      const next = new Set(current)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const changeView = (view: AppView) => {
    if (view === activeView) return

    if (view === 'synth') {
      setActiveView('synth')
      setNotice(
        canSend
          ? 'Synth controls ready · play a MIDI note to engage the pedal.'
          : 'Synth controls ready · connect MIDI, then play a note to engage the pedal.',
      )
      return
    }

    const wasSynthMode = activeView === 'synth'
    setActiveView(view)
    if (!wasSynthMode) return
    if (!canSend) {
      setNotice('Synth control view closed · connect MIDI to send the hardware exit command.')
      return
    }
    try {
      midi.sendCC(59, 0)
      setNotice('Synth Mode exited · CC 59, value 0')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not exit Synth Mode.')
    }
  }

  const changePresets = (update: (current: Preset[]) => Preset[]) => {
    setPresets((current) => {
      const next = update(current)
      storePresets(next)
      return next
    })
  }

  const saveLocalPreset = (name: string) => {
    changePresets((current) => [createPreset(name, values), ...current])
    setNotice(`“${name.trim()}” saved to this browser.`)
  }

  const recallLocalPreset = (preset: Preset) => {
    setValues((current) => ({ ...current, ...preset.values }))
    if (canSend) {
      const allParameters = [...BAD_MOOD_PARAMETERS, ...SYNTH_PARAMETERS]
      allParameters.forEach((parameter) => {
        const value = preset.values[parameter.id]
        if (typeof value === 'number') midi.sendCC(parameter.cc, value)
      })
      setNotice(`“${preset.name}” recalled and sent to the pedal.`)
    } else {
      setNotice(`“${preset.name}” recalled · connect MIDI to send it to the pedal.`)
    }
  }

  const renameLocalPreset = (id: string, name: string) => {
    changePresets((current) =>
      current.map((preset) => (preset.id === id ? { ...preset, name: name.trim(), updatedAt: Date.now() } : preset)),
    )
    setNotice(`Preset renamed to “${name.trim()}”.`)
  }

  const updateLocalPreset = (id: string) => {
    const preset = presets.find((candidate) => candidate.id === id)
    if (!preset || !window.confirm(`Replace “${preset.name}” with the editor’s current settings?`)) return
    changePresets((current) =>
      current.map((candidate) =>
        candidate.id === id ? { ...candidate, values: { ...values }, updatedAt: Date.now() } : candidate,
      ),
    )
    setNotice(`“${preset.name}” updated with the current settings.`)
  }

  const deleteLocalPreset = (id: string) => {
    const preset = presets.find((candidate) => candidate.id === id)
    if (!preset || !window.confirm(`Delete “${preset.name}”?`)) return
    changePresets((current) => current.filter((candidate) => candidate.id !== id))
    setNotice(`“${preset.name}” deleted.`)
  }

  const installApp = async () => {
    if (!installPrompt) {
      setShowInstallHelp((current) => !current)
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  const viewNav = (className: string) => (
    <nav className={className} aria-label="Editor sections">
      {views.map((view) => (
        <button
          type="button"
          className={`view-tab ${view.id}`}
          aria-current={activeView === view.id ? 'page' : undefined}
          onClick={() => changeView(view.id)}
          key={view.id}
        >
          <span className={`view-icon ${view.id}`} aria-hidden="true" />
          <strong>{view.label}</strong>
          {view.id === 'presets' && presets.length > 0 && <small className="view-count">{presets.length}</small>}
        </button>
      ))}
    </nav>
  )

  return (
    <div className={`app view-${activeView}`}>
      <header className="app-header">
        <div className="header-row">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>
                <b>BAD</b>MOOD
              </h1>
              <span className="brand-sub">Chase Bliss · MIDI editor</span>
            </div>
          </div>

          {viewNav('view-nav desktop-nav')}

          <div className="header-actions">
            <ThemeSwitch theme={theme} onChange={setTheme} />
            {!isInstalled && (
              <div className="install-control">
                <button
                  className="icon-button"
                  type="button"
                  onClick={installApp}
                  aria-expanded={installPrompt ? undefined : showInstallHelp}
                  title="Install app"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
                  </svg>
                  <span className="icon-button-label">Install</span>
                </button>
                {showInstallHelp && !installPrompt && (
                  <div className="install-help" role="status">
                    <strong>Install from your browser</strong>
                    <span>Open the browser menu and choose “Install app” or “Add to Home Screen.”</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <MidiSetup midi={midi} notice={notice} />
      </header>

      <main className="app-main">
        {activeView === 'synth' ? (
          <SynthModePanel parameters={synthParametersById} values={values} onChange={sendParameter} />
        ) : activeView === 'presets' ? (
          <div className="presets-workspace">
            <div className="view-heading">
              <div className="panel-kicker">Sound library</div>
              <h2>Your presets</h2>
            </div>
            <PresetLibrary
              presets={presets}
              onSave={saveLocalPreset}
              onRecall={recallLocalPreset}
              onRename={renameLocalPreset}
              onUpdate={updateLocalPreset}
              onDelete={deleteLocalPreset}
            />
          </div>
        ) : (
          <>
            <div className="pedal-workspace">
              <div className="pedal-stage">
                <PedalFace parameters={parametersById} values={values} onChange={sendParameter} onTapTempo={tapTempo} />
                <p className="pedal-hint">
                  Drag knobs up or down · <kbd>Shift</kbd> for fine control · double-click to reset
                </p>
              </div>

              <aside className="control-rail">
                <section className="card preset-panel" aria-labelledby="program-heading">
                  <div className="card-heading">
                    <div>
                      <div className="panel-kicker">Program change</div>
                      <h2 id="program-heading">Pedal memory</h2>
                    </div>
                    <span className="slot-badge">{slotLabel(program)}</span>
                  </div>
                  <p>
                    Slot 0 returns to Live mode (toggle centre). Slots 1 and 2 are the pedal's toggle presets, right and
                    left; 3–{MAX_PROGRAM} are MIDI-only.
                  </p>
                  <div className="program-stepper">
                    <button
                      type="button"
                      className="step-button"
                      onClick={() => changeProgram(program - 1)}
                      disabled={program === 0}
                      aria-label="Previous slot"
                    >
                      −
                    </button>
                    <input
                      aria-label="Program slot"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={MAX_PROGRAM}
                      value={program}
                      onChange={(event) => changeProgram(Number(event.target.value))}
                    />
                    <button
                      type="button"
                      className="step-button"
                      onClick={() => changeProgram(program + 1)}
                      disabled={program === MAX_PROGRAM}
                      aria-label="Next slot"
                    >
                      +
                    </button>
                  </div>
                  <input
                    className="program-range"
                    aria-label="Program slot"
                    type="range"
                    min="0"
                    max={MAX_PROGRAM}
                    value={program}
                    onChange={(event) => changeProgram(Number(event.target.value))}
                  />
                  <div className="button-row">
                    <button className="button primary" type="button" disabled={!canSend} onClick={recallProgram}>
                      {program === 0 ? 'Recall Live' : `Recall ${program}`}
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={!canSend || program === 0}
                      onClick={saveProgram}
                    >
                      Save here
                    </button>
                  </div>
                  {!canSend && <p className="hint">Connect a MIDI output to recall or save slots.</p>}
                </section>

                <section className="card editor-panel" aria-labelledby="advanced-heading">
                  <div className="card-heading">
                    <div>
                      <div className="panel-kicker">Under the hood</div>
                      <h2 id="advanced-heading">Advanced</h2>
                    </div>
                  </div>

                  {groups.map((group) => {
                    const isOpen = openGroups.has(group)
                    const parameters = parametersByGroup[group]
                    const panelId = `group-${group.toLowerCase().replace(/\s+/g, '-')}`
                    return (
                      <section
                        className={`parameter-section ${group === 'DIP switches' ? 'dip-switches-section' : ''} ${isOpen ? 'open' : ''}`}
                        key={group}
                      >
                        <h3>
                          <button
                            type="button"
                            className="section-heading"
                            onClick={() => toggleGroup(group)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                          >
                            <span>{group}</span>
                            <small>
                              {parameters.length + (group === 'Utilities' ? PERFORMANCE_ACTIONS.length : 0)}
                            </small>
                            <i aria-hidden="true" />
                          </button>
                        </h3>
                        {isOpen && (
                          <div id={panelId}>
                            {group === 'DIP switches' ? (
                              <div className="dip-switch-banks">
                                {dipSwitchBanks.map((bank) => (
                                  <section className={`dip-switch-bank ${bank.name.toLowerCase()}`} key={bank.name}>
                                    <div className="dip-bank-heading">
                                      <strong>{bank.name}</strong>
                                      <small>{bank.description}</small>
                                    </div>
                                    <div className="controls-grid">
                                      {bank.ids.map((id) => {
                                        const parameter = parametersById[id]
                                        return (
                                          <ParameterControl
                                            key={parameter.id}
                                            parameter={parameter}
                                            value={values[parameter.id]}
                                            disabled={false}
                                            onChange={(value) => sendParameter(parameter, value)}
                                          />
                                        )
                                      })}
                                    </div>
                                  </section>
                                ))}
                              </div>
                            ) : (
                              <div className="controls-grid">
                                {parameters.map((parameter) => (
                                  <ParameterControl
                                    key={parameter.id}
                                    parameter={parameter}
                                    value={values[parameter.id]}
                                    disabled={false}
                                    onChange={(value) => sendParameter(parameter, value)}
                                  />
                                ))}
                                {group === 'Utilities' &&
                                  PERFORMANCE_ACTIONS.map((action) => (
                                    <button
                                      type="button"
                                      className={`action-control ${action.dangerous ? 'danger' : ''}`}
                                      disabled={!canSend}
                                      onClick={() => runAction(action)}
                                      key={action.id}
                                    >
                                      <strong>{action.name}</strong>
                                      <small>
                                        Send CC {action.cc}
                                        {action.description ? ` · ${action.description}` : ''}
                                      </small>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    )
                  })}
                </section>
              </aside>
            </div>

            <FlipChordSelector
              parameter={parametersById['wet-modify']}
              wetChannelParameter={parametersById['wet-channel']}
              value={values['wet-modify']}
              wetChannelValue={values['wet-channel']}
              onChange={sendParameter}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>
          {isInstalled ? 'Installed for local use · ' : ''}Settings stay in your browser. MIDI stays on your machine.
        </span>
      </footer>

      {viewNav('view-nav mobile-nav')}
    </div>
  )
}
