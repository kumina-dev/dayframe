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
import { ColorSwatch } from '../ui/ColorSwatch'

import styles from './SettingsSheet.module.css'

type SettingsSection = 'appearance' | 'calendar' | 'region'

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

const settingsSections: Array<{
  id: SettingsSection
  label: string
  description: string
  icon: typeof Palette
}> = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme and accent',
    icon: Palette,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Month and time display',
    icon: CalendarClock,
  },
  {
    id: 'region',
    label: 'Language and region',
    description: 'Timezone and locale',
    icon: Globe2,
  },
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
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('appearance')
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

  return (
    <aside
      className={styles.settings}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Local preferences</p>
          <h2 className={styles.heading} id="settings-title">
            Settings
          </h2>
        </div>

        <button
          className={styles.closeButton}
          type="button"
          aria-label="Close settings"
          title="Close settings"
          onClick={closeSettings}
        >
          <X size={19} strokeWidth={1.8} />
        </button>
      </header>

      <div className={styles.workspace}>
        <div className={styles.sidebar}>
          <nav
            className={styles.navigation}
            aria-label="Settings sections"
          >
            {settingsSections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id

              return (
                <button
                  className={`${styles.navigationButton} ${
                    isActive ? styles.navigationButtonActive : ''
                  }`}
                  type="button"
                  key={section.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setError('')
                    setActiveSection(section.id)
                  }}
                >
                  <Icon size={17} strokeWidth={1.8} />

                  <span>
                    <strong>{section.label}</strong>
                    <small>{section.description}</small>
                  </span>
                </button>
              )
            })}
          </nav>

          <p className={styles.localNotice}>
            Settings are stored only in this browser.
          </p>
        </div>

        <main className={styles.content}>
          <div className={styles.contentInner}>
            {activeSection === 'appearance' ? (
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
                    <p>
                      Set Dayframe's theme and interface accent.
                    </p>
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

                  <fieldset
                    className={`${styles.settingCard} ${styles.cardWide}`}
                  >
                    <legend className={styles.label}>
                      Accent color
                    </legend>

                    <div className={styles.accentOptions}>
                      {accentPresets.map((accent) => (
                        <ColorSwatch
                          color={accent.value}
                          label={accent.name}
                          selected={
                            settings.accentColor.toLowerCase() ===
                            accent.value
                          }
                          size="medium"
                          key={accent.value}
                          onSelect={() =>
                            updateSettings({
                              accentColor: accent.value,
                            })
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
                            isValidAccentColor(
                              settings.accentColor,
                            )
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
                          style={{
                            backgroundColor: settings.accentColor,
                          }}
                          aria-hidden="true"
                        />
                        <span>Custom</span>
                      </label>
                    </div>
                  </fieldset>

                  <div
                    className={`${styles.preview} ${styles.cardWide}`}
                  >
                    <span className={styles.previewDot} />

                    <div>
                      <strong>Accent preview</strong>
                      <span>{settings.accentColor}</span>
                    </div>

                    <button type="button">Example action</button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeSection === 'calendar' ? (
              <section
                className={styles.section}
                aria-labelledby="calendar-settings-heading"
              >
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <CalendarClock size={19} strokeWidth={1.8} />
                  </div>

                  <div>
                    <h3 id="calendar-settings-heading">Calendar</h3>
                    <p>Choose how the month and its events appear.</p>
                  </div>
                </div>

                <div className={styles.cardGrid}>
                  <fieldset className={styles.settingCard}>
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

                  <fieldset className={styles.settingCard}>
                    <legend className={styles.label}>
                      Time format
                    </legend>

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

                  <fieldset className={styles.settingCard}>
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

                  <div className={styles.settingCard}>
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

                      <span
                        className={styles.toggleTrack}
                        aria-hidden="true"
                      >
                        <span className={styles.toggleThumb} />
                      </span>
                    </label>
                  </div>

                  <label
                    className={`${styles.settingCard} ${styles.cardWide}`}
                  >
                    <span className={styles.label}>
                      Default calendar
                    </span>

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
                </div>
              </section>
            ) : null}

            {activeSection === 'region' ? (
              <section
                className={styles.section}
                aria-labelledby="region-heading"
              >
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIcon}>
                    <Globe2 size={19} strokeWidth={1.8} />
                  </div>

                  <div>
                    <h3 id="region-heading">Language and region</h3>
                    <p>Control how timed events are presented.</p>
                  </div>
                </div>

                <div className={styles.cardGrid}>
                  <label
                    className={`${styles.settingCard} ${styles.cardWide}`}
                  >
                    <span className={styles.label}>
                      Display timezone
                    </span>

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
                      Timed events move visually without changing their
                      stored instant. Use an IANA timezone.
                    </span>
                  </label>
                </div>
              </section>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </main>
      </div>
    </aside>
  )
}
