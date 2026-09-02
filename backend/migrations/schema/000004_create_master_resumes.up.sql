CREATE TABLE master_resumes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL DEFAULT 'Master resume' CHECK (char_length(trim(title)) > 0),
    content JSONB NOT NULL CHECK (jsonb_typeof(content) = 'object'),
    selected_template_id UUID REFERENCES resume_templates (id) ON DELETE SET NULL,
    schema_version SMALLINT NOT NULL DEFAULT 1 CHECK (schema_version > 0),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
