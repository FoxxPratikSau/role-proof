CREATE TABLE resume_templates (
    id UUID PRIMARY KEY,
    owner_user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    slug VARCHAR(80),
    name VARCHAR(120) NOT NULL CHECK (char_length(trim(name)) > 0),
    description VARCHAR(500) NOT NULL DEFAULT '',
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('curated', 'uploaded')),
    source_filename VARCHAR(255),
    specification JSONB NOT NULL CHECK (jsonb_typeof(specification) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (source_type = 'curated' AND owner_user_id IS NULL AND slug IS NOT NULL)
        OR
        (source_type = 'uploaded' AND owner_user_id IS NOT NULL AND slug IS NULL)
    )
);

CREATE UNIQUE INDEX resume_templates_curated_slug_unique_idx
    ON resume_templates (slug)
    WHERE owner_user_id IS NULL;

CREATE INDEX resume_templates_owner_updated_idx
    ON resume_templates (owner_user_id, updated_at DESC)
    WHERE owner_user_id IS NOT NULL;

CREATE UNIQUE INDEX resume_templates_owner_name_unique_idx
    ON resume_templates (owner_user_id, lower(name))
    WHERE owner_user_id IS NOT NULL;

INSERT INTO resume_templates (
    id,
    slug,
    name,
    description,
    source_type,
    specification
)
VALUES
(
    '10000000-0000-4000-8000-000000000001',
    'ats-minimal',
    'ATS Minimal',
    'A restrained single-column structure optimized for parsing and fast recruiter scanning.',
    'curated',
    '{"schemaVersion":1,"style":"minimal","tone":"direct and evidence-led","sectionOrder":["summary","skills","experience","projects","education","optional"],"sectionHeadings":{"summary":"Summary","skills":"Skills","experience":"Experience","projects":"Projects","education":"Education"},"contentRules":["Prefer standard section headings","Use compact achievement bullets","Keep contact details as plain text","Avoid tables, columns, icons, and decorative labels"],"formattingRules":["Single column","High contrast typography","Conservative spacing"],"promptInstructions":"Write for a conservative ATS-first single-column resume. Use standard headings, compact evidence-led bullets, and straightforward language. Prioritize parseability and recruiter scan speed over visual novelty."}'::jsonb
),
(
    '10000000-0000-4000-8000-000000000002',
    'modern',
    'Modern',
    'A polished contemporary hierarchy with a concise profile and balanced section rhythm.',
    'curated',
    '{"schemaVersion":1,"style":"modern","tone":"confident and concise","sectionOrder":["summary","experience","skills","projects","education","optional"],"sectionHeadings":{"summary":"Profile","skills":"Capabilities","experience":"Experience","projects":"Selected Projects","education":"Education"},"contentRules":["Open with a short positioning profile","Lead bullets with outcomes","Group skills into readable categories","Keep section labels concise"],"formattingRules":["Single column","Clear visual hierarchy","Balanced whitespace"],"promptInstructions":"Write with a contemporary, confident voice. Open with a concise positioning profile, lead experience bullets with outcomes, and group capabilities for quick scanning while retaining ATS-safe structure."}'::jsonb
),
(
    '10000000-0000-4000-8000-000000000003',
    'technical',
    'Technical',
    'An engineering-focused format that foregrounds systems, scope, tools, and measurable outcomes.',
    'curated',
    '{"schemaVersion":1,"style":"technical","tone":"precise and technically rigorous","sectionOrder":["skills","experience","projects","summary","education","optional"],"sectionHeadings":{"summary":"Engineering Profile","skills":"Technical Skills","experience":"Engineering Experience","projects":"Technical Projects","education":"Education"},"contentRules":["Surface relevant technical skills early","Describe architecture and engineering decisions","Retain scale and reliability evidence","Prefer technically precise verbs"],"formattingRules":["Single column","Dense but readable","Technical categories before narrative sections"],"promptInstructions":"Write for a technical hiring panel. Surface relevant engineering capabilities early, describe architecture and non-obvious implementation decisions precisely, and preserve evidence about reliability, scale, performance, and ownership."}'::jsonb
),
(
    '10000000-0000-4000-8000-000000000004',
    'executive',
    'Executive',
    'A leadership-oriented narrative emphasizing scope, organizational influence, and strategic outcomes.',
    'curated',
    '{"schemaVersion":1,"style":"executive","tone":"strategic and authoritative","sectionOrder":["summary","experience","skills","education","projects","optional"],"sectionHeadings":{"summary":"Leadership Profile","skills":"Core Leadership Capabilities","experience":"Leadership Experience","projects":"Selected Initiatives","education":"Education"},"contentRules":["Lead with organizational scope and business purpose","Emphasize ownership, influence, and decisions","Prefer fewer higher-value bullets","Minimize implementation trivia"],"formattingRules":["Single column","Strong narrative hierarchy","Generous section separation"],"promptInstructions":"Write for leadership review. Emphasize scope, ownership, strategic decisions, organizational influence, and business purpose. Use fewer, higher-value bullets and minimize low-level implementation detail unless essential to the target role."}'::jsonb
);
