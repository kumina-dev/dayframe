import {
  CalendarArrowDown,
  Database,
  Download,
  FileJson,
  Upload,
} from 'lucide-react'
import { useState } from 'react'

import type {
  BackupRestoreSummary,
  IcsImportSummary,
} from '../../../lib/dataPortability'
import type { LocalCalendar } from '../../../types/calendar'

import styles from '../SettingsSheet.module.css'

type PendingAction =
  | 'export-calendar'
  | 'import-calendar'
  | 'export-backup'
  | 'restore-backup'
  | null

interface DataSettingsProps {
  calendars: LocalCalendar[]
  defaultCalendarId: string
  onError: (message: string) => void
  onExportBackup: () => Promise<void>
  onExportCalendar: (calendarId: string) => Promise<void>
  onImportCalendar: (
    file: File,
    calendarId: string,
  ) => Promise<IcsImportSummary>
  onRestoreBackup: (
    file: File,
  ) => Promise<BackupRestoreSummary>
}

const maximumCalendarFileSize =
  10 * 1024 * 1024

const maximumBackupFileSize =
  25 * 1024 * 1024

function describeImport(
  summary: IcsImportSummary,
) {
  const parts = [
    `${summary.imported} ${
      summary.imported === 1
        ? 'event'
        : 'events'
    } imported`,
  ]

  if (summary.duplicates > 0) {
    parts.push(
      `${summary.duplicates} duplicates skipped`,
    )
  }

  if (summary.skippedRecurring > 0) {
    parts.push(
      `${summary.skippedRecurring} recurring ${
        summary.skippedRecurring === 1
          ? 'event'
          : 'events'
      } skipped`,
    )
  }

  if (summary.skippedInvalid > 0) {
    parts.push(
      `${summary.skippedInvalid} invalid skipped`,
    )
  }

  return `${parts.join(' · ')}.`
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error
    ? error.message
    : fallback
}

