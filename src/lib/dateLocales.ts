import type { Locale } from 'date-fns'
import { enUS, fi } from 'date-fns/locale'

import type { LanguagePreference } from '../types/calendar'

export const dateLocales: Record<LanguagePreference, Locale> = {
  en: enUS,
  fi,
}

export const languageLabels: Record<
  LanguagePreference,
  string
> = {
  en: 'English',
  fi: 'Suomi',
}
