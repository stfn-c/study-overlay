import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Study Overlay',
  description: 'Terms of Service for Study Overlay - Stream overlays for studying',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Study Overlay ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p>
              Study Overlay is a personal project that provides customizable streaming overlays for OBS and other
              broadcasting software. The Service includes features such as Pomodoro timers, Spotify now-playing displays,
              clocks, and other study-focused widgets.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Creation and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must authenticate using Google OAuth to create an account</li>
              <li>You are responsible for maintaining the security of your Google account</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
            <p>When using Study Overlay, you agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to interfere with, compromise, or damage the Service</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Use the Service to distribute malware or harmful code</li>
              <li>Abuse, harass, or harm other users of the Service</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. User Content and Data</h2>
            <p>
              You retain ownership of any widget configurations and customizations you create. By using the Service,
              you grant us a limited license to store and display your configurations as necessary to provide the Service.
            </p>
            <p className="mt-4">
              We reserve the right to remove any content that violates these terms or is otherwise objectionable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
            <p>
              The Service, including its original content, features, and functionality, remains the property of
              Study Overlay and its creator. The Service is protected by copyright and other intellectual property laws.
            </p>
            <p className="mt-4">
              The Spotify integration displays content from Spotify, which remains the property of Spotify and its
              respective content owners. Study Overlay is not affiliated with Spotify.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to
              understand our practices regarding your personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.
            </p>
            <p className="mt-4">
              This is a personal project provided free of charge, and we make no guarantees about its availability,
              functionality, or suitability for your particular needs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, STUDY OVERLAY AND ITS CREATOR SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Modifications to Service</h2>
            <p>
              We reserve the right to modify or discontinue the Service at any time, with or without notice. We shall
              not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice,
              for any reason, including breach of these Terms of Service.
            </p>
            <p className="mt-4">
              You may delete your account at any time through the account settings or by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms of Service at any time. We will notify users of any material
              changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> {process.env.NEXT_PUBLIC_CONTACT_EMAIL}<br />
              <strong>Instagram:</strong> @{process.env.NEXT_PUBLIC_INSTAGRAM}<br />
              <strong>Website:</strong> {process.env.NEXT_PUBLIC_SITE_URL}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction
              in which the Service operator resides, without regard to its conflict of law provisions.
            </p>
          </section>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              By using Study Overlay, you acknowledge that you have read, understood, and agree to be bound by these
              Terms of Service.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}