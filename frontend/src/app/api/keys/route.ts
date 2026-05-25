// SECURITY: Never log request.body — contains API key
// src/app/api/keys/route.ts
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

function encryptApiKey(apiKey: string, userId: string): string {
  const masterKeyStr = process.env.MASTER_ENCRYPTION_KEY || '6862be20ed1df09165ff1fe16ddb6644f4d30f621e58acc805e2e0b76062804b';
  const masterKey = Buffer.from(masterKeyStr, 'utf8');
  const salt = Buffer.from(userId, 'utf8');
  
  const key = crypto.scryptSync(masterKey, salt, 32, { N: 16384, r: 8, p: 1 });
  
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  
  let ciphertext = cipher.update(apiKey, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final(), cipher.getAuthTag()]);
  
  return Buffer.concat([nonce, ciphertext]).toString('base64');
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const userId = session.user.id;
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    if (!body.provider || !body.key) {
      return new NextResponse('Provider and key are required', { status: 400 });
    }

    const encrypted = encryptApiKey(body.key, userId);

    await adminDb!.doc(`users/${userId}`).update({
      api_provider: body.provider,
      api_key_encrypted: encrypted
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving API key:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return new NextResponse('Unauthorized', { status: 401 });

  // @ts-expect-error
  const userId = session.user.id;
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    await adminDb!.doc(`users/${userId}`).update({
      api_provider: FieldValue.delete(),
      api_key_encrypted: FieldValue.delete()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing API key:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
