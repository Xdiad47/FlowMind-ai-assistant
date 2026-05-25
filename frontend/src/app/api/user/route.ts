import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
       return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const userDoc = await adminDb!.doc(`users/${userId}`).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    return NextResponse.json({
      success: true,
      data: {
        integrations: userData?.integrations || {
          googleCalendar: true,
          gmail: true,
          microsoftCalendar: false,
          outlookMail: false
        },
        apiProvider: userData?.api_provider ?? null,
        plan: userData?.plan ?? 'free',
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
