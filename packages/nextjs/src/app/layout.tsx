import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat with Tal on WhatsApp',
  description: 'Open WhatsApp to start a conversation with Tal',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
