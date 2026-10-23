import { describe, expect, it, vi } from 'vitest'
import { type MidiConnectionSnapshot, WebMidiClient } from './WebMidiClient'

function fakeOutput(id: string, overrides: Partial<MIDIOutput> = {}) {
  return {
    id,
    name: `Output ${id}`,
    manufacturer: 'Test',
    state: 'connected',
    connection: 'closed',
    send: vi.fn(),
    open: vi.fn(() => Promise.resolve()),
    ...overrides,
  } as unknown as MIDIOutput & { send: ReturnType<typeof vi.fn>; open: ReturnType<typeof vi.fn> }
}

/** Returns the access object plus the mutable map behind its read-only `outputs`, to simulate unplugging. */
function fakeAccess(outputs: MIDIOutput[]) {
  const outputMap = new Map(outputs.map((output) => [output.id, output]))
  const access = { outputs: outputMap, onstatechange: null } as unknown as MIDIAccess
  return { access, outputMap }
}

/** A client whose browser grants MIDI access to the given outputs. */
async function enabledClient(outputs: MIDIOutput[]) {
  const { access, outputMap } = fakeAccess(outputs)
  vi.stubGlobal('navigator', { requestMIDIAccess: vi.fn().mockResolvedValue(access) })
  const client = new WebMidiClient()
  await client.enable()
  return { client, access, outputMap }
}

describe('WebMidiClient', () => {
  it('reports an error when the browser has no Web MIDI', async () => {
    vi.stubGlobal('navigator', {})
    const client = new WebMidiClient()

    await client.enable()

    expect(client.snapshot).toMatchObject({ supported: false, enabled: false, outputs: [] })
    expect(client.snapshot.error).toMatch(/Web MIDI is unavailable/)
  })

  it('requests access without SysEx and lists connected outputs only', async () => {
    const { client } = await enabledClient([
      fakeOutput('a'),
      fakeOutput('b', { state: 'disconnected' }),
      fakeOutput('c', { name: '', manufacturer: '' }),
    ])

    expect(navigator.requestMIDIAccess).toHaveBeenCalledWith({ sysex: false })
    expect(client.snapshot).toMatchObject({ supported: true, enabled: true, error: null })
    expect(client.snapshot.outputs).toEqual([
      { id: 'a', name: 'Output a', manufacturer: 'Test' },
      { id: 'c', name: 'Unnamed MIDI output', manufacturer: '' },
    ])
  })

  it('surfaces a denied permission prompt', async () => {
    vi.stubGlobal('navigator', { requestMIDIAccess: vi.fn().mockRejectedValue(new Error('Permission denied')) })
    const client = new WebMidiClient()

    await client.enable()

    expect(client.snapshot).toMatchObject({ enabled: false, error: 'Permission denied' })
  })

  it('only selects outputs that exist', async () => {
    const { client } = await enabledClient([fakeOutput('a')])

    client.selectOutput('missing')
    expect(client.selectedOutputId).toBeNull()

    client.selectOutput('a')
    expect(client.selectedOutputId).toBe('a')

    client.selectOutput(null)
    expect(client.selectedOutputId).toBeNull()
  })

  it('refuses to send before an output is selected', async () => {
    const { client } = await enabledClient([fakeOutput('a')])

    expect(() => client.sendControlChange(2, 14, 64)).toThrow('Select a MIDI output first.')
  })

  it('sends Control Change and Program Change bytes to the selected output', async () => {
    const output = fakeOutput('a')
    const { client } = await enabledClient([output])
    client.selectOutput('a')

    client.sendControlChange(2, 14, 100)
    client.sendProgramChange(2, 5)

    expect(output.open).toHaveBeenCalled()
    expect(output.send.mock.calls).toEqual([[[0xb1, 14, 100]], [[0xc1, 5]]])
  })

  it('drops the selection when the selected output is unplugged', async () => {
    const { client, access, outputMap } = await enabledClient([fakeOutput('a')])
    client.selectOutput('a')
    const listener = vi.fn<(snapshot: MidiConnectionSnapshot) => void>()
    client.subscribe(listener)

    outputMap.delete('a')
    access.onstatechange?.({} as MIDIConnectionEvent)

    expect(client.selectedOutputId).toBeNull()
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ outputs: [] }))
  })

  it('notifies subscribers immediately and stops after unsubscribing', async () => {
    const { client } = await enabledClient([fakeOutput('a')])
    const listener = vi.fn()

    const unsubscribe = client.subscribe(listener)
    expect(listener).toHaveBeenCalledTimes(1)

    client.selectOutput('a')
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    client.selectOutput(null)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
