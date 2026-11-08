import './globals.css'

export const metadata = {
  title: 'Kno U Kno | Business Learning Platform',
  description:
    'Learn how to start, manage, and grow a business with practical AI-guided lessons, tools, pricing, and business planning guidance.',
  icons: {
    icon: [
      { url: '/favicon-v2.svg', type: 'image/svg+xml' },
      { url: '/favicon-v2.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon-v2.ico',
    apple: '/favicon-v2.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
