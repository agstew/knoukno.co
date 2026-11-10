import './globals.css'

export const metadata = {
  title: 'Kno U Kno | Business Learning Platform',
  description:
    'Learn how to start, manage, and grow a business with practical questions, examples, and business planning guidance.',
  verification: {
    other: {
      'isitdown-verification': '2a0905e9b51432303d3a644040ec8a9e',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
