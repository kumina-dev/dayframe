import { ChevronDown, Trash2, X } from 'lucide-react'
import {
  type FormEvent,
  type MouseEvent,
  useState,
} from 'react'

import {
  calendarEventToDraft,
  createEmptyEventDraft,
  validateCalendarEventDraft,
} from '../../lib/calendarEvents'
import type {
  CalendarEvent,
  CalendarEventColor,
  CalendarEventDraft,
  LocalCalendar,
} from '../../types/calendar'

import styles from './EventDialog.module.css'

type PendingAction = 'save' | 'delete' | null
type EventColorSelection = CalendarEventColor | 'calendar'

interface EventDialogProps {
  calendars: LocalCalendar[]
  defaultCalendar: LocalCalendar
  event?: CalendarEvent
  initialDate: string
  open: boolean
  onClose: () => void
  onCreate: (event: CalendarEventDraft) => Promise<void>
  onUpdate: (
    eventId: string,
    event: CalendarEventDraft,
  ) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
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

export function EventDialog({
  calendars,
  defaultCalendar,
  event,
  initialDate,
  open,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: EventDialogProps) {
  const eventCalendar = event
    ? calendars.find(
        (calendar) => calendar.id === event.calendarId,
      )
    : undefined

  const initialDraft = event
    ? calendarEventToDraft(
        event,
        eventCalendar?.timeZone ??
          defaultCalendar.timeZone,
      )
    : createEmptyEventDraft(initialDate, defaultCalendar)

  const [calendarId, setCalendarId] = useState(
    initialDraft.calendarId,
  )
  const [title, setTitle] = useState(initialDraft.title)
  const [description, setDescription] = useState(
    initialDraft.description ?? '',
  )
  const [location, setLocation] = useState(
    initialDraft.location ?? '',
  )
  const [allDay, setAllDay] = useState(initialDraft.allDay)
  const [startDate, setStartDate] = useState(
    initialDraft.startDate,
  )
  const [endDate, setEndDate] = useState(
    initialDraft.endDate,
  )
  const [startTime, setStartTime] = useState(
    initialDraft.startTime,
  )
  const [endTime, setEndTime] = useState(
    initialDraft.endTime,
  )
  const [timeZone, setTimeZone] = useState(
    initialDraft.timeZone,
  )
  const [color, setColor] =
    useState<EventColorSelection>(
      initialDraft.color ?? 'calendar',
    )
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null)
  const [confirmingDelete, setConfirmingDelete] =
    useState(false)

  const isEditing = event !== undefined
  const isPending = pendingAction !== null

  const selectedCalendar =
    calendars.find(
      (calendar) => calendar.id === calendarId,
    ) ?? defaultCalendar

  const showDetailsByDefault = Boolean(
    initialDraft.description ||
      initialDraft.location ||
      initialDraft.color ||
      (!initialDraft.allDay &&
        initialDraft.timeZone !== selectedCalendar.timeZone),
  )

  if (!open) {
    return null
  }

  const handleClose = () => {
    if (!isPending) {
      onClose()
    }
  }

  const handleOverlayMouseDown = (
    mouseEvent: MouseEvent<HTMLDivElement>,
  ) => {
    if (mouseEvent.target === mouseEvent.currentTarget) {
      handleClose()
    }
  }

  const getDraft = (): CalendarEventDraft => ({
    calendarId,
    title: title.trim(),
    description: description.trim() || undefined,
    location: location.trim() || undefined,
    allDay,
    startDate,
    endDate,
    startTime,
    endTime,
    timeZone,
    color: color === 'calendar' ? undefined : color,
  })

  const handleSubmit = async (
    formEvent: FormEvent<HTMLFormElement>,
  ) => {
    formEvent.preventDefault()

    if (isPending) {
      return
    }

    const draft = getDraft()
    const validationError =
      validateCalendarEventDraft(draft)

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setConfirmingDelete(false)
    setPendingAction('save')

    try {
      if (event) {
        await onUpdate(event.id, draft)
      } else {
        await onCreate(draft)
      }

      onClose()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : isEditing
            ? 'The event could not be updated.'
            : 'The event could not be saved.',
      )

      setPendingAction(null)
    }
  }

