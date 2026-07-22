import { LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'

import type {
  LocalProfile,
  LocalProfileUpdate,
} from '../../../types/calendar'

import styles from '../SettingsSheet.module.css'

interface AccountSettingsProps {
  profile: LocalProfile
  onError: (message: string) => void
  onUpdateProfile: (
    changes: LocalProfileUpdate,
  ) => Promise<void>
}

export function AccountSettings({
  profile,
  onError,
  onUpdateProfile,
}: AccountSettingsProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const updateProfile = (changes: LocalProfileUpdate) => {
    onError('')

    void onUpdateProfile(changes).catch(() => {
      onError('The local profile could not be saved.')
    })
  }

  const signOut = async () => {
    if (isSigningOut) {
      return
    }

    onError('')
    setIsSigningOut(true)

    try {
      await onUpdateProfile({ isSignedIn: false })
    } catch {
      onError('The local session could not be closed.')
      setIsSigningOut(false)
    }
  }

  const profileInitials =
    profile.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DU'

  return (
    <section
      className={styles.section}
      aria-labelledby="account-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <UserRound size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="account-heading">Profile and access</h3>
          <p>Preview a signed-in product account locally.</p>
        </div>
      </div>

      <div className={styles.demoNotice}>
        <span className={styles.demoBadge}>Local demo</span>
        This is not real authentication. There is no account,
        password, session token, or server request.
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatar} aria-hidden="true">
          {profileInitials}
        </div>

        <div className={styles.profileIdentity}>
          <div>
            <strong>{profile.displayName}</strong>
            <span>{profile.email}</span>
          </div>

          <span className={styles.statusBadge}>
            Signed in locally
          </span>
        </div>
      </div>

      <div className={styles.cardGrid}>
        <label className={styles.settingCard}>
          <span className={styles.label}>Display name</span>
          <input
            className={styles.input}
            type="text"
            defaultValue={profile.displayName}
            key={`name:${profile.updatedAt}`}
            onBlur={(event) => {
              const nextName = event.target.value.trim()

              if (!nextName) {
                event.target.value = profile.displayName
                return
              }

              if (nextName !== profile.displayName) {
                updateProfile({ displayName: nextName })
              }
            }}
          />
        </label>

        <label className={styles.settingCard}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            defaultValue={profile.email}
            key={`email:${profile.updatedAt}`}
            onBlur={(event) => {
              const nextEmail = event.target.value.trim()

              if (!nextEmail) {
                event.target.value = profile.email
                return
              }

              if (nextEmail !== profile.email) {
                updateProfile({ email: nextEmail })
              }
            }}
          />
        </label>

        <div
          className={`${styles.settingCard} ${styles.cardWide}`}
        >
          <div className={styles.sectionActions}>
            <div>
              <strong>Local session</strong>
              <span>
                Signing out hides the calendar until the local demo
                form is completed again.
              </span>
            </div>

            <button
              className={styles.dangerButton}
              type="button"
              disabled={isSigningOut}
              onClick={() => void signOut()}
            >
              <LockKeyhole size={14} strokeWidth={1.8} />
              {isSigningOut ? 'Signing out…' : 'Sign out locally'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
