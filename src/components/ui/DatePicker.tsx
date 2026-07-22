import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Popover } from './Popover'

import styles from './DatePicker.module.css'

interface DatePickerProps {
  align?: 'start' | 'end'
  ariaLabel: string
  disabled?: boolean
  max?: string
  min?: string
  value: string
  weekStartsOn: 0 | 1
  onChange: (value: string) => void
}

const weekdayLabels = {
  0: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  1: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
} as const

function parseDateValue(value: string) {
  const date = parseISO(value)

  return isValid(date) ? date : new Date()
}

export function DatePicker({
  align = 'start',
  ariaLabel,
  disabled = false,
  max,
  min,
  value,
  weekStartsOn,
  onChange,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(parseDateValue(value)),
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const selectedDate = parseDateValue(value)

  const days = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(visibleMonth), {
      weekStartsOn,
    })
    const lastDay = endOfWeek(endOfMonth(visibleMonth), {
      weekStartsOn,
    })

    return eachDayOfInterval({
      start: firstDay,
      end: lastDay,
    })
  }, [visibleMonth, weekStartsOn])

  useEffect(() => {
    if (!open) {
      return
    }

    const selectedButton = gridRef.current?.querySelector<
      HTMLButtonElement
    >(`[data-date="${value}"]`)

    selectedButton?.focus()
  }, [open, value])

  const isUnavailable = (dateKey: string) =>
    Boolean((min && dateKey < min) || (max && dateKey > max))

  const closePicker = (restoreFocus = false) => {
    setOpen(false)

    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }

  const openPicker = () => {
    setVisibleMonth(startOfMonth(parseDateValue(value)))
    setOpen(true)
  }

  const selectDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')

    if (isUnavailable(dateKey)) {
      return
    }

    onChange(dateKey)
    closePicker(true)
  }

  const focusDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')

    if (isUnavailable(dateKey)) {
      return
    }

    if (!isSameMonth(date, visibleMonth)) {
      setVisibleMonth(startOfMonth(date))
    }

    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-date="${dateKey}"]`,
        )
        ?.focus()
    })
  }

  const handleDayKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) => {
    let nextDate: Date | undefined

    switch (event.key) {
      case 'ArrowLeft':
        nextDate = addDays(date, -1)
        break
      case 'ArrowRight':
        nextDate = addDays(date, 1)
        break
      case 'ArrowUp':
        nextDate = addDays(date, -7)
        break
      case 'ArrowDown':
        nextDate = addDays(date, 7)
        break
      case 'Home':
        nextDate = startOfWeek(date, { weekStartsOn })
        break
      case 'End':
        nextDate = endOfWeek(date, { weekStartsOn })
        break
      case 'PageUp':
        nextDate = addMonths(date, -1)
        break
      case 'PageDown':
        nextDate = addMonths(date, 1)
        break
      default:
        return
    }

    event.preventDefault()
    focusDate(nextDate)
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const selectedInVisibleMonth = isSameMonth(
    selectedDate,
    visibleMonth,
  )

  return (
    <Popover
      align={align}
      ariaLabel={`${ariaLabel} calendar`}
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <button
          className={styles.trigger}
          type="button"
          ref={triggerRef}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          disabled={disabled}
          onClick={() => {
            if (open) {
              closePicker()
            } else {
              openPicker()
            }
          }}
        >
          <span>{format(selectedDate, 'MMM d, yyyy')}</span>
          <CalendarDays
            aria-hidden="true"
            size={16}
            strokeWidth={1.8}
          />
        </button>
      }
    >
      <div className={styles.calendar}>
        <div className={styles.header}>
          <strong>{format(visibleMonth, 'MMMM yyyy')}</strong>

          <div className={styles.monthActions}>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth((month) => addMonths(month, -1))
              }
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth((month) => addMonths(month, 1))
              }
            >
              <ChevronRight size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className={styles.weekdays} aria-hidden="true">
          {weekdayLabels[weekStartsOn].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div
          className={styles.days}
          ref={gridRef}
          aria-label={format(visibleMonth, 'MMMM yyyy')}
        >
          {days.map((date) => {
            const dateKey = format(date, 'yyyy-MM-dd')
            const selected = isSameDay(date, selectedDate)
            const unavailable = isUnavailable(dateKey)

            const dayClasses = [
              styles.day,
              !isSameMonth(date, visibleMonth)
                ? styles.dayOutside
                : '',
              isToday(date) ? styles.dayToday : '',
              selected ? styles.daySelected : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                className={dayClasses}
                type="button"
                data-date={dateKey}
                key={dateKey}
                aria-label={format(date, 'EEEE, MMMM d, yyyy')}
                aria-pressed={selected}
                aria-current={isToday(date) ? 'date' : undefined}
                disabled={unavailable}
                tabIndex={
                  selected ||
                  (!selectedInVisibleMonth &&
                    isSameMonth(date, visibleMonth) &&
                    date.getDate() === 1)
                    ? 0
                    : -1
                }
                onClick={() => selectDate(date)}
                onKeyDown={(event) =>
                  handleDayKeyDown(event, date)
                }
              >
                {format(date, 'd')}
              </button>
            )
          })}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            disabled={isUnavailable(todayKey)}
            onClick={() => selectDate(new Date())}
          >
            Today
          </button>
        </div>
      </div>
    </Popover>
  )
}
