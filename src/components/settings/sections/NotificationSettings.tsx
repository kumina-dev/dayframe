import { Bell } from 'lucide-react'
import { useState } from 'react'

import type {
  DayframeSettings,
  DayframeSettingsUpdate,
} from '../../../types/calendar'

import styles from '../SettingsSheet.module.css'

interface NotificationSettingsProps {
  settings: DayframeSettings
  onError: (message: string) => void
  onSendDemoNotification: () => Promise<void>
  onUpdate: (changes: DayframeSettingsUpdate) => Promise<void>
}

export function NotificationSettings({
  settings,
  onError,
  onSendDemoNotification,
  onUpdate,
}: NotificationSettingsProps) {
  const [isSending, setIsSending] = useState(false)

  const updateSettings = (changes: DayframeSettingsUpdate) => {
    onError('')

    void onUpdate(changes).catch(() => {
      onError('The notification settings could not be saved.')
    })
  }

  const sendDemoNotification = async () => {
    if (isSending) {
      return
    }

    onError('')
    setIsSending(true)

    try {
      await onSendDemoNotification()
    } catch {
      onError('The demo notification could not be created.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="notifications-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <Bell size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="notifications-heading">Notifications</h3>
          <p>
            Preview reminder controls and Dayframe's in-app
            notification surface.
          </p>
        </div>
      </div>

      <div className={styles.demoNotice}>
        <span className={styles.demoBadge}>Local demo</span>
        These notifications exist only inside Dayframe. They do not
        use browser push notifications or contact a notification
        service.
      </div>

      <div className={styles.cardGrid}>
        <div className={styles.settingCard}>
          <label className={styles.toggleSetting}>
            <span>
              <strong>In-app notifications</strong>
              <small>Show local reminder messages.</small>
            </span>

            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(event) =>
                updateSettings({
                  notificationsEnabled: event.target.checked,
                })
              }
            />

            <span className={styles.toggleTrack} aria-hidden="true">
              <span className={styles.toggleThumb} />
            </span>
          </label>
        </div>

        <div className={styles.settingCard}>
          <label className={styles.toggleSetting}>
            <span>
              <strong>Notification sound</strong>
              <small>Visual preference only in this demo.</small>
            </span>

            <input
              type="checkbox"
              checked={settings.notificationSoundEnabled}
              disabled={!settings.notificationsEnabled}
              onChange={(event) =>
                updateSettings({
                  notificationSoundEnabled: event.target.checked,
                })
              }
            />

            <span className={styles.toggleTrack} aria-hidden="true">
              <span className={styles.toggleThumb} />
            </span>
          </label>
        </div>

        <div
          className={`${styles.settingCard} ${styles.cardWide}`}
        >
          <span className={styles.label}>
            Test the notification center
          </span>
          <span className={styles.hint}>
            Adds one unread notification to the bell in the main
            calendar header.
          </span>

          <button
            className={styles.primarySmallButton}
            type="button"
            disabled={!settings.notificationsEnabled || isSending}
            onClick={() => void sendDemoNotification()}
          >
            <Bell size={14} strokeWidth={1.8} />
            {isSending ? 'Sending…' : 'Send demo notification'}
          </button>
        </div>
      </div>
    </section>
  )
}
