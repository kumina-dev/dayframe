import {
  Laptop,
  Moon,
  Palette,
  Sun,
  X,
} from 'lucide-react'
import {
  type MouseEvent,
  useEffect,
  useState,
} from 'react'

import { isValidAccentColor } from '../../lib/theme'
import type {
  DayframeSettings,
  DayframeSettingsUpdate,
  ThemePreference,
} from '../../types/calendar'

import styles from './SettingsSheet.module.css'

interface SettingsSheetProps {
  open: boolean
  settings: DayframeSettings
  onClose: () => void
  onUpdate: (
    changes: DayframeSettingsUpdate,
  ) => Promise<void>
}

const accentPresets = [
  {
    name: 'Periwinkle',
    value: '#8e9cf4',
  },
  {
    name: 'Teal',
    value: '#56beb0',
  },
  {
    name: 'Rose',
    value: '#d77091',
  },
  {
    name: 'Amber',
    value: '#daa752',
  },
  {
    name: 'Blue',
    value: '#629af4',
  },
  {
    name: 'Violet',
    value: '#a784e8',
  },
] as const

const themes: Array<{
  value: ThemePreference
  label: string
  icon: typeof Moon
}> = [
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
  },
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
  },
  {
    value: 'system',
    label: 'System',
    icon: Laptop,
  },
]

export function SettingsSheet({
  open,
  settings,
  onClose,
  onUpdate,
}: SettingsSheetProps) {
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  const updateSettings = (
    changes: DayframeSettingsUpdate,
  ) => {
    setError('')

    void onUpdate(changes).catch(() => {
      setError('The settings could not be saved.')
    })
  }

  const handleOverlayMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
    >
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-sheet-title"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Local preferences</p>

            <h2 className={styles.heading} id="settings-sheet-title">
              Settings
            </h2>
          </div>

          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close settings"
            title="Close"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <p className={styles.localNotice}>
          Preferences are stored only in this browser.
        </p>

        <section
          className={styles.section}
          aria-labelledby="appearance-heading"
        >
          <div className={styles.sectionHeading}>
            <Palette size={17} strokeWidth={1.8} />

            <div>
              <h3 id="appearance-heading">Appearance</h3>

              <p>Control the interface theme and accent.</p>
            </div>
          </div>

          <div className={styles.setting}>
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
                    aria-pressed={
                      settings.theme === theme.value
                    }
                    onClick={() =>
                      updateSettings({
                        theme: theme.value,
                      })
                    }
                  >
                    <Icon size={15} strokeWidth={1.8} />
                    {theme.label}
                  </button>
                )
              })}
            </div>
          </div>

          <fieldset className={styles.setting}>
            <legend className={styles.label}>
              Accent color
            </legend>

            <div className={styles.accentOptions}>
              {accentPresets.map((accent) => (
                <button
                  className={`${styles.accentButton} ${
                    settings.accentColor.toLowerCase() ===
                    accent.value
                      ? styles.accentButtonSelected
                      : ''
                  }`}
                  style={{
                    backgroundColor: accent.value,
                  }}
                  type="button"
                  key={accent.value}
                  aria-label={accent.name}
                  aria-pressed={
                    settings.accentColor.toLowerCase() ===
                    accent.value
                  }
                  title={accent.name}
                  onClick={() =>
                    updateSettings({
                      accentColor: accent.value,
                    })
                  }
                />
              ))}

              <label
                className={styles.customColor}
                title="Custom accent color"
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

                <span>Custom</span>
              </label>
            </div>
          </fieldset>

          <div className={styles.preview}>
            <span className={styles.previewDot} />

            <div>
              <strong>Accent preview</strong>
              <span>{settings.accentColor}</span>
            </div>

            <button type="button">Example action</button>
          </div>
        </section>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </aside>
    </div>
  )
}
