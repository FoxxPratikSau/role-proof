INSERT INTO users (id, name, email, password_hash, role)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Test User',
    'test@example.com',
    '$2a$12$9z0LVgbFAXloTUBWXocc8uGtICxkJ2P8Orx/3gu5How2RQ4w4r0Bu',
    'user'
)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    updated_at = NOW();
