import { useCallback, useEffect, useMemo, useState } from 'react'
import { type MidiConnectionSnapshot, webMidiClient } from './WebMidiClient'

const OUTPUT_KEY = 'bad-mood:midi-output'
const CHANNEL_KEY = 'bad-mood:midi-channel'

const initialSnapshot: MidiConnectionSnapshot = {
  supported: typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function',
  enabled: false,
  outputs: [],
  error: null,
}

export function useWebMidi() {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null)
  const [channel, setChannelState] = useState(() => {
    const stored = Number(localStorage.getItem(CHANNEL_KEY))
    return stored >= 1 && stored <= 16 ? stored : 2
  })

  useEffect(
    () =>
      webMidiClient.subscribe((next) => {
        setSnapshot(next)
        setSelectedOutputId(webMidiClient.selectedOutputId)
      }),
    [],
  )

  useEffect(() => {
    if (!snapshot.enabled || webMidiClient.selectedOutputId) return
    const stored = localStorage.getItem(OUTPUT_KEY)
    if (stored && snapshot.outputs.some((output) => output.id === stored)) {
      webMidiClient.selectOutput(stored)
    }
  }, [snapshot.enabled, snapshot.outputs])

  const selectOutput = useCallback((id: string | null) => {
    webMidiClient.selectOutput(id)
    if (id) localStorage.setItem(OUTPUT_KEY, id)
    else localStorage.removeItem(OUTPUT_KEY)
  }, [])

  const setChannel = useCallback((nextChannel: number) => {
    setChannelState(nextChannel)
    localStorage.setItem(CHANNEL_KEY, String(nextChannel))
  }, [])

  return useMemo(
    () => ({
      ...snapshot,
      channel,
      selectedOutputId,
      connect: () => webMidiClient.enable(),
      selectOutput,
      setChannel,
      sendCC: (cc: number, value: number) => webMidiClient.sendControlChange(channel, cc, value),
      sendPC: (program: number) => webMidiClient.sendProgramChange(channel, program),
    }),
    [snapshot, channel, selectedOutputId, selectOutput, setChannel],
  )
}
