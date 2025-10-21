import { Resend } from 'resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendWelcomeEmail(userEmail: string, userName: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Stefan from Study Overlay <hello@ss-overlay.com>',
        to: [userEmail],
        replyTo: 'stfn.ciu@gmail.com',
        subject: 'Welcome to Study Overlay! 🎉',
        react: WelcomeEmail({ userName }),
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        throw error;
      }

      console.log('Welcome email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  },

  async sendFeatureRequestNotification(
    title: string,
    description: string,
    userName: string,
    userEmail: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Study Overlay <notifications@ss-overlay.com>',
        to: ['stfn.ciu@gmail.com'],
        replyTo: userEmail,
        subject: `New Feature Request: ${title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Feature Request</h2>
            <p><strong>${userName}</strong> (${userEmail}) submitted a feature request:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${title}</h3>
              <p>${description}</p>
            </div>
            <p><a href="https://ss-overlay.com">View on Study Overlay →</a></p>
          </div>
        `,
      });

      if (error) {
        console.error('Failed to send feature request notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending feature request notification:', error);
      // Don't throw - we don't want to fail the request if email fails
      return null;
    }
  },
};
