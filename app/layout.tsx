import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Raw Deal Verifier',
  description: 'REI Platform Bible v11.24 Deal Analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header className="app-header">
            <h1>Raw Deal Verifier v1.0</h1>
            <p className="header-subtitle">REI Platform Bible v11.24 Analysis Engine</p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
