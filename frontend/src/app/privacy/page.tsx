import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FlowMind',
  description: 'How FlowMind collects and uses data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted">Last updated: May 19, 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What we collect</h2>
          <p className="text-muted leading-relaxed">
            FlowMind collects basic Google account profile data when you sign in, such as your name, email address, and profile photo.
          </p>
          <p className="text-muted leading-relaxed">
            If you connect Gmail, FlowMind can access Gmail message metadata and message content needed to power inbox features.
          </p>
          <p className="text-muted leading-relaxed">
            If you connect Google Calendar, FlowMind can access your calendar events and related event details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How we use your data</h2>
          <p className="text-muted leading-relaxed">
            We use this data only to provide FlowMind features you can see and use, including AI scheduling, email summarization, and productivity workflows.
          </p>
          <p className="text-muted leading-relaxed">
            Google user data obtained through Gmail and Google Calendar APIs is handled according to the Google API Services User Data Policy and is only used to provide user-visible features.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Sharing and selling</h2>
          <p className="text-muted leading-relaxed">
            We do not sell your personal data. We do not share your data with third parties except service providers that help us run FlowMind, such as hosting, logging, and language model infrastructure.
          </p>
          <p className="text-muted leading-relaxed">
            Those providers process data only as needed to operate the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How to disconnect Google access</h2>
          <p className="text-muted leading-relaxed">
            You can disconnect Google integrations in FlowMind settings at any time.
          </p>
          <p className="text-muted leading-relaxed">
            You can also remove FlowMind access from your Google account under Security and then Third-party access.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted leading-relaxed">
            Questions about this policy can be sent to mail2diadem@gmail.com.
          </p>
        </section>
      </div>
    </main>
  );
}
