import type { DayframeSettings } from '../types/calendar'

const hexColorPattern = /^#[0-9a-f]{6}$/i

interface RgbColor {
  red: number
  green: number
  blue: number
}

function parseHexColor(color: string): RgbColor | null {
  if (!hexColorPattern.test(color)) {
    return null
  }

  return {
    red: Number.parseInt(color.slice(1, 3), 16),
    green: Number.parseInt(color.slice(3, 5), 16),
    blue: Number.parseInt(color.slice(5, 7), 16),
  }
}

function mixWithWhite(
  color: RgbColor,
  amount: number,
) {
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)

  return `rgb(${mix(color.red)} ${mix(color.green)} ${mix(
    color.blue,
  )})`
}

function getRelativeLuminance(color: RgbColor) {
  const convertChannel = (channel: number) => {
    const normalizedChannel = channel / 255

    return normalizedChannel <= 0.04045
      ? normalizedChannel / 12.92
      : ((normalizedChannel + 0.055) / 1.055) ** 2.4
  }

  return (
    0.2126 * convertChannel(color.red) +
    0.7152 * convertChannel(color.green) +
    0.0722 * convertChannel(color.blue)
  )
}

export function isValidAccentColor(color: string) {
  return hexColorPattern.test(color)
}

export function applyAppearanceSettings(
  settings: Pick<DayframeSettings, 'theme' | 'accentColor'>,
) {
  const root = document.documentElement
  const parsedAccent = parseHexColor(settings.accentColor)

  root.dataset.theme = settings.theme

  if (!parsedAccent) {
    return
  }

  const contrastColor =
    getRelativeLuminance(parsedAccent) > 0.48
      ? '#101216'
      : '#f7f8fa'

  root.style.setProperty(
    '--color-accent',
    settings.accentColor,
  )

  root.style.setProperty(
    '--color-accent-hover',
    mixWithWhite(parsedAccent, 0.12),
  )

  root.style.setProperty(
    '--color-accent-soft',
    `rgb(${parsedAccent.red} ${parsedAccent.green} ${parsedAccent.blue} / 0.12)`,
  )

  root.style.setProperty(
    '--color-accent-contrast',
    contrastColor,
  )
}
