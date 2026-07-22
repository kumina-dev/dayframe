import { CreditCard } from 'lucide-react'
import { useState } from 'react'

import type {
  LocalSubscription,
  SubscriptionPlan,
} from '../../../types/calendar'

import styles from '../SettingsSheet.module.css'

interface BillingSettingsProps {
  subscription: LocalSubscription
  onError: (message: string) => void
  onUpdateSubscription: (
    plan: SubscriptionPlan,
  ) => Promise<void>
}

const subscriptionPlans: Array<{
  id: SubscriptionPlan
  name: string
  price: string
  description: string
  features: string[]
}> = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    description: 'The focused local calendar.',
    features: ['Month view', 'Local calendars'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '€4',
    description: 'A fictional personal upgrade.',
    features: ['Everything in Free', 'More color themes'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€9',
    description: 'A fictional power-user plan.',
    features: ['Everything in Plus', 'Advanced workflows'],
  },
]

export function BillingSettings({
  subscription,
  onError,
  onUpdateSubscription,
}: BillingSettingsProps) {
  const [pendingPlan, setPendingPlan] =
    useState<SubscriptionPlan | null>(null)

  const updatePlan = async (plan: SubscriptionPlan) => {
    if (pendingPlan) {
      return
    }

    onError('')
    setPendingPlan(plan)

    try {
      await onUpdateSubscription(plan)
    } catch {
      onError('The simulated plan could not be changed.')
    } finally {
      setPendingPlan(null)
    }
  }

  const currentPlan = subscriptionPlans.find(
    (plan) => plan.id === subscription.plan,
  )

  return (
    <section
      className={styles.section}
      aria-labelledby="billing-heading"
    >
      <div className={styles.sectionHeading}>
        <div className={styles.sectionIcon}>
          <CreditCard size={19} strokeWidth={1.8} />
        </div>

        <div>
          <h3 id="billing-heading">Billing</h3>
          <p>Preview plan selection and subscription state.</p>
        </div>
      </div>

      <div className={styles.demoNotice}>
        <span className={styles.demoBadge}>Local demo</span>
        Plans and prices are fictional. There is no checkout, payment
        provider, charge, or payment information.
      </div>

      <div className={styles.billingSummary}>
        <div>
          <span className={styles.label}>Current plan</span>
          <strong>{currentPlan?.name ?? 'Free'}</strong>
        </div>

        <span className={styles.statusBadge}>
          {subscription.status}
        </span>
      </div>

      <div className={styles.planGrid}>
        {subscriptionPlans.map((plan) => {
          const selected = subscription.plan === plan.id

          return (
            <article
              className={`${styles.planCard} ${
                selected ? styles.planCardSelected : ''
              }`}
              key={plan.id}
            >
              <div className={styles.planHeader}>
                <div>
                  <h4>{plan.name}</h4>
                  <p>{plan.description}</p>
                </div>

                <span className={styles.price}>
                  {plan.price}
                  <small>/mo</small>
                </span>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                className={
                  selected
                    ? styles.secondaryButton
                    : styles.primarySmallButton
                }
                type="button"
                disabled={selected || pendingPlan !== null}
                onClick={() => void updatePlan(plan.id)}
              >
                {pendingPlan === plan.id
                  ? 'Updating…'
                  : selected
                    ? 'Current plan'
                    : `Choose ${plan.name}`}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
