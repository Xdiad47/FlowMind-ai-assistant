import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, store Google tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at; // unix timestamp in seconds

        // Persist tokens to Firestore for backend usage
        if (token.sub && adminDb) {
          try {
            await adminDb!.doc(`users/${token.sub}`).set({
              google_access_token: account.access_token,
              google_refresh_token: account.refresh_token,
              google_token_expiry: account.expires_at,
            }, { merge: true });
            console.log('✅ Google tokens saved to Firestore for user:', token.sub);
          } catch (err) {
            console.error('❌ Failed to save Google tokens:', err);
          }
        }
      }

      // Auto-refresh expired Google access tokens
      const expiresAt = (token.expiresAt as number) || 0;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt > 0 && now > expiresAt - 60 && token.refreshToken) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID || '',
              client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
              refresh_token: token.refreshToken as string,
              grant_type: 'refresh_token',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            token.accessToken = data.access_token;
            token.expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3599);

            // Update Firestore with refreshed token
            if (token.sub && adminDb) {
              await adminDb!.doc(`users/${token.sub}`).set({
                google_access_token: data.access_token,
                google_token_expiry: token.expiresAt,
              }, { merge: true });
            }
            console.log('🔄 Google token auto-refreshed for user:', token.sub);
          }
        } catch (err) {
          console.error('❌ Failed to refresh Google token:', err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).provider = token.provider;
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  events: {
    async signIn({ user, account }) {
      try {
        if (user.id) {
          const updateData: Record<string, any> = {
            email: user.email,
            name: user.name,
            image: user.image,
            integrations: {
              googleCalendar: true,
              gmail: true,
              microsoftCalendar: false,
              outlookMail: false
            },
            plan: 'free',
            createdAt: FieldValue.serverTimestamp()
          };

          // Also store tokens from the account object
          if (account) {
            updateData.google_access_token = account.access_token;
            updateData.google_refresh_token = account.refresh_token;
            updateData.google_token_expiry = account.expires_at;
          }

          if (adminDb) await adminDb!.doc(`users/${user.id}`).set(updateData, { merge: true });
          console.log('✅ User saved to Firestore:', user.id);
        }
      } catch (error) {
        console.error('❌ Firestore Admin error:', error);
      }
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  debug: process.env.NODE_ENV === 'development'
};

