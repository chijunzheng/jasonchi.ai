import type { Metadata } from 'next'
import { Geist_Mono, Lexend, Source_Sans_3 } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FloatingThemeToggle } from '@/components/layout/floating-theme-toggle'
import { Analytics } from '@vercel/analytics/next'
import { SITE_CONFIG } from '@/lib/constants'
import './globals.css'

const headingFont = Lexend({
  variable: '--font-lexend',
  subsets: ['latin'],
})

const bodyFont = Source_Sans_3({
  variable: '--font-source-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
  keywords: [
    'AI Engineer',
    'Resume',
    'Jason Chi',
    'Interactive Resume',
    'AI Chat',
    'Job Description Analyzer',
    'Cover Letter Generator',
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  openGraph: {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: SITE_CONFIG.title }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-md"
            >
              Skip to content
            </a>
            <FloatingThemeToggle />
            <main id="main-content">{children}</main>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
