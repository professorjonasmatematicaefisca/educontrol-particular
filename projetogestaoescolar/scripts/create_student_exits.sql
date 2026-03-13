-- Create table for tracking student exits (Monitoria)
CREATE TABLE IF NOT EXISTS student_exits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reasons TEXT[] NOT NULL, -- Array of strings for reasons (Banheiro, Água, etc.)
  exit_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  return_time TIMESTAMP WITH TIME ZONE, -- Null implies currently out
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policy to allow all operations for now (adjust as needed for RLS)
ALTER TABLE student_exits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON student_exits
    FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries on active exits
CREATE INDEX IF NOT EXISTS idx_student_exits_return_time ON student_exits(return_time);
CREATE INDEX IF NOT EXISTS idx_student_exits_student_id ON student_exits(student_id);
