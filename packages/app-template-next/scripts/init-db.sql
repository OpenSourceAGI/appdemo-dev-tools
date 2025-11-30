-- Initialize the database with proper encoding and extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS auth;
-- CREATE SCHEMA IF NOT EXISTS public;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE startstack TO startstack_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO startstack_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO startstack_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO startstack_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO startstack_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO startstack_user; 