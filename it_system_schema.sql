-- Create Sectors table
CREATE TABLE sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  floor INTEGER CHECK (floor IN (0, 1, 2)), -- 0 is Térreo
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Equipment table
CREATE TABLE equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- PC, Laptop, Printer, Server, etc.
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  status TEXT DEFAULT 'active', -- active, maintenance, retired
  cpu TEXT,
  ram TEXT,
  storage TEXT,
  os TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Maintenance Logs table
CREATE TABLE maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  description TEXT NOT NULL,
  cost NUMERIC DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add equipment_id to tickets table
ALTER TABLE tickets ADD COLUMN equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming all authenticated users can manage IT inventory for now, 
-- or you can restrict to specific roles if needed)
CREATE POLICY "Authenticated users can view sectors" ON sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sectors" ON sectors FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view equipment" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage equipment" ON equipment FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view maintenance" ON maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage maintenance" ON maintenance_logs FOR ALL TO authenticated USING (true);
