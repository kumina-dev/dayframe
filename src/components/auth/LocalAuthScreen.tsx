import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import type {
  LocalProfile,
  LocalProfileUpdate,
} from '../../types/calendar'
import { DayframeLogo } from '../brand/DayframeLogo'

import styles from './LocalAuthScreen.module.css'

interface LocalAuthScreenProps {
  profile: LocalProfile
  onSignIn: (changes: LocalProfileUpdate) => Promise<void>
}

export function LocalAuthScreen({
  profile,
  onSignIn,
}: LocalAuthScreenProps) {
  const [displayName, setDisplayName] = useState(
    profile.displayName,
  )
  const [email, setEmail] = useState(profile.email)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const cleanName = displayName.trim()
    const cleanEmail = email.trim()

    if (!cleanName || !cleanEmail || isSubmitting) {
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await onSignIn({
        displayName: cleanName,
        email: cleanEmail,
        isSignedIn: true,
      })
    } catch {
      setError('The local profile could not be opened.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.screen}>
      <div className={styles.brandRow}>
        <DayframeLogo />

        <span className={styles.demoBadge}>
          <LockKeyhole size={13} strokeWidth={1.9} />
          Local demo
        </span>
      </div>

      <section
        className={styles.card}
        aria-labelledby="local-sign-in-title"
      >
        <div className={styles.iconBox}>
          <ShieldCheck size={23} strokeWidth={1.7} />
        </div>

        <div className={styles.introduction}>
          <p className={styles.eyebrow}>Authentication simulation</p>
          <h1 id="local-sign-in-title">Open your Dayframe</h1>
          <p>
            Use a local demo identity to preview the account flow.
            No account is created outside this browser.
          </p>
        </div>

        <div className={styles.notice}>
          This form makes no network request and does not validate a
          password. The name and email are saved only in IndexedDB on
          this device.
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={displayName}
              autoComplete="name"
              disabled={isSubmitting}
              placeholder="Your name"
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              autoComplete="email"
              disabled={isSubmitting}
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              !displayName.trim() || !email.trim() || isSubmitting
            }
          >
            {isSubmitting ? 'Opening…' : 'Continue locally'}
          </button>
        </form>
      </section>

      <p className={styles.footer}>Private by design · Browser only</p>
    </main>
  )
}
