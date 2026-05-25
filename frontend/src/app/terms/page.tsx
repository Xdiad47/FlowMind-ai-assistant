import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | FlowMind',
  description: 'Terms for using the FlowMind AI assistant.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted">Last updated: May 19, 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Service description</h2>
          <p className="text-muted leading-relaxed">
            FlowMind is an AI assistant that helps you manage tasks like scheduling and inbox productivity using connected tools such as Google Calendar and Gmail.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Acceptable use</h2>
          <p className="text-muted leading-relaxed">
            You may not use FlowMind to abuse the service, post or process illegal content, interfere with other users, or attempt to break, bypass, or probe the system in unauthorized ways.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">No guarantees</h2>
          <p className="text-muted leading-relaxed">
            We do not guarantee continuous uptime, error-free operation, or perfect accuracy of AI-generated outputs. You are responsible for reviewing important actions and results.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Changes to the service</h2>
          <p className="text-muted leading-relaxed">
            FlowMind may change features, pricing, limits, or integrations at any time, and the service may be paused or discontinued.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Limitation of liability</h2>
          <p className="text-muted leading-relaxed">
            To the extent allowed by law, FlowMind is not liable for indirect, incidental, or consequential damages. In plain terms, if something goes wrong, our responsibility is limited and you should not rely on the service as your only system for critical work.
          </p>
        </section>
      </div>
    </main>
  );
}
