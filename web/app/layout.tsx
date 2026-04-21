import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Contrib.to — Find issues worth your time',
  description: 'Scan your GitHub stars for good first issues in repos you already care about.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('ct-theme')||'light';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
