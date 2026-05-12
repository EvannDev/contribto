import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setting up — Contrib.to',
  robots: { index: false, follow: false },
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
