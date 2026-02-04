-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('parent', 'helper');
CREATE TYPE notification_type AS ENUM ('sos_alert', 'location_sharing_started', 'battery_low', 'geofence_entered', 'geofence_exited');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    fcm_token TEXT,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationships table (who monitors whom)
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(helper_id, parent_id)
);

-- Location updates table
CREATE TABLE location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    battery_level INTEGER,
    is_sharing BOOLEAN DEFAULT true,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SOS alerts table
CREATE TABLE sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- Notifications log table
CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Messages table (for preset messages)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_location_updates_user_id ON location_updates(user_id);
CREATE INDEX idx_location_updates_timestamp ON location_updates(timestamp DESC);
CREATE INDEX idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_is_active ON sos_alerts(is_active);
CREATE INDEX idx_relationships_helper_id ON relationships(helper_id);
CREATE INDEX idx_relationships_parent_id ON relationships(parent_id);
CREATE INDEX idx_notifications_log_user_id ON notifications_log(user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for relationships table
CREATE POLICY "Helpers can view their relationships"
    ON relationships FOR SELECT
    USING (auth.uid() = helper_id OR auth.uid() = parent_id);

CREATE POLICY "Helpers can create relationships"
    ON relationships FOR INSERT
    WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Helpers can delete their relationships"
    ON relationships FOR DELETE
    USING (auth.uid() = helper_id);

-- RLS Policies for location_updates table
CREATE POLICY "Users can insert their own location"
    ON location_updates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own location"
    ON location_updates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Helpers can view parent locations"
    ON location_updates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM relationships
            WHERE relationships.helper_id = auth.uid()
            AND relationships.parent_id = location_updates.user_id
        )
    );

-- RLS Policies for sos_alerts table
CREATE POLICY "Users can insert their own SOS alerts"
    ON sos_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOS alerts"
    ON sos_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Helpers can view parent SOS alerts"
    ON sos_alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM relationships
            WHERE relationships.helper_id = auth.uid()
            AND relationships.parent_id = sos_alerts.user_id
        )
    );

CREATE POLICY "Helpers can update parent SOS alerts"
    ON sos_alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM relationships
            WHERE relationships.helper_id = auth.uid()
            AND relationships.parent_id = sos_alerts.user_id
        )
    );

-- RLS Policies for notifications_log table
CREATE POLICY "Users can view their own notifications"
    ON notifications_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
    ON notifications_log FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON notifications_log FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages sent to them"
    ON messages FOR SELECT
    USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean old location updates (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_location_updates()
RETURNS void AS $$
BEGIN
    DELETE FROM location_updates
    WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
