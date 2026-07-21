import {
  CalendarClock,
  Globe2,
  Laptop,
  Moon,
  Palette,
  Sun,
  X,
} from 'lucide-react'
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useState,
} from 'react'

import { isValidTimeZone } from '../../lib/calendarEvents'
import { isValidAccentColor } from '../../lib/theme'
import type {
  CalendarDensity,
  DayframeSettings,
  DayframeSettingsUpdate,
  LocalCalendar,
  ThemePreference,
  TimeFormat,
} from '../../types/calendar'

import styles from './SettingsSheet.module.css'

interface SettingsSheetProps {
  calendars: LocalCalendar[]
  open: boolean
  settings: DayframeSettings
  onClose: () => void
  onUpdate: (
    changes: DayframeSettingsUpdate,
  ) => Promise<void>
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

const weekStartOptions: Array<{
  value: 0 | 1
  label: string
}> = [
  { value: 1, label: 'Monday' },
  { value: 0, label: 'Sunday' },
]

const timeFormatOptions: Array<{
  value: TimeFormat
  label: string
}> = [
  { value: '24-hour', label: '24-hour' },
  { value: '12-hour', label: '12-hour' },
]

const densityOptions: Array<{
  value: CalendarDensity
  label: string
}> = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
]

const commonTimeZones = [
  'UTC',
  'Europe/Helsinki',
  'Europe/Stockholm',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
]

export function SettingsSheet({
  calendars,
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

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setError('')
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

  const closeSettings = () => {
    setError('')
    onClose()
  }

  const updateSettings = (
    changes: DayframeSettingsUpdate,
  ) => {
    setError('')

    void onUpdate(changes).catch(() => {
      setError('The settings could not be saved.')
    })
  }

  const saveDisplayTimeZone = (value: string) => {
    const nextTimeZone = value.trim()

    if (!isValidTimeZone(nextTimeZone)) {
      setError('Enter a valid IANA timezone.')
      return
    }

    if (nextTimeZone !== settings.displayTimeZone) {
      updateSettings({
        displayTimeZone: nextTimeZone,
      })
    }
  }

  const handleTimeZoneKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const handleOverlayMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      closeSettings()
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

        <div className={styles.sections}>
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

          <section
            className={styles.section}
            aria-labelledby="calendar-settings-heading"
          >
            <div className={styles.sectionHeading}>
              <CalendarClock size={17} strokeWidth={1.8} />

              <div>
                <h3 id="calendar-settings-heading">Calendar</h3>
                <p>Choose how the month is arranged.</p>
              </div>
            </div>

            <fieldset className={styles.setting}>
              <legend className={styles.label}>
                First day of the week
              </legend>

              <div
                className={`${styles.segmentedControl} ${styles.segmentedControlTwo}`}
              >
                {weekStartOptions.map((option) => (
                  <button
                    className={`${styles.segmentButton} ${
                      settings.weekStartsOn === option.value
                        ? styles.segmentButtonSelected
                        : ''
                    }`}
                    type="button"
                    key={option.value}
                    aria-pressed={
                      settings.weekStartsOn === option.value
                    }
                    onClick={() =>
                      updateSettings({
                        weekStartsOn: option.value,
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.setting}>
              <legend className={styles.label}>Time format</legend>

              <div
                className={`${styles.segmentedControl} ${styles.segmentedControlTwo}`}
              >
                {timeFormatOptions.map((option) => (
                  <button
                    className={`${styles.segmentButton} ${
                      settings.timeFormat === option.value
                        ? styles.segmentButtonSelected
                        : ''
                    }`}
                    type="button"
                    key={option.value}
                    aria-pressed={
                      settings.timeFormat === option.value
                    }
                    onClick={() =>
                      updateSettings({
                        timeFormat: option.value,
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.setting}>
              <legend className={styles.label}>Density</legend>

              <div
                className={`${styles.segmentedControl} ${styles.segmentedControlTwo}`}
              >
                {densityOptions.map((option) => (
                  <button
                    className={`${styles.segmentButton} ${
                      settings.density === option.value
                        ? styles.segmentButtonSelected
                        : ''
                    }`}
                    type="button"
                    key={option.value}
                    aria-pressed={
                      settings.density === option.value
                    }
                    onClick={() =>
                      updateSettings({
                        density: option.value,
                      })
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className={styles.toggleSetting}>
              <span>
                <strong>Week numbers</strong>
                <small>Use ISO 8601 numbering.</small>
              </span>

              <input
                type="checkbox"
                checked={settings.showWeekNumbers}
                onChange={(event) =>
                  updateSettings({
                    showWeekNumbers: event.target.checked,
                  })
                }
              />

              <span className={styles.toggleTrack} aria-hidden="true">
                <span className={styles.toggleThumb} />
              </span>
            </label>

            <label className={styles.setting}>
              <span className={styles.label}>Default calendar</span>

              <select
                className={styles.input}
                value={settings.defaultCalendarId}
                onChange={(event) =>
                  updateSettings({
                    defaultCalendarId: event.target.value,
                  })
                }
              >
                {calendars.map((calendar) => (
                  <option value={calendar.id} key={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>

              <span className={styles.hint}>
                Used by the global New event button.
              </span>
            </label>
          </section>

          <section
            className={styles.section}
            aria-labelledby="region-heading"
          >
            <div className={styles.sectionHeading}>
              <Globe2 size={17} strokeWidth={1.8} />

              <div>
                <h3 id="region-heading">Language and region</h3>
                <p>Control how timed events are displayed.</p>
              </div>
            </div>

            <label className={styles.setting}>
              <span className={styles.label}>Display timezone</span>

              <input
                className={styles.input}
                type="text"
                list="dayframe-display-time-zones"
                defaultValue={settings.displayTimeZone}
                key={settings.displayTimeZone}
                placeholder="Europe/Helsinki"
                onBlur={(event) =>
                  saveDisplayTimeZone(event.target.value)
                }
                onKeyDown={handleTimeZoneKeyDown}
              />

              <datalist id="dayframe-display-time-zones">
                {commonTimeZones.map((timeZone) => (
                  <option value={timeZone} key={timeZone} />
                ))}
              </datalist>

              <span className={styles.hint}>
                Timed events move visually without changing their stored
                instant. Use an IANA timezone.
              </span>
            </label>
          </section>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </aside>
    </div>
  )
}
