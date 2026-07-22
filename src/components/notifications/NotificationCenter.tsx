import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { dateLocales } from '../../lib/dateLocales'
import type {
  AppNotification,
  LanguagePreference,
} from '../../types/calendar'
import { Popover } from '../ui/Popover'

import styles from './NotificationCenter.module.css'

interface NotificationCenterProps {
  language: LanguagePreference
  notifications: AppNotification[]
  onClear: () => Promise<void>
  onMarkAllRead: () => Promise<void>
}

export function NotificationCenter({
  language,
  notifications,
  onClear,
  onMarkAllRead,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<
    'read' | 'clear' | null
  >(null)
  const [error, setError] = useState('')

  const sortedNotifications = [...notifications].sort(
    (first, second) =>
      second.createdAt.localeCompare(first.createdAt),
  )

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  const runAction = async (
    action: 'read' | 'clear',
    callback: () => Promise<void>,
  ) => {
    if (pendingAction) {
      return
    }

    setError('')
    setPendingAction(action)

    try {
      await callback()
    } catch {
      setError('The notification list could not be updated.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <Popover
      align="end"
      ariaLabel="Notifications"
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          className={styles.trigger}
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
          aria-expanded={open}
          aria-haspopup="dialog"
          title="Notifications"
          onClick={() => setOpen((current) => !current)}
        >
          <Bell size={17} strokeWidth={1.8} />

          {unreadCount > 0 ? (
            <span className={styles.badge}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
      }
    >
      <section className={styles.panel}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>In-app only</p>
            <h2>Notifications</h2>
          </div>

          <span className={styles.localBadge}>Local demo</span>
        </header>

        {sortedNotifications.length > 0 ? (
          <div className={styles.list}>
            {sortedNotifications.map((notification) => (
              <article
                className={`${styles.notification} ${
                  notification.isRead
                    ? ''
                    : styles.notificationUnread
                }`}
                key={notification.id}
              >
                <span className={styles.statusDot} />

                <div>
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <time dateTime={notification.createdAt}>
                    {formatDistanceToNow(
                      new Date(notification.createdAt),
                      {
                        addSuffix: true,
                        locale: dateLocales[language],
                      },
                    )}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Bell size={19} strokeWidth={1.6} />
            <strong>Nothing new</strong>
            <span>
              Send a demo notification from Settings to preview this
              surface.
            </span>
          </div>
        )}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        {sortedNotifications.length > 0 ? (
          <footer className={styles.actions}>
            <button
              type="button"
              disabled={unreadCount === 0 || pendingAction !== null}
              onClick={() =>
                void runAction('read', onMarkAllRead)
              }
            >
              <CheckCheck size={14} strokeWidth={1.8} />
              {pendingAction === 'read'
                ? 'Marking…'
                : 'Mark all read'}
            </button>

            <button
              className={styles.clearButton}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => void runAction('clear', onClear)}
            >
              <Trash2 size={14} strokeWidth={1.8} />
              {pendingAction === 'clear' ? 'Clearing…' : 'Clear'}
            </button>
          </footer>
        ) : null}
      </section>
    </Popover>
  )
}