export function DataSettings({
  calendars,
  defaultCalendarId,
  onError,
  onExportBackup,
  onExportCalendar,
  onImportCalendar,
  onRestoreBackup,
}: DataSettingsProps) {
  const [calendarId, setCalendarId] =
    useState(defaultCalendarId)

  const [calendarFile, setCalendarFile] =
    useState<File | null>(null)

  const [backupFile, setBackupFile] =
    useState<File | null>(null)

  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null)

  const [
    confirmingRestore,
    setConfirmingRestore,
  ] = useState(false)

  const [status, setStatus] = useState('')

  const selectedCalendarId =
    calendars.some(
      (calendar) =>
        calendar.id === calendarId,
    )
      ? calendarId
      : calendars[0]?.id ?? ''

  const prepareAction = (
    action: PendingAction,
  ) => {
    onError('')
    setStatus('')
    setPendingAction(action)
  }

  const exportCalendar = async () => {
    if (
      !selectedCalendarId ||
      pendingAction
    ) {
      return
    }

    prepareAction('export-calendar')

    try {
      await onExportCalendar(
        selectedCalendarId,
      )

      setStatus(
        'Calendar file downloaded.',
      )
    } catch (error) {
      onError(
        getErrorMessage(
          error,
          'The calendar file could not be created.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  const importCalendar = async () => {
    if (
      !calendarFile ||
      !selectedCalendarId ||
      pendingAction
    ) {
      return
    }

    prepareAction('import-calendar')

    try {
      const summary =
        await onImportCalendar(
          calendarFile,
          selectedCalendarId,
        )

      setCalendarFile(null)
      setStatus(
        describeImport(summary),
      )
    } catch (error) {
      onError(
        getErrorMessage(
          error,
          'The calendar file could not be imported.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  const exportBackup = async () => {
    if (pendingAction) {
      return
    }

    prepareAction('export-backup')

    try {
      await onExportBackup()

      setStatus(
        'Dayframe backup downloaded.',
      )
    } catch (error) {
      onError(
        getErrorMessage(
          error,
          'The Dayframe backup could not be created.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  const restoreBackup = async () => {
    if (!backupFile || pendingAction) {
      return
    }

    prepareAction('restore-backup')

    try {
      const summary =
        await onRestoreBackup(backupFile)

      setBackupFile(null)
      setConfirmingRestore(false)

      setStatus(
        `Backup restored with ${summary.calendars} ${
          summary.calendars === 1
            ? 'calendar'
            : 'calendars'
        } and ${summary.events} ${
          summary.events === 1
            ? 'event'
            : 'events'
        }.`,
      )
    } catch (error) {
      onError(
        getErrorMessage(
          error,
          'The Dayframe backup could not be restored.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="data-heading"
    >
      <div
        className={styles.sectionHeading}
      >
        <div
          className={styles.sectionIcon}
        >
          <Database
            size={19}
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h3 id="data-heading">
            Data and files
          </h3>

          <p>
            Move calendar data without using
            a cloud service.
          </p>
        </div>
      </div>

      <div className={styles.fileNotice}>
        <span
          className={styles.fileBadge}
        >
          Local files
        </span>

        These are real browser file
        operations. Dayframe reads only
        files you select and does not upload
        them anywhere.
      </div>

      <div className={styles.dataCard}>
        <div
          className={
            styles.dataCardHeading
          }
        >
          <CalendarArrowDown
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <h4>
              Calendar interoperability
            </h4>

            <p>
              Export a calendar or import
              standard, non-recurring
              iCalendar events.
            </p>
          </div>
        </div>

        <label
          className={styles.dataField}
        >
          <span className={styles.label}>
            Calendar
          </span>

          <select
            className={styles.input}
            value={selectedCalendarId}
            disabled={
              pendingAction !== null
            }
            onChange={(event) =>
              setCalendarId(
                event.target.value,
              )
            }
          >
            {calendars.map(
              (calendar) => (
                <option
                  value={calendar.id}
                  key={calendar.id}
                >
                  {calendar.name}
                </option>
              ),
            )}
          </select>
        </label>

        <div
          className={styles.transferGrid}
        >
          <div
            className={
              styles.transferBlock
            }
          >
            <div>
              <strong>
                Export `.ics`
              </strong>

              <span>
                Creates a portable file for
                the selected calendar.
              </span>
            </div>

            <button
              className={
                styles.secondaryButton
              }
              type="button"
              disabled={
                !selectedCalendarId ||
                pendingAction !== null
              }
              onClick={() =>
                void exportCalendar()
              }
            >
              <Download
                size={14}
                strokeWidth={1.8}
              />

              {pendingAction ===
              'export-calendar'
                ? 'Exporting…'
                : 'Export calendar'}
            </button>
          </div>

          <div
            className={
              styles.transferBlock
            }
          >
            <div>
              <strong>
                Import `.ics`
              </strong>

              <span>
                Adds events to the selected
                calendar. Existing data
                remains intact.
              </span>
            </div>

            <div
              className={
                styles.fileActions
              }
            >
              <label
                className={
                  styles.filePicker
                }
              >
                <Upload
                  size={14}
                  strokeWidth={1.8}
                />

                <span>
                  {calendarFile
                    ? 'Change file'
                    : 'Choose file'}
                </span>

                <input
                  type="file"
                  accept=".ics,text/calendar"
                  disabled={
                    pendingAction !== null
                  }
                  onChange={(event) => {
                    const file =
                      event.target
                        .files?.[0] ?? null

                    event.target.value = ''
                    onError('')
                    setStatus('')

                    if (
                      file &&
                      file.size >
                        maximumCalendarFileSize
                    ) {
                      setCalendarFile(null)

                      onError(
                        'Calendar files must be 10 MB or smaller.',
                      )

                      return
                    }

                    setCalendarFile(file)
                  }}
                />
              </label>

              <button
                className={
                  styles.primarySmallButton
                }
                type="button"
                disabled={
                  !calendarFile ||
                  !selectedCalendarId ||
                  pendingAction !== null
                }
                onClick={() =>
                  void importCalendar()
                }
              >
                {pendingAction ===
                'import-calendar'
                  ? 'Importing…'
                  : 'Import events'}
              </button>
            </div>

            {calendarFile ? (
              <span
                className={
                  styles.selectedFile
                }
              >
                Selected:{' '}
                {calendarFile.name}
              </span>
            ) : null}
          </div>
        </div>

        <p
          className={
            styles.compatibilityNote
          }
        >
          Recurring rules are reported and
          skipped because recurring events
          are not part of Dayframe V1 yet.
          UTC, floating, and IANA-timezone
          event times are supported.
        </p>
      </div>

      <div className={styles.dataCard}>
        <div
          className={
            styles.dataCardHeading
          }
        >
          <FileJson
            size={18}
            strokeWidth={1.8}
          />

          <div>
            <h4>
              Complete Dayframe backup
            </h4>

            <p>
              Preserve calendars, events,
              settings, and local demo
              states in one JSON file.
            </p>
          </div>
        </div>

        <div
          className={styles.transferGrid}
        >
          <div
            className={
              styles.transferBlock
            }
          >
            <div>
              <strong>
                Download backup
              </strong>

              <span>
                Saves a complete snapshot
                without changing local data.
              </span>
            </div>

            <button
              className={
                styles.secondaryButton
              }
              type="button"
              disabled={
                pendingAction !== null
              }
              onClick={() =>
                void exportBackup()
              }
            >
              <Download
                size={14}
                strokeWidth={1.8}
              />

              {pendingAction ===
              'export-backup'
                ? 'Preparing…'
                : 'Download backup'}
            </button>
          </div>

          <div
            className={
              styles.transferBlock
            }
          >
            <div>
              <strong>
                Restore backup
              </strong>

              <span>
                Validates a backup before
                replacing current browser
                data.
              </span>
            </div>

            <div
              className={
                styles.fileActions
              }
            >
              <label
                className={
                  styles.filePicker
                }
              >
                <Upload
                  size={14}
                  strokeWidth={1.8}
                />

                <span>
                  {backupFile
                    ? 'Change file'
                    : 'Choose file'}
                </span>

                <input
                  type="file"
                  accept=".json,application/json"
                  disabled={
                    pendingAction !== null
                  }
                  onChange={(event) => {
                    const file =
                      event.target
                        .files?.[0] ?? null

                    event.target.value = ''
                    onError('')
                    setStatus('')
                    setConfirmingRestore(
                      false,
                    )

                    if (
                      file &&
                      file.size >
                        maximumBackupFileSize
                    ) {
                      setBackupFile(null)

                      onError(
                        'Backup files must be 25 MB or smaller.',
                      )

                      return
                    }

                    setBackupFile(file)
                  }}
                />
              </label>

              <button
                className={
                  styles.dangerButton
                }
                type="button"
                disabled={
                  !backupFile ||
                  pendingAction !== null
                }
                onClick={() =>
                  setConfirmingRestore(
                    true,
                  )
                }
              >
                Restore backup
              </button>
            </div>

            {backupFile ? (
              <span
                className={
                  styles.selectedFile
                }
              >
                Selected:{' '}
                {backupFile.name}
              </span>
            ) : null}
          </div>
        </div>

        {confirmingRestore &&
        backupFile ? (
          <div
            className={
              styles.restoreConfirmation
            }
          >
            <div>
              <strong>
                Replace current local data?
              </strong>

              <span>
                `{backupFile.name}` will
                replace every Dayframe
                record in this browser after
                validation.
              </span>
            </div>

            <div
              className={
                styles.confirmationActions
              }
            >
              <button
                className={
                  styles.secondaryButton
                }
                type="button"
                disabled={
                  pendingAction !== null
                }
                onClick={() =>
                  setConfirmingRestore(
                    false,
                  )
                }
              >
                Cancel
              </button>

              <button
                className={
                  styles.dangerButton
                }
                type="button"
                disabled={
                  pendingAction !== null
                }
                onClick={() =>
                  void restoreBackup()
                }
              >
                {pendingAction ===
                'restore-backup'
                  ? 'Restoring…'
                  : 'Replace and restore'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {status ? (
        <p
          className={styles.success}
          role="status"
        >
          {status}
        </p>
      ) : null}
    </section>
  )
}
