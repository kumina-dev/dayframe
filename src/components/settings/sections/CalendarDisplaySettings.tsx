import { CalendarClock } from 'lucide-react'

import type {
  CalendarDensity,
  DayframeSettings,
  DayframeSettingsUpdate,
  LocalCalendar,
  ReminderMinutes,
  TimeFormat,
} from '../../../types/calendar'
import { reminderOptions } from '../settingsOptions'

import styles from '../SettingsSheet.module.css'

interface CalendarDisplaySettingsProps {
  calendars: LocalCalendar[]
  settings: DayframeSettings
  onError: (message: string) => void
  onUpdate: (changes: DayframeSettingsUpdate) => Promise<void>
}

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

export function CalendarDisplaySettings({
  calendars,
  settings,
  onError,
  onUpdate,
}: CalendarDisplaySettingsProps) {
  const updateSettings = (changes: DayframeSettingsUpdate) => {
    onError('')

    void onUpdate(changes).catch(() => {
      onError('The calendar settings could not be saved.')
    })
  }

  return (
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
                  updateSettings({ weekStartsOn: option.value })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.settingCard}>
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
                aria-pressed={settings.timeFormat === option.value}
                onClick={() =>
                  updateSettings({ timeFormat: option.value })
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
                aria-pressed={settings.density === option.value}
                onClick={() =>
                  updateSettings({ density: option.value })
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

            <span className={styles.toggleTrack} aria-hidden="true">
              <span className={styles.toggleThumb} />
            </span>
          </label>
        </div>

        <label className={styles.settingCard}>
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

        <label className={styles.settingCard}>
          <span className={styles.label}>Default reminder</span>

          <select
            className={styles.input}
            value={settings.defaultReminderMinutes}
            onChange={(event) =>
              updateSettings({
                defaultReminderMinutes: Number(
                  event.target.value,
                ) as ReminderMinutes,
              })
            }
          >
            {reminderOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <span className={styles.hint}>
            Used as the starting value for newly created calendars.
          </span>
        </label>
      </div>
    </section>
  )
}
