import styles from './DayframeLogo.module.css'

export function DayframeLogo() {
  return (
    <div className={styles.logo} aria-label="Dayframe">
      <svg
        className={styles.mark}
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <rect
          className={styles.frame}
          x="3.5"
          y="3.5"
          width="25"
          height="25"
          rx="6"
        />

        <path
          className={styles.grid}
          d="M3.5 12.5H28.5M12.5 12.5V28.5"
        />

        <rect
          className={styles.highlight}
          x="14.5"
          y="14.5"
          width="11"
          height="11"
          rx="3"
        />
      </svg>

      <span className={styles.wordmark}>Dayframe</span>
    </div>
  )
}
