// src/app/(marketing)/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PLANS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { FullScreenSpinner } from '@/components/shared/FullScreenSpinner';

export default function LandingPage() {
  const { signInWithGoogle, isAuthenticated, isLoading } = useAuthViewModel();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <FullScreenSpinner />;
  }

  const handleDemoScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary selection:bg-primary/30 selection:text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border h-16 flex items-center px-6 lg:px-12">
        <div className="flex items-center gap-2 mr-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H10V10H4V4Z" fill="currentColor" className="text-primary" />
            <path d="M14 4H20V10H14V4Z" fill="currentColor" className="text-primary" />
            <path d="M4 14H10V20H4V14Z" fill="currentColor" className="text-primary" />
          </svg>
          <span className="font-bold text-lg tracking-tight">FlowMind</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted mr-8">
          <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
        </nav>
        <button
          onClick={signInWithGoogle}
          className="text-sm font-medium px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors focus-visible-ring"
        >
          Sign In
        </button>
      </header>

      <main className="flex-1 pt-32 pb-16 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mb-32">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
              AI-Powered Productivity
            </span>
            <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.1] tracking-tight mb-6 text-text-hero">
              Your AI Chief of Staff
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              FlowMind manages your calendar and inbox through natural language. Sign up, connect, and just talk.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={signInWithGoogle}
                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible-ring"
              >
                Get Started Free
              </button>
              <a
                href="#features"
                onClick={handleDemoScroll}
                className="w-full sm:w-auto px-8 py-4 bg-surface hover:bg-surface-offset border border-border text-text-primary rounded-xl font-bold text-lg transition-colors text-center focus-visible-ring"
              >
                See a Demo
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">
              No setup. No API key required to start. Cancel anytime.
            </p>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none perspective-1000">
            {/* Mock Chat Card */}
            <div className="bg-surface-2 border border-border rounded-2xl shadow-2xl overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500">
              <div className="bg-surface-offset px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error" />
                <div className="w-3 h-3 rounded-full bg-warning" />
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col items-end w-full">
                  <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                    <p>Block every morning 9-11 AM for deep work this week</p>
                  </div>
                </div>
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-surface text-muted border border-border w-max mb-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>Create Event (5x)</span>
                  </div>
                  <div className="bg-surface text-text-primary px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] border border-border shadow-sm">
                    <p className="whitespace-pre-wrap">✅ Done! I've blocked 9–11 AM Mon–Fri as 'Deep Work'.

You had 2 conflicts — I moved them to the afternoon.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <div className="border-y border-border py-8 mb-32">
          <p className="text-center text-sm font-medium text-muted uppercase tracking-widest">
            Trusted by 500+ solo founders and freelancers
          </p>
        </div>

        {/* Features Section */}
        <section id="features" className="mb-32">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Do more, manage less.</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-gradient-to-br from-surface to-surface-2 border border-border rounded-3xl p-8 md:p-12 min-h-[300px] flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-2xl font-bold mb-4 z-10">Natural Language Calendar Control</h3>
              <p className="text-muted text-lg z-10 max-w-md">
                FlowMind understands context. Say "move my 1pm to tomorrow" or "find 30 mins for John this week" and it handles the complex logic instantly.
              </p>
            </div>
            
            <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col justify-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Gmail Automation</h3>
              <p className="text-muted">Draft replies, summarize long threads, or bulk archive promotions in plain English.</p>
            </div>
            
            <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col justify-center md:col-start-3">
              <div className="w-12 h-12 bg-surface-offset rounded-xl flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 2L14 2L15.683 5.366C16.3262 6.65251 16.6478 8.07008 16.6148 9.50207C16.5818 10.9341 16.1952 12.3396 15.487 13.604L13.5 17L22 17L21 2Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">BYOK</h3>
              <p className="text-muted">Bring Your Own Key. Pay OpenAI, Anthropic, or Google directly with zero markup.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-32">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">Get started in seconds.</h2>
          
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative">
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-border -z-10" />
            
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-surface-2 border-2 border-primary flex items-center justify-center text-xl font-bold mb-6 bg-bg z-10">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Sign up with Google</h3>
              <p className="text-muted">One click to create your account. No complex forms to fill out.</p>
            </div>
            
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-surface-2 border-2 border-primary flex items-center justify-center text-xl font-bold mb-6 bg-bg z-10">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Connect your tools</h3>
              <p className="text-muted">Authorize Calendar and Gmail. Provide your API key or use our hosted AI.</p>
            </div>
            
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 rounded-full bg-surface-2 border-2 border-primary flex items-center justify-center text-xl font-bold mb-6 bg-bg z-10">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Just talk</h3>
              <p className="text-muted">Type commands in natural English and FlowMind handles the rest.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing.</h2>
            <p className="text-xl text-muted">Start for free, upgrade when you need to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(PLANS).map((plan) => {
              const isPopular = plan.id === 'pro_hosted';
              
              return (
                <div 
                  key={plan.id}
                  className={cn(
                    "bg-surface rounded-3xl p-8 flex flex-col relative",
                    isPopular ? "border-2 border-primary shadow-lg lg:-translate-y-4" : "border border-border"
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold">
                      {plan.price.inr === 0 ? 'Free' : `₹${plan.price.inr}`}
                    </span>
                    {plan.price.inr !== 0 && <span className="text-muted text-sm">/mo</span>}
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-text-primary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={signInWithGoogle}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold transition-colors focus-visible-ring",
                      isPopular 
                        ? "bg-primary hover:bg-primary-hover text-white shadow-md" 
                        : "bg-surface-offset hover:bg-surface-2 text-text-primary border border-border"
                    )}
                  >
                    {plan.price.inr === 0 ? 'Start Free' : 'Get Started'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H10V10H4V4Z" fill="currentColor" className="text-muted" />
                <path d="M14 4H20V10H14V4Z" fill="currentColor" className="text-muted" />
                <path d="M4 14H10V20H4V14Z" fill="currentColor" className="text-muted" />
              </svg>
              <span className="font-bold text-lg text-muted">FlowMind</span>
            </div>
            <p className="text-sm text-muted">Built for solo founders. Made with ❤️ in India.</p>
          </div>
          
          <div className="flex gap-6 text-sm text-muted">
            <Link href="#" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
