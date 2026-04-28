-- Create tables for ClassPilot
DROP TABLE IF EXISTS classes, courses, assignments, program_items, user_preferences CASCADE;
-- 1. Classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'var(--grad-primary)',
  progress INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  room TEXT,
  type TEXT DEFAULT 'course', -- 'course' or 'workshop'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  deliverable TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Program Items (Course progress)
CREATE TABLE program_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_items ENABLE ROW LEVEL SECURITY;

-- Create policies (Simple version: owner can do everything)
CREATE POLICY "Users can manage their own classes" ON classes
  FOR ALL USING (auth.uid() = user_id);

-- For related tables, we filter by the class's owner
CREATE POLICY "Users can manage courses of their classes" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = courses.class_id AND classes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage assignments of their classes" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = assignments.class_id AND classes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage program items of their classes" ON program_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = program_items.class_id AND classes.user_id = auth.uid()
    )
  );

-- 5. User Preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notify_daily BOOLEAN DEFAULT TRUE,
  daily_hour INTEGER DEFAULT 18,
  notify_weekly BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light',
  google_access_token TEXT,
  google_refresh_token TEXT,
  blender_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 6. Helper for self account deletion
CREATE OR REPLACE FUNCTION delete_own_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Push Subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

