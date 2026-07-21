import { Plus, Trash2, X } from 'lucide-react'
import {
  type FormEvent,
  type MouseEvent,
  useEffect,
  useState,
} from 'react'

import type {
  CalendarDeleteStrategy,
  CalendarEventColor,
  CalendarUpdate,
  LocalCalendar,
} from '../../types/calendar'

import styles from './CalendarSheet.module.css'

interface CalendarSheetProps {
  calendars: LocalCalendar[]
  eventCounts: Readonly<Record<string, number>>
  open: boolean
  onClose: () => void
  onCreate: (
    name: string,
    color: CalendarEventColor,
  ) => Promise<void>
  onUpdate: (
    calendarId: string,
    changes: CalendarUpdate,
  ) => Promise<void>
  onDelete: (
    calendarId: string,
    strategy: CalendarDeleteStrategy,
  ) => Promise<void>
}

interface CalendarRowProps {
  calendar: LocalCalendar
  canDelete: boolean
  disableVisibility: boolean
  eventCount: number
  onUpdate: CalendarSheetProps['onUpdate']
  onRequestDelete: (calendarId: string) => void
  onError: () => void
}

interface DeleteState {
  calendarId: string
  mode: CalendarDeleteStrategy['type']
  targetCalendarId: string
}

const colors: CalendarEventColor[] = [
  'periwinkle',
  'teal',
  'rose',
  'amber',
]

const colorLabels: Record<CalendarEventColor, string> = {
  periwinkle: 'Periwinkle',
  teal: 'Teal',
  rose: 'Rose',
  amber: 'Amber',
}

function CalendarRow({
  calendar,
  canDelete,
  disableVisibility,
  eventCount,
  onUpdate,
  onRequestDelete,
  onError,
}: CalendarRowProps) {
  const [name, setName] = useState(calendar.name)

  const saveName = async () => {
    const cleanName = name.trim()

    if (!cleanName) {
      setName(calendar.name)
      return
    }

    if (cleanName === calendar.name) {
      return
    }

    try {
      await onUpdate(calendar.id, {
        name: cleanName,
      })
    } catch {
      setName(calendar.name)
      onError()
    }
  }

  return (
    <article className={styles.calendarRow}>
      <div className={styles.calendarTop}>
        <div className={styles.calendarIdentity}>
          <label className={styles.visibilityControl}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={calendar.isVisible}
              disabled={disableVisibility}
              onChange={() => {
                void onUpdate(calendar.id, {
                  isVisible: !calendar.isVisible,
                }).catch(onError)
              }}
            />

            <span className={styles.visibilityLabel}>
              Visible
            </span>
          </label>

          <input
            className={styles.nameInput}
            type="text"
            value={name}
            aria-label={`Calendar name: ${calendar.name}`}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => void saveName()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }

              if (event.key === 'Escape') {
                setName(calendar.name)
                event.currentTarget.blur()
              }
            }}
          />
        </div>

        <button
          className={styles.deleteButton}
          type="button"
          aria-label={`Delete ${calendar.name}`}
          title={
            canDelete
              ? `Delete ${calendar.name}`
              : 'At least one calendar is required'
          }
          disabled={!canDelete}
          onClick={() => onRequestDelete(calendar.id)}
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>

      <div className={styles.calendarMeta}>
        {eventCount} {eventCount === 1 ? 'event' : 'events'}
      </div>

      <div
        className={styles.colorOptions}
        aria-label={`Color for ${calendar.name}`}
      >
        {colors.map((color) => (
          <button
            className={`${styles.colorButton} ${
              styles[`color${color}`]
            } ${
              calendar.color === color
                ? styles.colorButtonSelected
                : ''
            }`}
            type="button"
            key={color}
            aria-label={colorLabels[color]}
            aria-pressed={calendar.color === color}
            title={colorLabels[color]}
            onClick={() => {
              void onUpdate(calendar.id, {
                color,
              }).catch(onError)
            }}
          />
        ))}
      </div>
    </article>
  )
}

