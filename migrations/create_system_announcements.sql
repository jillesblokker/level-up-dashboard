CREATE TABLE IF NOT EXISTS public.system_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    -- 'info', 'warning', 'success', 'event'
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Admin user ID or email
);
-- RLS Policies
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
-- Everyone can read active announcements
CREATE POLICY "Everyone can read active announcements" ON public.system_announcements FOR
SELECT USING (
        is_active = true
        AND (
            expires_at IS NULL
            OR expires_at > NOW()
        )
    );
-- Only admins can insert/update/delete (this is enforced by API logic mostly if using service role, but good to have)
-- ensuring regular users cannot mutate
CREATE POLICY "Admins can manage announcements" ON public.system_announcements FOR ALL USING (false);
-- We'll rely on Service Role for admin writes to keep it simple/secure, or specific admin UID policy if we had auth.uid for admins in Supabase directly.
-- Index for fast lookup of active announcements
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.system_announcements(is_active, expires_at);