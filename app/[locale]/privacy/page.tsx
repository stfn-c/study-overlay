import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Study Overlay',
  description: 'Privacy Policy for Study Overlay - How we protect your data',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <p className="text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to Study Overlay. This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our web application. We are committed to protecting your personal data
              and your privacy.
            </p>
            <p className="mt-4">
              Study Overlay is a personal project, not a company. We take your privacy seriously and are committed
              to being transparent about our data practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Information from Google OAuth</h3>
            <p>When you sign in using Google OAuth, we collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Email address</strong> - Used as your unique identifier</li>
              <li><strong>Name</strong> - Used for personalization and display purposes</li>
              <li><strong>Google profile ID</strong> - Used for authentication</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Information You Create</h3>
            <p>When you use our Service, we store:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Widget configurations</strong> - Your customized overlay settings</li>
              <li><strong>Theme preferences</strong> - Your visual customization choices</li>
              <li><strong>Timer settings</strong> - Your Pomodoro timer configurations</li>
              <li><strong>Display preferences</strong> - Layout and display options</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Automatically Collected Information</h3>
            <p>We may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Session cookies</strong> - To maintain your authentication state</li>
              <li><strong>Basic usage data</strong> - Such as feature usage (anonymized)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information solely to provide and improve the Service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To authenticate you and maintain your session</li>
              <li>To save and sync your widget configurations across devices</li>
              <li>To personalize your experience with the Service</li>
              <li>To remember your preferences and settings</li>
              <li>To provide customer support when needed</li>
              <li>To improve the Service based on usage patterns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Storage and Security</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Where We Store Your Data</h3>
            <p>Your data is stored securely using:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> - Our database provider with encryption at rest</li>
              <li><strong>Secure HTTPS connections</strong> - All data transmission is encrypted</li>
              <li><strong>OAuth 2.0</strong> - Industry-standard authentication protocol</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Security Measures</h3>
            <p>We implement appropriate technical and organizational measures to protect your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security updates and monitoring</li>
              <li>Limited access to personal data</li>
              <li>Secure authentication through Google OAuth</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="font-semibold">We DO NOT sell, trade, or rent your personal information to third parties.</p>
            <p className="mt-4">We may share your information only in these limited circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>With your consent</strong> - When you explicitly agree to sharing</li>
              <li><strong>For legal requirements</strong> - If required by law or legal process</li>
              <li><strong>To protect rights</strong> - To protect our rights, privacy, safety, or property</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Third-Party Services</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Google OAuth</h3>
            <p>
              We use Google OAuth for authentication. When you sign in with Google, you are also subject to
              Google's Privacy Policy. We only request the minimum necessary information (email and name).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Spotify Integration</h3>
            <p>
              If you use the Spotify now-playing feature, you will authenticate directly with Spotify. We do not
              store your Spotify credentials. The integration only accesses your currently playing track information.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Supabase</h3>
            <p>
              We use Supabase as our backend service provider. Your data is subject to Supabase's security practices
              and infrastructure. Supabase provides enterprise-grade security and encryption.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights (GDPR Compliance)</h2>
            <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Right to Access</h3>
            <p>You can request a copy of the personal data we hold about you.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Right to Rectification</h3>
            <p>You can request correction of any inaccurate or incomplete personal data.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Right to Erasure ("Right to be Forgotten")</h3>
            <p>You can request deletion of your personal data and account.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Right to Data Portability</h3>
            <p>You can request to receive your data in a structured, commonly used, and machine-readable format.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Right to Object</h3>
            <p>You can object to the processing of your personal data.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Right to Withdraw Consent</h3>
            <p>You can withdraw your consent at any time by deleting your account.</p>

            <p className="mt-4">
              To exercise any of these rights, please contact us at {process.env.NEXT_PUBLIC_CONTACT_EMAIL}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies</h2>
            <p>We use essential cookies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain your authentication session</li>
              <li>Remember your preferences during your session</li>
              <li>Ensure the security of your account</li>
            </ul>
            <p className="mt-4">
              These are strictly necessary cookies required for the Service to function. We do not use tracking
              cookies or advertising cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Data Retention</h2>
            <p>
              We retain your personal data only as long as necessary to provide you with the Service and as described
              in this Privacy Policy. When you delete your account:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your personal information is immediately deleted from our active database</li>
              <li>Backup copies may persist for up to 30 days</li>
              <li>We may retain anonymized usage data for service improvement</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Children's Privacy</h2>
            <p>
              Study Overlay is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If we discover that a child under 13 has provided us with personal
              information, we will delete such information immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              These countries may have data protection laws different from your country. We ensure appropriate
              safeguards are in place to protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating
              the "Last updated" date at the top of this page. For significant changes, we may provide additional
              notice via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Data Protection Officer</h2>
            <p>
              As a personal project, we do not have a formal Data Protection Officer. However, we take data protection
              seriously. For any privacy concerns or questions, please contact us directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data,
              please contact us:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> {process.env.NEXT_PUBLIC_CONTACT_EMAIL}<br />
              <strong>Instagram:</strong> @{process.env.NEXT_PUBLIC_INSTAGRAM}<br />
              <strong>Website:</strong> {process.env.NEXT_PUBLIC_SITE_URL}
            </p>
            <p className="mt-4">
              We aim to respond to all privacy-related inquiries within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Supervisory Authority</h2>
            <p>
              If you are in the European Economic Area (EEA) and believe we have not addressed your concerns adequately,
              you have the right to lodge a complaint with your local data protection supervisory authority.
            </p>
          </section>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Your Privacy Matters</strong><br />
              We are committed to protecting your privacy and giving you control over your personal information.
              If you have any concerns about how we handle your data, please don't hesitate to contact us.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}