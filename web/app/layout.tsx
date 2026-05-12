import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://contribto.vercel.app'),
  title: 'Contrib.to — Find issues worth your time',
  description: 'Scan your GitHub stars for good first issues in repos you already care about.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://contribto.vercel.app',
    siteName: 'contribto.vercel.app',
    title: 'contribto.vercel.app — Find issues worth your time',
    description: 'Scan your GitHub stars for good first issues in repos you already care about.',
  },
  twitter: {
    card: 'summary',
    title: 'contribto.vercel.app — Find issues worth your time',
    description: 'Scan your GitHub stars for good first issues in repos you already care about.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full`}>
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
