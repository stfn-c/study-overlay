import * as React from 'react';

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <html>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        lineHeight: '1.6',
        color: '#333',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '40px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h1 style={{
            margin: '0 0 24px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#111'
          }}>
            Welcome to Study Overlay
          </h1>

          <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            Hey {userName},
          </p>

          <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            Thanks for signing up! I'm Stefan, and I built Study Overlay as a free tool for people who study online.
          </p>

          <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
            You can now create Pomodoro timers, display your Spotify activity, show your local time, and more.
          </p>

          <div style={{
            margin: '32px 0',
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            borderLeft: '3px solid #1e293b'
          }}>
            <p style={{ margin: '0', fontSize: '15px', color: '#555' }}>
              <strong>Got feedback or ideas?</strong><br />
              Just reply to this email — I read and respond to everything.
            </p>
          </div>

          <a href="https://ss-overlay.com" style={{
            display: 'inline-block',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '500',
            marginTop: '8px'
          }}>
            Get Started
          </a>

          <p style={{
            margin: '32px 0 0 0',
            fontSize: '15px',
            color: '#666',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '24px'
          }}>
            — Stefan
          </p>
        </div>

        <p style={{
          margin: '24px 0 0 0',
          fontSize: '13px',
          color: '#888',
          textAlign: 'center'
        }}>
          Study Overlay • ss-overlay.com
        </p>
      </body>
    </html>
  );
}
