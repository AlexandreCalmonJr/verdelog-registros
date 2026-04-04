-- Create Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  cpf TEXT,
  cargo TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Logs table (Ponto)
CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date TEXT,
  date_iso DATE,
  hora_inicio TEXT,
  hora_fim TEXT,
  resumo TEXT,
  total_horas NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Tickets table (Chamados)
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  ponto_id UUID REFERENCES logs(id) ON DELETE SET NULL, -- Linked to a specific log
  is_active BOOLEAN DEFAULT TRUE, -- If true, it belongs to the current/next shift
  ref TEXT,
  cliente TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',
  date DATE,
  date_display TEXT,
  hora TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Active Shifts table
CREATE TABLE active_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE UNIQUE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_shifts ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Authenticated users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for Logs
CREATE POLICY "Users can view own logs" ON logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON logs FOR DELETE USING (auth.uid() = user_id);

-- Policies for Tickets
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tickets" ON tickets FOR DELETE USING (auth.uid() = user_id);

-- Policies for Active Shifts
CREATE POLICY "Authenticated users can view all active shifts" ON active_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own active shift" ON active_shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own active shift" ON active_shifts FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, cargo)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'cargo');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
