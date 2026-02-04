import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FIREBASE_SERVER_KEY = process.env.FIREBASE_SERVER_KEY;

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientIds, notification }: { recipientIds: string[]; notification: NotificationPayload } = body;

    if (!recipientIds || !notification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get FCM tokens for recipients
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, fcm_token, notification_enabled')
      .in('id', recipientIds)
      .eq('notification_enabled', true);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No valid users found' }, { status: 200 });
    }

    const tokens = users
      .filter((u: any) => u.fcm_token)
      .map((u: any) => u.fcm_token as string);

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'No valid FCM tokens found' }, { status: 200 });
    }

    // Send notification via FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        registration_ids: tokens,
        priority: notification.priority || 'high',
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          click_action: '/',
          tag: notification.data?.type || 'default',
        },
        data: notification.data || {},
        webpush: {
          headers: {
            Urgency: notification.priority === 'high' ? 'high' : 'normal',
          },
          fcm_options: {
            link: '/',
          },
        },
      }),
    });

    const fcmResult = await fcmResponse.json();

    // Log notifications
    if (users && users.length > 0) {
      const notificationLogs = users.map((u: any) => ({
        user_id: u.id as string,
        type: (notification.data?.type as any) || 'location_sharing_started',
        title: notification.title,
        body: notification.body,
      }));

      const { error: logError } = await supabase
        .from('notifications_log')
        .insert(notificationLogs as any);
      
      if (logError) {
        console.error('Error logging notifications:', logError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      result: fcmResult,
      sentTo: tokens.length,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