export function CalendarSheet({
  calendars,
  eventCounts,
  open,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CalendarSheetProps) {
  const [newCalendarName, setNewCalendarName] = useState('')
  const [newCalendarColor, setNewCalendarColor] =
    useState<CalendarEventColor>('periwinkle')
  const [deleteState, setDeleteState] =
    useState<DeleteState | null>(null)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (deleteState) {
        setDeleteState(null)
      } else {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteState, onClose, open])

  if (!open) {
    return null
  }

  const deletingCalendar = deleteState
    ? calendars.find(
        (calendar) =>
          calendar.id === deleteState.calendarId,
      )
    : undefined

  const replacementCalendars = deletingCalendar
    ? calendars.filter(
        (calendar) =>
          calendar.id !== deletingCalendar.id,
      )
    : []

  const deletingEventCount = deletingCalendar
    ? (eventCounts[deletingCalendar.id] ?? 0)
    : 0

  const handleOverlayMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) {
      return
    }

    if (deleteState) {
      setDeleteState(null)
    } else {
      onClose()
    }
  }

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const cleanName = newCalendarName.trim()

    if (!cleanName || isCreating) {
      return
    }

    setError('')
    setIsCreating(true)

    try {
      await onCreate(cleanName, newCalendarColor)
      setNewCalendarName('')
      setNewCalendarColor('periwinkle')
    } catch {
      setError('The calendar could not be created.')
    } finally {
      setIsCreating(false)
    }
  }

  const requestDelete = (calendarId: string) => {
    const replacementCalendar = calendars.find(
      (calendar) => calendar.id !== calendarId,
    )

    setError('')
    setDeleteState({
      calendarId,
      mode: replacementCalendar
        ? 'move-events'
        : 'delete-events',
      targetCalendarId: replacementCalendar?.id ?? '',
    })
  }

  const confirmDelete = async () => {
    if (!deleteState || isDeleting) {
      return
    }

    const strategy: CalendarDeleteStrategy =
      deleteState.mode === 'move-events'
        ? {
            type: 'move-events',
            targetCalendarId:
              deleteState.targetCalendarId,
          }
        : {
            type: 'delete-events',
          }

    setError('')
    setIsDeleting(true)

    try {
      await onDelete(deleteState.calendarId, strategy)
      setDeleteState(null)
    } catch {
      setError('The calendar could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  const visibleCalendarCount = calendars.filter(
    (calendar) => calendar.isVisible,
  ).length

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
    >
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-sheet-title"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Local calendars</p>

            <h2 className={styles.heading} id="calendar-sheet-title">
              Calendars
            </h2>
          </div>

          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close calendars"
            title="Close"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </header>

        <p className={styles.localNotice}>
          Calendars and events remain in this browser.
        </p>

        <section className={styles.calendarList}>
          {calendars.map((calendar) => (
            <CalendarRow
              calendar={calendar}
              canDelete={calendars.length > 1}
              disableVisibility={
                calendar.isVisible &&
                visibleCalendarCount === 1
              }
              eventCount={eventCounts[calendar.id] ?? 0}
              key={`${calendar.id}:${calendar.name}`}
              onUpdate={onUpdate}
              onRequestDelete={requestDelete}
              onError={() =>
                setError(
                  'The calendar could not be updated.',
                )
              }
            />
          ))}
        </section>

        {deleteState && deletingCalendar ? (
          <section
            className={styles.deleteConfirmation}
            aria-labelledby="delete-calendar-title"
          >
            <div>
              <p
                className={styles.deleteTitle}
                id="delete-calendar-title"
              >
                Delete {deletingCalendar.name}?
              </p>

              <p className={styles.deleteDescription}>
                This calendar contains {deletingEventCount}{' '}
                {deletingEventCount === 1
                  ? 'event'
                  : 'events'}.
              </p>
            </div>

            {deletingEventCount > 0 ? (
              <div className={styles.deleteChoices}>
                <label className={styles.deleteChoice}>
                  <input
                    type="radio"
                    name="calendar-delete-strategy"
                    checked={
                      deleteState.mode === 'move-events'
                    }
                    disabled={isDeleting}
                    onChange={() =>
                      setDeleteState({
                        ...deleteState,
                        mode: 'move-events',
                      })
                    }
                  />

                  <span>Move events to another calendar</span>
                </label>

                <select
                  className={styles.input}
                  value={deleteState.targetCalendarId}
                  disabled={
                    isDeleting ||
                    deleteState.mode !== 'move-events'
                  }
                  onChange={(event) =>
                    setDeleteState({
                      ...deleteState,
                      targetCalendarId:
                        event.target.value,
                    })
                  }
                >
                  {replacementCalendars.map((calendar) => (
                    <option
                      value={calendar.id}
                      key={calendar.id}
                    >
                      {calendar.name}
                    </option>
                  ))}
                </select>

                <label className={styles.deleteChoice}>
                  <input
                    type="radio"
                    name="calendar-delete-strategy"
                    checked={
                      deleteState.mode === 'delete-events'
                    }
                    disabled={isDeleting}
                    onChange={() =>
                      setDeleteState({
                        ...deleteState,
                        mode: 'delete-events',
                      })
                    }
                  />

                  <span>Delete its events permanently</span>
                </label>
              </div>
            ) : (
              <p className={styles.emptyCalendarMessage}>
                This calendar has no events.
              </p>
            )}

            <div className={styles.deleteActions}>
              <button
                className={styles.cancelDeleteButton}
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteState(null)}
              >
                Cancel
              </button>

              <button
                className={styles.confirmDeleteButton}
                type="button"
                disabled={
                  isDeleting ||
                  (deleteState.mode === 'move-events' &&
                    !deleteState.targetCalendarId)
                }
                onClick={() => void confirmDelete()}
              >
                {isDeleting
                  ? 'Deleting…'
                  : 'Delete calendar'}
              </button>
            </div>
          </section>
        ) : null}

        <form
          className={styles.createForm}
          onSubmit={handleCreate}
        >
          <div className={styles.createHeading}>
            <Plus size={16} strokeWidth={1.9} />

            <h3>New calendar</h3>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Name</span>

            <input
              className={styles.input}
              type="text"
              value={newCalendarName}
              disabled={isCreating}
              placeholder="Calendar name"
              onChange={(event) =>
                setNewCalendarName(event.target.value)
              }
            />
          </label>

          <fieldset className={styles.colorFieldset}>
            <legend className={styles.label}>Color</legend>

            <div className={styles.colorOptions}>
              {colors.map((color) => (
                <button
                  className={`${styles.colorButton} ${
                    styles[`color${color}`]
                  } ${
                    newCalendarColor === color
                      ? styles.colorButtonSelected
                      : ''
                  }`}
                  type="button"
                  key={color}
                  aria-label={colorLabels[color]}
                  aria-pressed={newCalendarColor === color}
                  title={colorLabels[color]}
                  disabled={isCreating}
                  onClick={() => setNewCalendarColor(color)}
                />
              ))}
            </div>
          </fieldset>

          <button
            className={styles.createButton}
            type="submit"
            disabled={!newCalendarName.trim() || isCreating}
          >
            {isCreating ? 'Creating…' : 'Create calendar'}
          </button>
        </form>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </aside>
    </div>
  )
}