  const handleDelete = async () => {
    if (!event || isPending) {
      return
    }

    setError('')
    setPendingAction('delete')

    try {
      await onDelete(event.id)
      onClose()
    } catch {
      setError('The event could not be deleted. Try again.')
      setPendingAction(null)
      setConfirmingDelete(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
    >
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        onSubmit={handleSubmit}
        onKeyDown={(keyboardEvent) => {
          if (keyboardEvent.key === 'Escape') {
            if (confirmingDelete) {
              setConfirmingDelete(false)
            } else {
              handleClose()
            }
          }
        }}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              {isEditing ? 'Event details' : 'Quick create'}
            </p>

            <h2 className={styles.heading} id="event-dialog-title">
              {isEditing ? 'Edit event' : 'New event'}
            </h2>
          </div>

          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close"
            title="Close"
            disabled={isPending}
            onClick={handleClose}
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </header>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>Title</span>

            <input
              className={styles.input}
              type="text"
              value={title}
              autoFocus
              disabled={isPending}
              placeholder="Event title"
              onChange={(inputEvent) =>
                setTitle(inputEvent.target.value)
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Calendar</span>

            <select
              className={styles.input}
              value={calendarId}
              disabled={isPending}
              onChange={(inputEvent) => {
                const nextCalendarId = inputEvent.target.value
                const nextCalendar = calendars.find(
                  (calendar) =>
                    calendar.id === nextCalendarId,
                )

                setCalendarId(nextCalendarId)

                if (nextCalendar) {
                  setTimeZone(nextCalendar.timeZone)
                }
              }}
            >
              {calendars.map((calendar) => (
                <option value={calendar.id} key={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.allDayControl}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={allDay}
              disabled={isPending}
              onChange={(inputEvent) =>
                setAllDay(inputEvent.target.checked)
              }
            />

            <span>All-day event</span>
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Start date</span>

              <input
                className={styles.input}
                type="date"
                value={startDate}
                disabled={isPending}
                onChange={(inputEvent) => {
                  const nextStartDate =
                    inputEvent.target.value

                  setStartDate(nextStartDate)

                  if (endDate < nextStartDate) {
                    setEndDate(nextStartDate)
                  }
                }}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>End date</span>

              <input
                className={styles.input}
                type="date"
                value={endDate}
                min={startDate}
                disabled={isPending}
                onChange={(inputEvent) =>
                  setEndDate(inputEvent.target.value)
                }
              />
            </label>
          </div>

          {!allDay ? (
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span className={styles.label}>Start time</span>

                <input
                  className={styles.input}
                  type="time"
                  value={startTime}
                  disabled={isPending}
                  onChange={(inputEvent) =>
                    setStartTime(inputEvent.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>End time</span>

                <input
                  className={styles.input}
                  type="time"
                  value={endTime}
                  disabled={isPending}
                  onChange={(inputEvent) =>
                    setEndTime(inputEvent.target.value)
                  }
                />
              </label>
            </div>
          ) : null}

          <details
            className={styles.details}
            open={showDetailsByDefault}
          >
            <summary className={styles.detailsSummary}>
              <span>More details</span>
              <ChevronDown
                className={styles.detailsChevron}
                size={16}
                strokeWidth={1.8}
              />
            </summary>

            <div className={styles.detailsContent}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Location{' '}
                  <span className={styles.optional}>
                    (optional)
                  </span>
                </span>

                <input
                  className={styles.input}
                  type="text"
                  value={location}
                  disabled={isPending}
                  placeholder="Add a location"
                  onChange={(inputEvent) =>
                    setLocation(inputEvent.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  Description{' '}
                  <span className={styles.optional}>
                    (optional)
                  </span>
                </span>

                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={description}
                  disabled={isPending}
                  rows={4}
                  placeholder="Add notes or context"
                  onChange={(inputEvent) =>
                    setDescription(inputEvent.target.value)
                  }
                />
              </label>

              {!allDay ? (
                <label className={styles.field}>
                  <span className={styles.label}>Timezone</span>

                  <input
                    className={styles.input}
                    type="text"
                    list="dayframe-time-zones"
                    value={timeZone}
                    disabled={isPending}
                    placeholder="Europe/Helsinki"
                    onChange={(inputEvent) =>
                      setTimeZone(inputEvent.target.value)
                    }
                  />

                  <datalist id="dayframe-time-zones">
                    {commonTimeZones.map((zone) => (
                      <option value={zone} key={zone} />
                    ))}
                  </datalist>

                  <span className={styles.hint}>
                    Use an IANA timezone identifier.
                  </span>
                </label>
              ) : null}

              <fieldset className={styles.colorFieldset}>
                <legend className={styles.label}>
                  Event color
                </legend>

                <div className={styles.colorOptions}>
                  <button
                    className={`${styles.calendarColorButton} ${
                      color === 'calendar'
                        ? styles.colorButtonSelected
                        : ''
                    }`}
                    type="button"
                    aria-pressed={color === 'calendar'}
                    disabled={isPending}
                    onClick={() => setColor('calendar')}
                  >
                    Calendar color
                  </button>

                  {colors.map((eventColor) => (
                    <button
                      className={`${styles.colorButton} ${
                        styles[`color${eventColor}`]
                      } ${
                        color === eventColor
                          ? styles.colorButtonSelected
                          : ''
                      }`}
                      type="button"
                      key={eventColor}
                      aria-label={colorLabels[eventColor]}
                      aria-pressed={color === eventColor}
                      title={colorLabels[eventColor]}
                      disabled={isPending}
                      onClick={() => setColor(eventColor)}
                    />
                  ))}
                </div>
              </fieldset>
            </div>
          </details>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>

        {confirmingDelete ? (
          <div className={styles.deleteConfirmation}>
            <div>
              <p className={styles.deleteTitle}>
                Delete this event?
              </p>

              <p className={styles.deleteDescription}>
                This action cannot be undone.
              </p>
            </div>

            <div className={styles.deleteActions}>
              <button
                className={styles.keepButton}
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep event
              </button>

              <button
                className={styles.confirmDeleteButton}
                type="button"
                disabled={isPending}
                onClick={() => void handleDelete()}
              >
                {pendingAction === 'delete'
                  ? 'Deleting…'
                  : 'Delete event'}
              </button>
            </div>
          </div>
        ) : (
          <footer
            className={`${styles.actions} ${
              isEditing ? styles.actionsEditing : ''
            }`}
          >
            {isEditing ? (
              <button
                className={styles.deleteButton}
                type="button"
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 size={15} strokeWidth={1.8} />
                Delete
              </button>
            ) : null}

            <div className={styles.primaryActions}>
              <button
                className={styles.cancelButton}
                type="button"
                disabled={isPending}
                onClick={handleClose}
              >
                Cancel
              </button>

              <button
                className={styles.saveButton}
                type="submit"
                disabled={
                  !title.trim() ||
                  !startDate ||
                  !endDate ||
                  !calendarId ||
                  isPending
                }
              >
                {pendingAction === 'save'
                  ? 'Saving…'
                  : isEditing
                    ? 'Save changes'
                    : 'Save event'}
              </button>
            </div>
          </footer>
        )}
      </form>
    </div>
  )
}
