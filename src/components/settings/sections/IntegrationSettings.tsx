import { formatDistanceToNow } from 'date-fns'
import { Link2, RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { dateLocales } from '../../../lib/dateLocales'
import type {
  IntegrationProvider,
  LanguagePreference,
  LocalIntegration,
  LocalIntegrationUpdate,
} from '../../../types/calendar'

import styles from '../SettingsSheet.module.css'

interface IntegrationSettingsProps {
  integrations: LocalIntegration[]
  language: LanguagePreference
  profileEmail: string
  onError: (message: string) => void
  onUpdateIntegration: (
    provider: IntegrationProvider,
    changes: LocalIntegrationUpdate,
  ) => Promise<void>
}

const integrationDetails: Record<
  IntegrationProvider,
  { name: string; description: string; monogram: string }
> = {
  'google-calendar': {
    name: 'Google Calendar',
    description: 'Preview a connected Google account state.',
    monogram: 'G',
  },
  'outlook-calendar': {
    name: 'Outlook Calendar',
    description: 'Preview a connected Microsoft account state.',
    monogram: 'O',
  },
}

export function IntegrationSettings({
  integrations,
  language,
  profileEmail,
  onError,
  onUpdateIntegration,
}: IntegrationSettingsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(
    null,
  )

  const runAction = async (
    action: string,
    callback: () => Promise<void>,
    errorMessage: string,
  ) => {
    if (pendingAction) {
      return
    }

    onError('')
    setPendingAction(action)

    try {
      await callback()
    } catch {
      onError(errorMessage)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="integrations-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <Link2 size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="integrations-heading">Integrations</h3>
          <p>Demonstrate external-calendar connection states.</p>
        </div>
      </div>

      <div className={styles.demoNotice}>
        <span className={styles.demoBadge}>Local demo</span>
        Connect and sync only change IndexedDB records. Google and
        Microsoft are never contacted, and no OAuth window is opened.
      </div>

      <div className={styles.integrationList}>
        {integrations.map((integration) => {
          const details = integrationDetails[integration.provider]
          const connected = integration.status === 'connected'
          const integrationAction = `integration:${integration.id}`
          const syncAction = `sync:${integration.id}`

          return (
            <article
              className={styles.integrationCard}
              key={integration.id}
            >
              <div className={styles.integrationIcon}>
                {details.monogram}
              </div>

              <div className={styles.integrationBody}>
                <div className={styles.integrationHeader}>
                  <div>
                    <h4>{details.name}</h4>
                    <p>{details.description}</p>
                  </div>

                  <span
                    className={
                      connected
                        ? styles.statusBadge
                        : styles.statusBadgeMuted
                    }
                  >
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {connected ? (
                  <div className={styles.integrationMeta}>
                    <span>{integration.accountLabel}</span>
                    <span>
                      {integration.lastSyncAt
                        ? `Synced ${formatDistanceToNow(
                            new Date(integration.lastSyncAt),
                            {
                              addSuffix: true,
                              locale: dateLocales[language],
                            },
                          )}`
                        : 'Not synced yet'}
                    </span>
                  </div>
                ) : null}

                <div className={styles.integrationActions}>
                  {connected ? (
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      disabled={pendingAction !== null}
                      onClick={() =>
                        void runAction(
                          syncAction,
                          () =>
                            onUpdateIntegration(integration.id, {
                              lastSyncAt: new Date().toISOString(),
                            }),
                          'The simulated sync could not be completed.',
                        )
                      }
                    >
                      <RefreshCw size={14} strokeWidth={1.8} />
                      {pendingAction === syncAction
                        ? 'Syncing…'
                        : 'Simulate sync'}
                    </button>
                  ) : null}

                  <button
                    className={
                      connected
                        ? styles.secondaryButton
                        : styles.primarySmallButton
                    }
                    type="button"
                    disabled={pendingAction !== null}
                    onClick={() =>
                      void runAction(
                        integrationAction,
                        () =>
                          onUpdateIntegration(
                            integration.id,
                            connected
                              ? {
                                  status: 'disconnected',
                                  accountLabel: undefined,
                                  lastSyncAt: undefined,
                                }
                              : {
                                  status: 'connected',
                                  accountLabel: profileEmail,
                                  lastSyncAt: new Date().toISOString(),
                                },
                          ),
                        `The ${details.name} demo state could not be updated.`,
                      )
                    }
                  >
                    {pendingAction === integrationAction
                      ? 'Updating…'
                      : connected
                        ? 'Disconnect demo'
                        : 'Connect demo'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
