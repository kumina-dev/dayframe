import { Clock3 } from 'lucide-react'
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { TimeFormat } from '../../types/calendar'
import { Popover } from './Popover'

import styles from './TimePicker.module.css'

interface TimePickerProps {
  align?: 'start' | 'end'
  ariaLabel: string
  disabled?: boolean
  timeFormat: TimeFormat
  value: string
  onChange: (value: string) => void
}

function createTimeValue(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')}`
}

function formatTimeValue(
  value: string,
  timeFormat: TimeFormat,
) {
  const [hoursValue, minutesValue] = value.split(':')
  const hours = Number(hoursValue)
  const minutes = Number(minutesValue)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return value
  }

  if (timeFormat === '24-hour') {
    return `${String(hours).padStart(2, '0')}:${String(
      minutes,
    ).padStart(2, '0')}`
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${String(minutes).padStart(
    2,
    '0',
  )} ${period}`
}

function parseTimeInput(
  input: string,
  currentValue: string,
  timeFormat: TimeFormat,
) {
  const match = input
    .trim()
    .toUpperCase()
    .replaceAll('.', ':')
    .match(/^(\d{1,2})(?::?(\d{2}))?\s*(AM|PM)?$/)

  if (!match) {
    return null
  }

  let hours = Number(match[1])
  const minutes = Number(match[2] ?? '0')
  let period = match[3]

  if (minutes > 59) {
    return null
  }

  if (
    !period &&
    timeFormat === '12-hour' &&
    hours >= 1 &&
    hours <= 12
  ) {
    const currentHours = Number(currentValue.split(':')[0])
    period = currentHours >= 12 ? 'PM' : 'AM'
  }

  if (period) {
    if (hours < 1 || hours > 12) {
      return null
    }

    hours %= 12

    if (period === 'PM') {
      hours += 12
    }
  } else if (hours > 23) {
    return null
  }

  return `${String(hours).padStart(2, '0')}:${String(
    minutes,
  ).padStart(2, '0')}`
}

export function TimePicker({
  align = 'start',
  ariaLabel,
  disabled = false,
  timeFormat,
  value,
  onChange,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() =>
    formatTimeValue(value, timeFormat),
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const suppressOpenOnFocusRef = useRef(false)
  const listboxId = useId()

  const options = useMemo(() => {
    const values = new Set<string>()

    for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
      values.add(createTimeValue(minutes))
    }

    values.add(value)

    return [...values].sort()
  }, [value])

  useEffect(() => {
    if (!open) {
      return
    }

    listRef.current
      ?.querySelector<HTMLElement>(`[data-time="${value}"]`)
      ?.scrollIntoView({ block: 'center' })
  }, [open, value])

  const selectTime = (nextValue: string) => {
    setDraft(formatTimeValue(nextValue, timeFormat))
    onChange(nextValue)
    setOpen(false)
    suppressOpenOnFocusRef.current = true
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const commitDraft = () => {
    const parsedValue = parseTimeInput(
      draft,
      value,
      timeFormat,
    )

    if (!parsedValue) {
      setDraft(formatTimeValue(value, timeFormat))
      return false
    }

    setDraft(formatTimeValue(parsedValue, timeFormat))

    if (parsedValue !== value) {
      onChange(parsedValue)
    }

    return true
  }

  const focusOption = (optionIndex: number) => {
    const nextValue = options[optionIndex]

    if (!nextValue) {
      return
    }

    listRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-time="${nextValue}"]`,
      )
      ?.focus()
  }

  const focusSelectedOption = () => {
    const selectedIndex = Math.max(options.indexOf(value), 0)

    requestAnimationFrame(() => focusOption(selectedIndex))
  }

  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      focusSelectedOption()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (commitDraft()) {
        setOpen(false)
      }

      return
    }

    if (event.key === 'Escape') {
      setDraft(formatTimeValue(value, timeFormat))
      setOpen(false)
    }
  }

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    optionIndex: number,
  ) => {
    let nextIndex: number | undefined

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = Math.min(optionIndex + 1, options.length - 1)
        break
      case 'ArrowUp':
        nextIndex = Math.max(optionIndex - 1, 0)
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = options.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    focusOption(nextIndex)
  }

  return (
    <Popover
      align={align}
      ariaLabel={`${ariaLabel} options`}
      open={open}
      onClose={() => setOpen(false)}
      trigger={
        <div
          className={styles.field}
          data-open={open ? 'true' : 'false'}
        >
          <input
            type="text"
            inputMode="numeric"
            ref={inputRef}
            value={draft}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            disabled={disabled}
            onFocus={() => {
              if (suppressOpenOnFocusRef.current) {
                suppressOpenOnFocusRef.current = false
                return
              }

              setOpen(true)
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => commitDraft()}
            onKeyDown={handleInputKeyDown}
          />

          <button
            type="button"
            aria-label={`Open ${ariaLabel.toLowerCase()} options`}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) {
                setOpen(false)
              } else {
                inputRef.current?.focus()
                setOpen(true)
              }
            }}
          >
            <Clock3 size={16} strokeWidth={1.8} />
          </button>
        </div>
      }
    >
      <div
        className={styles.options}
        id={listboxId}
        ref={listRef}
        role="listbox"
        aria-label={ariaLabel}
      >
        {options.map((option, optionIndex) => {
          const selected = option === value

          return (
            <button
              className={`${styles.option} ${
                selected ? styles.optionSelected : ''
              }`}
              type="button"
              role="option"
              data-time={option}
              key={option}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTime(option)}
              onKeyDown={(event) =>
                handleOptionKeyDown(event, optionIndex)
              }
            >
              {formatTimeValue(option, timeFormat)}
            </button>
          )
        })}
      </div>
    </Popover>
  )
}
