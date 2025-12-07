# AeroShield Database Migrations

This directory contains Alembic migration files for the AeroShield database.

## Setup

1. Ensure your database URL is configured in `.env`:
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@host/db
   ```

2. Initialize migrations (if not already done):
   ```bash
   uv run alembic init alembic
   ```

3. Generate a new migration:
   ```bash
   uv run alembic revision --autogenerate -m "Description of changes"
   ```

4. Apply migrations:
   ```bash
   uv run alembic upgrade head
   ```

5. Rollback migration:
   ```bash
   uv run alembic downgrade -1
   ```

## Migration Best Practices

- Always review auto-generated migrations before applying
- Test migrations on a staging database first
- Include both upgrade and downgrade functions
- Use descriptive migration names
