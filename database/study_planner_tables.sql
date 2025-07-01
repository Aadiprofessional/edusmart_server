-- Study Planner Database Schema
-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS application_tasks CASCADE;
DROP TABLE IF EXISTS study_tasks CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Create applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    university VARCHAR(255) NOT NULL,
    program VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    deadline DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'submitted', 'interview', 'accepted', 'rejected', 'waitlisted')),
    notes TEXT,
    reminder BOOLEAN DEFAULT FALSE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_tasks table
CREATE TABLE application_tasks (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    reminder BOOLEAN DEFAULT FALSE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_tasks table
CREATE TABLE study_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    estimated_hours INTEGER DEFAULT 1,
    source VARCHAR(50) DEFAULT 'study' CHECK (source IN ('application', 'study')),
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    reminder BOOLEAN DEFAULT FALSE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table for comprehensive reminder management
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('study_task', 'application', 'application_task', 'custom')),
    reference_id VARCHAR(255), -- Can be study_task.id, application.id, or application_task.id
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_sent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB, -- For storing additional reminder data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_deadline ON applications(deadline);
CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_application_tasks_application_id ON application_tasks(application_id);
CREATE INDEX idx_application_tasks_due_date ON application_tasks(due_date);

CREATE INDEX idx_study_tasks_user_id ON study_tasks(user_id);
CREATE INDEX idx_study_tasks_date ON study_tasks(date);
CREATE INDEX idx_study_tasks_subject ON study_tasks(subject);
CREATE INDEX idx_study_tasks_priority ON study_tasks(priority);
CREATE INDEX idx_study_tasks_application_id ON study_tasks(application_id);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_type ON reminders(type);
CREATE INDEX idx_reminders_reminder_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_is_active ON reminders(is_active);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_tasks_updated_at BEFORE UPDATE ON application_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_tasks_updated_at BEFORE UPDATE ON study_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Applications policies
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- Application tasks policies
CREATE POLICY "Users can view tasks of their applications" ON application_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_tasks.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks to their applications" ON application_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_tasks.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks of their applications" ON application_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_tasks.application_id 
            AND applications.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks of their applications" ON application_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM applications 
            WHERE applications.id = application_tasks.application_id 
            AND applications.user_id = auth.uid()
        )
    );

-- Study tasks policies
CREATE POLICY "Users can view their own study tasks" ON study_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study tasks" ON study_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study tasks" ON study_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study tasks" ON study_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can view their own reminders" ON reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" ON reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" ON reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" ON reminders
    FOR DELETE USING (auth.uid() = user_id); 