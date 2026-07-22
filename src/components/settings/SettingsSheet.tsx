import {
  Bell,
  CalendarClock,
  CreditCard,
  Database,
  Globe2,
  Layers3,
  Link2,
  Palette,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type {
  BackupRestoreSummary,
  IcsImportSummary,
} from '../../lib/dataPortability'
import type {
  CalendarUpdate,
  DayframeSettings,
  DayframeSettingsUpdate,
  IntegrationProvider,
  LocalCalendar,
  LocalIntegration,
  LocalIntegrationUpdate,
  LocalProfile,
  LocalProfileUpdate,
  LocalSubscription,
  SubscriptionPlan,
} from '../../types/calendar'
import { AccountSettings } from './sections/AccountSettings'
import { AppearanceSettings } from './sections/AppearanceSettings'
import { BillingSettings } from './sections/BillingSettings'
import { CalendarDefaultsSettings } from './sections/CalendarDefaultsSettings'
import { CalendarDisplaySettings } from './sections/CalendarDisplaySettings'
import { DataSettings } from './sections/DataSettings'
import { IntegrationSettings } from './sections/IntegrationSettings'
import { NotificationSettings } from './sections/NotificationSettings'
import { RegionSettings } from './sections/RegionSettings'

import styles from './SettingsSheet.module.css'

type SettingsSection =
  | 'appearance'
  | 'calendar'
  | 'calendars'
  | 'region'
  | 'notifications'
  | 'account'
  | 'integrations'
  | 'data'
  | 'billing'

interface SettingsSheetProps {
  calendars: LocalCalendar[]
  integrations: LocalIntegration[]
  open: boolean
  profile: LocalProfile
  settings: DayframeSettings
  subscription: LocalSubscription
  onClose: () => void
  onExportBackup: () => Promise<void>
  onExportCalendar: (
    calendarId: string,
  ) => Promise<void>
  onImportCalendar: (
    file: File,
    calendarId: string,
  ) => Promise<IcsImportSummary>
  onRestoreBackup: (
    file: File,
  ) => Promise<BackupRestoreSummary>
  onSendDemoNotification: () => Promise<void>
  onUpdate: (
    changes: DayframeSettingsUpdate,
  ) => Promise<void>
  onUpdateCalendar: (
    calendarId: string,
    changes: CalendarUpdate,
  ) => Promise<void>
  onUpdateIntegration: (
    provider: IntegrationProvider,
    changes: LocalIntegrationUpdate,
  ) => Promise<void>
  onUpdateProfile: (
    changes: LocalProfileUpdate,
  ) => Promise<void>
  onUpdateSubscription: (
    plan: SubscriptionPlan,
  ) => Promise<void>
}

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
    id: 'calendars',
    label: 'Calendar defaults',
    description: 'Per-calendar preferences',
    icon: Layers3,
  },
  {
    id: 'region',
    label: 'Language and region',
    description: 'Timezone and locale',
    icon: Globe2,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Local reminders',
    icon: Bell,
  },
  {
    id: 'account',
    label: 'Profile and access',
    description: 'Local sign-in demo',
    icon: UserRound,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Simulated connections',
    icon: Link2,
  },
  {
    id: 'data',
    label: 'Data and files',
    description: 'Import, export, backup',
    icon: Database,
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Simulated plan',
    icon: CreditCard,
  },
]

export function SettingsSheet({
  calendars,
  integrations,
  open,
  profile,
  settings,
  subscription,
  onClose,
  onExportBackup,
  onExportCalendar,
  onImportCalendar,
  onRestoreBackup,
  onSendDemoNotification,
  onUpdate,
  onUpdateCalendar,
  onUpdateIntegration,
  onUpdateProfile,
  onUpdateSubscription,
}: SettingsSheetProps) {
  const [
    activeSection,
    setActiveSection,
  ] = useState<SettingsSection>(
    'appearance'
  )

  const [error, setError] =
    useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
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

  return (
    <aside
      className={styles.settings}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Local preferences
          </p>

          <h2
            className={styles.heading}
            id="settings-title"
          >
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
          <X
            size={19}
            strokeWidth={1.8}
          />
        </button>
      </header>

      <div className={styles.workspace}>
        <div className={styles.sidebar}>
          <nav
            className={styles.navigation}
            aria-label="Settings sections"
          >
            {settingsSections.map(
              (section) => {
                const Icon =
                  section.icon

                const isActive =
                  activeSection ===
                  section.id

                return (
                  <button
                    className={`${
                      styles.navigationButton
                    } ${
                      isActive
                        ? styles.navigationButtonActive
                        : ''
                    }`}
                    type="button"
                    key={section.id}
                    aria-current={
                      isActive
                        ? 'page'
                        : undefined
                    }
                    onClick={() => {
                      setError('')
                      setActiveSection(
                        section.id,
                      )
                    }}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                    />

                    <span>
                      <strong>
                        {section.label}
                      </strong>

                      <small>
                        {
                          section.description
                        }
                      </small>
                    </span>
                  </button>
                )
              },
            )}
          </nav>

          <p
            className={
              styles.localNotice
            }
          >
            Settings and demo states are
            stored only in this browser.
          </p>
        </div>

        <main className={styles.content}>
          <div
            className={
              styles.contentInner
            }
          >
            {activeSection ===
            'appearance' ? (
              <AppearanceSettings
                settings={settings}
                onError={setError}
                onUpdate={onUpdate}
              />
            ) : null}

            {activeSection ===
            'calendar' ? (
              <CalendarDisplaySettings
                calendars={calendars}
                settings={settings}
                onError={setError}
                onUpdate={onUpdate}
              />
            ) : null}

            {activeSection ===
            'calendars' ? (
              <CalendarDefaultsSettings
                calendars={calendars}
                onError={setError}
                onUpdateCalendar={
                  onUpdateCalendar
                }
              />
            ) : null}

            {activeSection ===
            'region' ? (
              <RegionSettings
                settings={settings}
                onError={setError}
                onUpdate={onUpdate}
              />
            ) : null}

            {activeSection ===
            'notifications' ? (
              <NotificationSettings
                settings={settings}
                onError={setError}
                onSendDemoNotification={
                  onSendDemoNotification
                }
                onUpdate={onUpdate}
              />
            ) : null}

            {activeSection ===
            'account' ? (
              <AccountSettings
                profile={profile}
                onError={setError}
                onUpdateProfile={
                  onUpdateProfile
                }
              />
            ) : null}

            {activeSection ===
            'integrations' ? (
              <IntegrationSettings
                integrations={
                  integrations
                }
                language={
                  settings.language
                }
                profileEmail={
                  profile.email
                }
                onError={setError}
                onUpdateIntegration={
                  onUpdateIntegration
                }
              />
            ) : null}

            {activeSection ===
            'data' ? (
              <DataSettings
                calendars={calendars}
                defaultCalendarId={
                  settings.defaultCalendarId
                }
                onError={setError}
                onExportBackup={
                  onExportBackup
                }
                onExportCalendar={
                  onExportCalendar
                }
                onImportCalendar={
                  onImportCalendar
                }
                onRestoreBackup={
                  onRestoreBackup
                }
              />
            ) : null}

            {activeSection ===
            'billing' ? (
              <BillingSettings
                subscription={
                  subscription
                }
                onError={setError}
                onUpdateSubscription={
                  onUpdateSubscription
                }
              />
            ) : null}

            {error ? (
              <p
                className={styles.error}
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
        </main>
      </div>
    </aside>
  )
}
