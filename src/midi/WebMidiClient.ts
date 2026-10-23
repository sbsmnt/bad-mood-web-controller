import { controlChangeMessage, programChangeMessage } from './messages'

export type MidiOutputInfo = {
  id: string
  name: string
  manufacturer: string
}

export type MidiConnectionSnapshot = {
  supported: boolean
  enabled: boolean
  outputs: MidiOutputInfo[]
  error: string | null
}

type Listener = (snapshot: MidiConnectionSnapshot) => void

export class WebMidiClient {
  private access: MIDIAccess | null = null
  private outputId: string | null = null
  private listeners = new Set<Listener>()
  private error: string | null = null

  get supported() {
    return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function'
  }

  get selectedOutputId() {
    return this.outputId
  }

  get snapshot(): MidiConnectionSnapshot {
    return {
      supported: this.supported,
      enabled: this.access !== null,
      outputs: this.listOutputs(),
      error: this.error,
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async enable() {
    if (!this.supported || !navigator.requestMIDIAccess) {
      this.error = 'Web MIDI is unavailable in this browser. Try Chrome or Edge on desktop.'
      this.emit()
      return
    }

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false })
      this.access.onstatechange = () => {
        if (this.outputId && !this.access?.outputs.has(this.outputId)) this.outputId = null
        this.emit()
      }
      this.error = null
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'MIDI permission was not granted.'
    }
    this.emit()
  }

  selectOutput(id: string | null) {
    this.outputId = id && this.access?.outputs.has(id) ? id : null
    this.emit()
  }

  sendControlChange(channel: number, cc: number, value: number) {
    this.requireOutput().send(controlChangeMessage(channel, cc, value))
  }

  sendProgramChange(channel: number, program: number) {
    this.requireOutput().send(programChangeMessage(channel, program))
  }

  private requireOutput() {
    if (!this.outputId) throw new Error('Select a MIDI output first.')
    const output = this.access?.outputs.get(this.outputId)
    if (!output) throw new Error('The selected MIDI output is no longer connected.')
    void output.open()
    return output
  }

  private listOutputs(): MidiOutputInfo[] {
    if (!this.access) return []
    return Array.from(this.access.outputs.values())
      .filter((output) => output.state === 'connected')
      .map((output) => ({
        id: output.id,
        name: output.name || 'Unnamed MIDI output',
        manufacturer: output.manufacturer || '',
      }))
  }

  private emit() {
    const snapshot = this.snapshot
    this.listeners.forEach((listener) => {
      listener(snapshot)
    })
  }
}

export const webMidiClient = new WebMidiClient()
