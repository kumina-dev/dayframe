import { Laptop, Moon, Palette, Sun } from 'lucide-react'

import { isValidAccentColor } from '../../../lib/theme'
import type {
  DayframeSettings,
  DayframeSettingsUpdate,
  ThemePreference,
} from '../../../types/calendar'
import { ColorSwatch } from '../../ui/ColorSwatch'

import styles from '../SettingsSheet.module.css'

interface AppearanceSettingsProps {
  settings: DayframeSettings
  onError: (message: string) => void
  onUpdate: (changes: DayframeSettingsUpdate) => Promise<void>
}

const accentPresets = [
  { name: 'Periwinkle', value: '#8e9cf4' },
  { name: 'Teal', value: '#56beb0' },
  { name: 'Rose', value: '#d77091' },
  { name: 'Amber', value: '#daa752' },
  { name: 'Blue', value: '#629af4' },
  { name: 'Violet', value: '#a784e8' },
] as const

const themes: Array<{
  value: ThemePreference
  label: string
  icon: typeof Moon
}> = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Laptop },
]

export function AppearanceSettings({
  settings,
  onError,
  onUpdate,
}: AppearanceSettingsProps) {
  const updateSettings = (changes: DayframeSettingsUpdate) => {
    onError('')

    void onUpdate(changes).catch(() => {
      onError('The appearance settings could not be saved.')
    })
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="appearance-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <Palette size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="appearance-heading">Appearance</h3>
          <p>Set Dayframe's theme and interface accent.</p>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <div className={styles.settingCard}>
          <span className={styles.label}>Theme</span>

          <div className={styles.segmentedControl}>
            {themes.map((theme) => {
              const Icon = theme.icon

              return (
                <button
                  className={`${styles.segmentButton} ${
                    settings.theme === theme.value
                      ? styles.segmentButtonSelected
                      : ''
                  }`}
                  type="button"
                  key={theme.value}
                  aria-pressed={settings.theme === theme.value}
                  onClick={() =>
                    updateSettings({ theme: theme.value })
                  }
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {theme.label}
                </button>
              )
            })}
          </div>
        </div>

        <fieldset
          className={`${styles.settingCard} ${styles.cardWide}`}
        >
          <legend className={styles.label}>Accent color</legend>

          <div className={styles.accentOptions}>
            {accentPresets.map((accent) => (
              <ColorSwatch
                color={accent.value}
                label={accent.name}
                selected={
                  settings.accentColor.toLowerCase() === accent.value
                }
                size="medium"
                key={accent.value}
                onSelect={() =>
                  updateSettings({ accentColor: accent.value })
                }
              />
            ))}

            <label
              className={styles.customColor}
              title="Choose a custom accent color"
            >
              <input
                type="color"
                value={
                  isValidAccentColor(settings.accentColor)
                    ? settings.accentColor
                    : '#8e9cf4'
                }
                aria-label="Custom accent color"
                onChange={(event) =>
                  updateSettings({
                    accentColor: event.target.value,
                  })
                }
              />

              <span
                className={styles.customColorSwatch}
                style={{ backgroundColor: settings.accentColor }}
                aria-hidden="true"
              />
              <span>Custom</span>
            </label>
          </div>
        </fieldset>

        <div className={`${styles.preview} ${styles.cardWide}`}>
          <span className={styles.previewDot} />

          <div>
            <strong>Accent preview</strong>
            <span>{settings.accentColor}</span>
          </div>

          <button type="button">Example action</button>
        </div>
      </div>
    </section>
  )
}
