export type EnvelopePoint = {
  x: number
  y: number
}

const START_X = 4
const FLOOR_Y = 88
const PEAK_Y = 12
const ATTACK_DECAY_WIDTH = 23
const RELEASE_START_X = 68
const RELEASE_WIDTH = 28

const stageDuration = (value: number, width: number) => (Math.max(0, Math.min(127, value)) / 127) * width

export function getEnvelopePoints(attack: number, decay: number, sustain: number, release: number): EnvelopePoint[] {
  const attackX = START_X + stageDuration(attack, ATTACK_DECAY_WIDTH)
  const decayX = attackX + stageDuration(decay, ATTACK_DECAY_WIDTH)
  const releaseX = RELEASE_START_X + stageDuration(release, RELEASE_WIDTH)
  const sustainY = FLOOR_Y - (Math.max(0, Math.min(127, sustain)) / 127) * (FLOOR_Y - PEAK_Y)

  return [
    { x: START_X, y: FLOOR_Y },
    { x: attackX, y: PEAK_Y },
    { x: decayX, y: sustainY },
    { x: RELEASE_START_X, y: sustainY },
    { x: releaseX, y: FLOOR_Y },
  ]
}

export function envelopePointsAttribute(points: EnvelopePoint[]) {
  return points.map(({ x, y }) => `${x},${y}`).join(' ')
}
