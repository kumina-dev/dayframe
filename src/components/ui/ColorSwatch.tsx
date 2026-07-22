import { Check } from 'lucide-react'

import styles from './ColorSwatch.module.css'

interface ColorSwatchProps {
  color: string
  label: string
  selected: boolean
  disabled?: boolean
  size?: 'small' | 'medium'
  onSelect: () => void
}

export function ColorSwatch({
  color,
  label,
  selected,
  disabled = false,
  size = 'small',
  onSelect,
}: ColorSwatchProps) {
  const classes = [
    styles.swatch,
    size === 'medium' ? styles.medium : styles.small,
    selected ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      style={{ backgroundColor: color }}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      disabled={disabled}
      onClick={onSelect}
    >
      {selected ? (
        <Check aria-hidden="true" size={12} strokeWidth={2.6} />
      ) : null}
    </button>
  )
}
