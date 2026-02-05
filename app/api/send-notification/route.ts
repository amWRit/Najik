import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  };
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientTokens, notification }: { recipientTokens: string[]; notification: NotificationPayload } = body;

    if (!recipientTokens || !notification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send notifications using Firebase Admin SDK (V1 API)
    const messages = recipientTokens.map((token: string) => ({
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      webpush: {
        notification: {
          icon: '/images/logos/icon-192x192.png',
          badge: '/images/logos/icon-72x72.png',
          tag: notification.data?.type || 'default',
        },
        fcmOptions: {
          link: '/',
        },
      },
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal',
      } as const,
      apns: {
        headers: {
          'apns-priority': notification.priority === 'high' ? '10' : '5',
        } as const,
      },
    }));

    const fcmResult = await admin.messaging().sendEach(messages);

    return NextResponse.json({ 
      success: true, 
      successCount: fcmResult.successCount,
      failureCount: fcmResult.failureCount,
      sentTo: recipientTokens.length,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
