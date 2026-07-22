import { format } from 'date-fns'
import { Globe2 } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import { isValidTimeZone } from '../../../lib/calendarEvents'
import {
  dateLocales,
  languageLabels,
} from '../../../lib/dateLocales'
import type {
  DayframeSettings,
  DayframeSettingsUpdate,
  LanguagePreference,
} from '../../../types/calendar'
import { commonTimeZones } from '../settingsOptions'

import styles from '../SettingsSheet.module.css'

interface RegionSettingsProps {
  settings: DayframeSettings
  onError: (message: string) => void
  onUpdate: (changes: DayframeSettingsUpdate) => Promise<void>
}

export function RegionSettings({
  settings,
  onError,
  onUpdate,
}: RegionSettingsProps) {
  const updateSettings = (changes: DayframeSettingsUpdate) => {
    onError('')

    void onUpdate(changes).catch(() => {
      onError('The language and region settings could not be saved.')
    })
  }

  const saveDisplayTimeZone = (value: string) => {
    const nextTimeZone = value.trim()

    if (!isValidTimeZone(nextTimeZone)) {
      onError('Enter a valid IANA timezone.')
      return false
    }

    if (nextTimeZone !== settings.displayTimeZone) {
      updateSettings({ displayTimeZone: nextTimeZone })
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
      aria-labelledby="region-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <Globe2 size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="region-heading">Language and region</h3>
          <p>Control how dates and timed events appear.</p>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <label className={styles.settingCard}>
          <span className={styles.label}>Calendar language</span>

          <select
            className={styles.input}
            value={settings.language}
            onChange={(event) =>
              updateSettings({
                language: event.target.value as LanguagePreference,
              })
            }
          >
            {(Object.keys(languageLabels) as LanguagePreference[]).map(
              (language) => (
                <option value={language} key={language}>
                  {languageLabels[language]}
                </option>
              ),
            )}
          </select>

          <span className={styles.hint}>
            Changes month and date labels. Interface copy remains
            English in this demo.
          </span>
        </label>

        <label className={styles.settingCard}>
          <span className={styles.label}>Display timezone</span>

          <input
            className={styles.input}
            type="text"
            list="dayframe-display-time-zones"
            defaultValue={settings.displayTimeZone}
            key={settings.displayTimeZone}
            placeholder="Europe/Helsinki"
            onBlur={(event) => {
              if (!saveDisplayTimeZone(event.target.value)) {
                event.target.value = settings.displayTimeZone
              }
            }}
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

        <div className={`${styles.preview} ${styles.cardWide}`}>
          <Globe2 size={16} strokeWidth={1.8} />

          <div>
            <strong>Date preview</strong>
            <span>
              {format(new Date(), 'PPPPp', {
                locale: dateLocales[settings.language],
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
