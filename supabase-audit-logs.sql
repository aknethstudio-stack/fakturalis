-- Tabela audit_logs dla bezpieczeństwa aplikacji
-- Uruchom w Supabase SQL Editor

-- Tworzenie tabeli audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  resource_id TEXT,
  resource_type TEXT,
  details JSONB,
  status TEXT CHECK (status IN ('success', 'failure', 'error')) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- RLS - użytkownicy widzą tylko swoje logi
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON audit_logs 
  FOR SELECT USING (user_id = auth.uid());

-- System może wstawiać logi (service role key)
CREATE POLICY "Service can insert audit logs" ON audit_logs 
  FOR INSERT WITH CHECK (true);