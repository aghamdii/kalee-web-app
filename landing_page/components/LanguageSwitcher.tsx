'use client'

import { useRouter } from 'next/navigation'
import { Locale } from '@/i18n/config'

interface LanguageSwitcherProps {
  currentLocale: Locale
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()

  const switchLanguage = (locale: Locale) => {
    router.push(`/${locale}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('en')}
        className={`px-2 py-1 text-sm font-medium transition-colors ${
          currentLocale === 'en'
            ? 'text-kalee-primary bg-kalee-primary/10 rounded'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => switchLanguage('ar')}
        className={`px-2 py-1 text-sm font-medium transition-colors ${
          currentLocale === 'ar'
            ? 'text-kalee-primary bg-kalee-primary/10 rounded'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        عربي
      </button>
    </div>
  )
}