import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Property Empire',
  description: 'Build your property empire',
  generator: 'Property Empire',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
