import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Embr Pulse',
  description: 'Embr platform depth-pass validation sample.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
