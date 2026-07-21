import {
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { DayframeLogo } from './components/brand/DayframeLogo'
import { MonthCalendar } from './components/calendar/MonthCalendar'
import { CalendarSheet } from './components/calendars/CalendarSheet'
import { EventDialog } from './components/events/EventDialog'
import { SettingsSheet } from './components/settings/SettingsSheet'
import {
  createDefaultSettings,
  dayframeDb,
  ensureInitialData,
  settingsId,
} from './db/dayframeDb'
import {
  calendarEventToDraft,
  createCalendarEventRecord
} from './lib/calendarEvents'
import { applyAppearanceSettings } from './lib/theme'
import type {
  CalendarDeleteStrategy,
  CalendarEventColor,
  CalendarEventDraft,
  CalendarUpdate,
  DayframeSettingsUpdate,
  LocalCalendar,
} from './types/calendar'

import styles from './App.module.css'

type EditorState =
  | {
      mode: 'create'
      date: string
    }
  | {
      mode: 'edit'
      eventId: string
    }
  | null

export default function App() {
  const today = useMemo(() => new Date(), [])
  const fallbackSettings = useMemo(
    () => createDefaultSettings(),
    [],
  )

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(today),
  )

  const [editor, setEditor] = useState<EditorState>(null)
  const [calendarSheetOpen, setCalendarSheetOpen] =
    useState(false)
  const [settingsSheetOpen, setSettingsSheetOpen] =
    useState(false)

  useEffect(() => {
    void ensureInitialData()
  }, [])

  const calendars = useLiveQuery(
    () => dayframeDb.calendars.toArray(),
    [],
    [],
  )

  const events = useLiveQuery(
    () => dayframeDb.events.toArray(),
    [],
    [],
  )

  const persistedSettings = useLiveQuery(
    () => dayframeDb.settings.get(settingsId),
    [],
  )

  const settings =
    persistedSettings ?? fallbackSettings

  const { accentColor, theme } = settings

  useEffect(() => {
    applyAppearanceSettings({
      accentColor,
      theme,
    })
  }, [accentColor, theme])

  const eventCounts = events.reduce<Record<string, number>>(
    (counts, event) => {
      counts[event.calendarId] =
        (counts[event.calendarId] ?? 0) + 1

      return counts
    },
    {},
  )

  const defaultCalendar =
    calendars.find(
      (calendar) =>
        calendar.id === settings.defaultCalendarId &&
        calendar.isVisible,
    ) ??
    calendars.find((calendar) => calendar.isVisible) ??
    calendars[0]

  const selectedEvent =
    editor?.mode === 'edit'
      ? events.find((event) => event.id === editor.eventId)
      : undefined

  const selectedEventCalendar = selectedEvent
    ? calendars.find(
        (calendar) =>
          calendar.id === selectedEvent.calendarId,
      )
    : undefined

  const initialEditorDate =
    editor?.mode === 'create'
      ? editor.date
      : selectedEvent
        ? calendarEventToDraft(
            selectedEvent,
            selectedEventCalendar?.timeZone ??
              settings.displayTimeZone,
          ).startDate
        : format(today, 'yyyy-MM-dd')

  const eventDialogKey =
    editor?.mode === 'create'
      ? `create:${editor.date}`
      : editor?.mode === 'edit'
        ? `edit:${editor.eventId}:${
            selectedEvent?.updatedAt ?? 'loading'
          }`
        : 'closed'

  const openCreateDialog = (date: string) => {
    if (!defaultCalendar) {
      return
    }

    setEditor({
      mode: 'create',
      date,
    })
  }

  const openGlobalComposer = () => {
    const defaultDate = isSameMonth(today, visibleMonth)
      ? today
      : visibleMonth

    openCreateDialog(format(defaultDate, 'yyyy-MM-dd'))
  }

  const createEvent = async (
    draft: CalendarEventDraft,
  ) => {
    const calendar = await dayframeDb.calendars.get(
      draft.calendarId,
    )

    if (!calendar) {
      throw new Error('The selected calendar does not exist.')
    }

    await dayframeDb.events.add(
      createCalendarEventRecord(draft),
    )
  }

  const updateEvent = async (
    eventId: string,
    draft: CalendarEventDraft,
  ) => {
    const [existingEvent, calendar] = await Promise.all([
      dayframeDb.events.get(eventId),
      dayframeDb.calendars.get(draft.calendarId),
    ])

    if (!existingEvent) {
      throw new Error('The event no longer exists.')
    }

    if (!calendar) {
      throw new Error('The selected calendar does not exist.')
    }

    await dayframeDb.events.put(
      createCalendarEventRecord(draft, {
        existingEvent,
      }),
    )
  }

  const deleteEvent = async (eventId: string) => {
    await dayframeDb.events.delete(eventId)
  }

  const createCalendar = async (
    name: string,
    color: CalendarEventColor,
  ) => {
    const timestamp = new Date().toISOString()

    const calendar: LocalCalendar = {
      id: crypto.randomUUID(),
      name,
      color,
      timeZone: settings.displayTimeZone,
      isVisible: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await dayframeDb.calendars.add(calendar)
  }

  const updateCalendar = async (
    calendarId: string,
    changes: CalendarUpdate,
  ) => {
    if (changes.isVisible === false) {
      const calendarList =
        await dayframeDb.calendars.toArray()

      const visibleCalendarCount = calendarList.filter(
        (calendar) => calendar.isVisible,
      ).length

      const targetCalendar = calendarList.find(
        (calendar) => calendar.id === calendarId,
      )

      if (
        targetCalendar?.isVisible &&
        visibleCalendarCount === 1
      ) {
        throw new Error(
          'At least one calendar must remain visible.',
        )
      }
    }

    const updatedCalendarCount =
      await dayframeDb.calendars.update(calendarId, {
        ...changes,
        updatedAt: new Date().toISOString(),
      })

    if (updatedCalendarCount === 0) {
      throw new Error('The calendar no longer exists.')
    }
  }

  const deleteCalendar = async (
    calendarId: string,
    strategy: CalendarDeleteStrategy,
  ) => {
    await dayframeDb.transaction(
      'rw',
      dayframeDb.calendars,
      dayframeDb.events,
      dayframeDb.settings,
      async () => {
        const calendarList =
          await dayframeDb.calendars.toArray()

        if (calendarList.length <= 1) {
          throw new Error(
            'At least one calendar is required.',
          )
        }

        const calendar = calendarList.find(
          (item) => item.id === calendarId,
        )

        if (!calendar) {
          throw new Error(
            'The calendar no longer exists.',
          )
        }

        const remainingCalendar = calendarList.find(
          (item) => item.id !== calendarId,
        )

        if (!remainingCalendar) {
          throw new Error(
            'No replacement calendar is available.',
          )
        }

        if (strategy.type === 'move-events') {
          if (
            strategy.targetCalendarId === calendarId
          ) {
            throw new Error(
              'Events cannot be moved to the deleted calendar.',
            )
          }

          const targetCalendar = calendarList.find(
            (item) =>
              item.id === strategy.targetCalendarId,
          )

          if (!targetCalendar) {
            throw new Error(
              'The replacement calendar does not exist.',
            )
          }

          await dayframeDb.events
            .where('calendarId')
            .equals(calendarId)
            .modify({
              calendarId: targetCalendar.id,
              updatedAt: new Date().toISOString(),
            })
        } else {
          await dayframeDb.events
            .where('calendarId')
            .equals(calendarId)
            .delete()
        }

        if (
          settings.defaultCalendarId === calendarId
        ) {
          const replacementCalendarId =
            strategy.type === 'move-events'
              ? strategy.targetCalendarId
              : remainingCalendar.id

          await dayframeDb.settings.update(settingsId, {
            defaultCalendarId: replacementCalendarId,
            updatedAt: new Date().toISOString(),
          })
        }

        await dayframeDb.calendars.delete(calendarId)
      },
    )
  }

  const updateSettings = async (
    changes: DayframeSettingsUpdate,
  ) => {
    await dayframeDb.settings.put({
      ...settings,
      ...changes,
      id: settingsId,
      updatedAt: new Date().toISOString(),
    })
  }

  const showCurrentMonth = () => {
    setVisibleMonth(startOfMonth(today))
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <DayframeLogo />

        <nav
          className={styles.navigation}
          aria-label="Calendar navigation"
        >
          <button
            className={styles.todayButton}
            type="button"
            onClick={showCurrentMonth}
          >
            Today
          </button>

          <div className={styles.arrowButtons}>
            <button
              className={styles.iconButton}
              type="button"
              aria-label="Previous month"
              title="Previous month"
              onClick={() =>
                setVisibleMonth((currentMonth) =>
                  subMonths(currentMonth, 1),
                )
              }
            >
              <ChevronLeft size={18} strokeWidth={1.8} />
            </button>

            <button
              className={styles.iconButton}
              type="button"
              aria-label="Next month"
              title="Next month"
              onClick={() =>
                setVisibleMonth((currentMonth) =>
                  addMonths(currentMonth, 1),
                )
              }
            >
              <ChevronRight size={18} strokeWidth={1.8} />
            </button>
          </div>

          <h1 className={styles.monthTitle} aria-live="polite">
            {format(visibleMonth, 'MMMM yyyy')}
          </h1>
        </nav>

        <div className={styles.headerActions}>
          <button
            className={styles.calendarButton}
            type="button"
            onClick={() => {
              setSettingsSheetOpen(false)
              setCalendarSheetOpen(true)
            }}
          >
            <CalendarDays size={16} strokeWidth={1.8} />
            Calendars
          </button>

          <button
            className={styles.calendarButton}
            type="button"
            onClick={() => {
              setCalendarSheetOpen(false)
              setSettingsSheetOpen(true)
            }}
          >
            <Settings size={16} strokeWidth={1.8} />
            Settings
          </button>

          <button
            className={styles.newEventButton}
            type="button"
            disabled={!defaultCalendar}
            onClick={openGlobalComposer}
          >
            <Plus size={16} strokeWidth={2} />
            New event
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <MonthCalendar
          calendars={calendars}
          displayTimeZone={settings.displayTimeZone}
          events={events}
          visibleMonth={visibleMonth}
          onCreateEvent={openCreateDialog}
          onSelectEvent={(eventId) =>
            setEditor({
              mode: 'edit',
              eventId,
            })
          }
        />
      </main>

      <CalendarSheet
        calendars={calendars}
        eventCounts={eventCounts}
        open={calendarSheetOpen}
        onClose={() => setCalendarSheetOpen(false)}
        onCreate={createCalendar}
        onUpdate={updateCalendar}
        onDelete={deleteCalendar}
      />

      <SettingsSheet
        open={settingsSheetOpen}
        settings={settings}
        onClose={() => setSettingsSheetOpen(false)}
        onUpdate={updateSettings}
      />

      {defaultCalendar ? (
        <EventDialog
          calendars={calendars}
          defaultCalendar={defaultCalendar}
          event={selectedEvent}
          initialDate={initialEditorDate}
          key={eventDialogKey}
          open={editor !== null}
          onClose={() => setEditor(null)}
          onCreate={createEvent}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
        />
      ) : null}
    </div>
  )
}
