// src/app/not-found.tsx
import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found - FlowMind',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center p-4">
      <div className="mb-8">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-primary">
          <path d="M4 4H10V10H4V4Z" fill="currentColor" />
          <path d="M14 4H20V10H14V4Z" fill="currentColor" />
          <path d="M4 14H10V20H4V14Z" fill="currentColor" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-text-primary mb-4">Page not found</h1>
      <p className="text-muted mb-8 max-w-md mx-auto">
        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors shadow-md"
      >
        Go back home
      </Link>
    </div>
  );
}
