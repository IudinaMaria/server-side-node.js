CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- =====================
-- ROLES (admin, manager, user)
-- =====================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- =====================
-- PERMISSIONS (CRUD actions)
-- =====================
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) UNIQUE NOT NULL
);

-- =====================
-- MANY-TO-MANY: role <-> permissions
-- =====================
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =====================
-- MANY-TO-MANY: user <-> roles
-- =====================
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- =====================
-- INITIAL DATA
-- =====================

INSERT INTO roles (name) VALUES
    ('admin'),
    ('user');

INSERT INTO permissions (action) VALUES
    ('CREATE_TODO'),
    ('DELETE_TODO'),
    ('UPDATE_TODO'),
    ('VIEW_ALL_TODOS');

-- admin can do everything:
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- user can only create and update his tasks:
INSERT INTO role_permissions (role_id, permission_id)
VALUES
    (2, 1), -- CREATE_TODO
    (2, 3); -- UPDATE_TODO