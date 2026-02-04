export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'parent' | 'helper';

export type NotificationType = 'sos_alert' | 'location_sharing_started' | 'battery_low' | 'geofence_entered' | 'geofence_exited';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          fcm_token: string | null;
          notification_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          fcm_token?: string | null;
          notification_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          fcm_token?: string | null;
          notification_enabled?: boolean;
          updated_at?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          helper_id: string;
          parent_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          helper_id: string;
          parent_id: string;
          created_at?: string;
        };
        Update: {
          helper_id?: string;
          parent_id?: string;
        };
      };
      location_updates: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy: number;
          battery_level: number | null;
          is_sharing: boolean;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy: number;
          battery_level?: number | null;
          is_sharing?: boolean;
          timestamp?: string;
        };
        Update: {
          latitude?: number;
          longitude?: number;
          accuracy?: number;
          battery_level?: number | null;
          is_sharing?: boolean;
        };
      };
      sos_alerts: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          timestamp: string;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          timestamp?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          is_active?: boolean;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          is_active?: boolean;
        };
      };
      notifications_log: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          created_at?: string;
        };
        Update: {
          message?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      notification_type: NotificationType;
    };
  };
}

// Helper types
export type User = Database['public']['Tables']['users']['Row'];
export type Relationship = Database['public']['Tables']['relationships']['Row'];
export type LocationUpdate = Database['public']['Tables']['location_updates']['Row'];
export type SOSAlert = Database['public']['Tables']['sos_alerts']['Row'];
export type NotificationLog = Database['public']['Tables']['notifications_log']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

// Geolocation types
export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationSharingState {
  isSharing: boolean;
  watchId: number | null;
  lastUpdate: GeolocationPosition | null;
}

// SOS types
export interface SOSState {
  isActive: boolean;
  alertId: string | null;
  audio: HTMLAudioElement | null;
}

// Push notification types
export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}
