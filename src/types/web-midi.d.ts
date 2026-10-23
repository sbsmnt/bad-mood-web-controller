interface MIDIConnectionEvent extends Event {
  port: MIDIPort
}

interface MIDIPort extends EventTarget {
  id: string
  manufacturer?: string
  name?: string
  state: 'connected' | 'disconnected'
  connection: 'open' | 'closed' | 'pending'
}

interface MIDIOutput extends MIDIPort {
  send(data: Iterable<number>, timestamp?: number): void
  open(): Promise<MIDIPort>
}

interface MIDIAccess extends EventTarget {
  outputs: Map<string, MIDIOutput>
  onstatechange: ((event: MIDIConnectionEvent) => void) | null
}

interface Navigator {
  requestMIDIAccess?: (options?: { sysex?: boolean; software?: boolean }) => Promise<MIDIAccess>
}
