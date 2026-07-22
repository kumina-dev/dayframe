import { Layers3 } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import { isValidTimeZone } from '../../../lib/calendarEvents'
import type {
  CalendarUpdate,
  EventDuration,
  LocalCalendar,
  ReminderMinutes,
} from '../../../types/calendar'
import {
  commonTimeZones,
  durationOptions,
  reminderOptions,
} from '../settingsOptions'

import styles from '../SettingsSheet.module.css'

interface CalendarDefaultsSettingsProps {
  calendars: LocalCalendar[]
  onError: (message: string) => void
  onUpdateCalendar: (
    calendarId: string,
    changes: CalendarUpdate,
  ) => Promise<void>
}

export function CalendarDefaultsSettings({
  calendars,
  onError,
  onUpdateCalendar,
}: CalendarDefaultsSettingsProps) {
  const updateCalendar = (
    calendarId: string,
    changes: CalendarUpdate,
  ) => {
    onError('')

    void onUpdateCalendar(calendarId, changes).catch(() => {
      onError('The calendar defaults could not be saved.')
    })
  }

  const saveTimeZone = (
    calendar: LocalCalendar,
    value: string,
  ) => {
    const nextTimeZone = value.trim()

    if (!isValidTimeZone(nextTimeZone)) {
      onError('Enter a valid IANA timezone.')
      return false
    }

    if (nextTimeZone !== calendar.timeZone) {
      updateCalendar(calendar.id, { timeZone: nextTimeZone })
    }

    return true
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
    <section
      className={styles.section}
      aria-labelledby="calendar-defaults-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <Layers3 size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="calendar-defaults-heading">Calendar defaults</h3>
          <p>
            Set the timezone and quick-create behavior for each local
            calendar.
          </p>
        </div>
      </div>

      <div className={styles.calendarDefaults}>
        {calendars.map((calendar) => (
          <article
            className={styles.calendarDefaultCard}
            key={calendar.id}
          >
            <header className={styles.calendarDefaultHeader}>
              <span
                className={styles.calendarColorDot}
                data-color={calendar.color}
              />

              <div>
                <h4>{calendar.name}</h4>
                <span>Defaults apply to newly created events.</span>
              </div>
            </header>

            <div className={styles.inlineGrid}>
              <label>
                <span className={styles.label}>Timezone</span>
                <input
                  className={styles.input}
                  type="text"
                  list="dayframe-calendar-time-zones"
                  defaultValue={calendar.timeZone}
                  key={`${calendar.id}:${calendar.timeZone}`}
                  onBlur={(event) => {
                    if (!saveTimeZone(calendar, event.target.value)) {
                      event.target.value = calendar.timeZone
                    }
                  }}
                  onKeyDown={handleTimeZoneKeyDown}
                />
              </label>

              <label>
                <span className={styles.label}>Event length</span>
                <select
                  className={styles.input}
                  value={calendar.defaultEventDuration}
                  onChange={(event) =>
                    updateCalendar(calendar.id, {
                      defaultEventDuration: Number(
                        event.target.value,
                      ) as EventDuration,
                    })
                  }
                >
                  {durationOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={styles.label}>Reminder</span>
                <select
                  className={styles.input}
                  value={calendar.defaultReminderMinutes}
                  onChange={(event) =>
                    updateCalendar(calendar.id, {
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
              </label>
            </div>
          </article>
        ))}
      </div>

      <datalist id="dayframe-calendar-time-zones">
        {commonTimeZones.map((timeZone) => (
          <option value={timeZone} key={timeZone} />
        ))}
      </datalist>
    </section>
  )
}
