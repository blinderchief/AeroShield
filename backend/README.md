# AeroShield Backend

FastAPI backend for AeroShield - AI-Augmented Parametric Travel Insurance on Flare Network.

## Features

- 🔐 **Clerk Authentication** - Secure JWT-based authentication
- 🤖 **Gemini AI Integration** - Flight delay prediction and risk assessment
- 🔗 **Flare Network Integration** - FDC attestations and FTSO price feeds
- 📊 **PostgreSQL Database** - Async SQLAlchemy with Neon
- ⚡ **Redis Caching** - High-performance caching layer
- 🔄 **Celery Tasks** - Background job processing

## Quick Start

```bash
# Install dependencies
uv sync

# Copy environment file
cp .env.example .env

# Run database migrations
uv run alembic upgrade head

# Start the server
uv run uvicorn main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py              # Application entry point
├── core/                # Core configurations
│   ├── config.py        # Environment settings
│   ├── database.py      # SQLAlchemy async setup
│   ├── security.py      # Clerk JWT verification
│   └── redis.py         # Cache management
├── models/              # SQLAlchemy ORM models
├── schemas/             # Pydantic validation schemas
├── services/            # Business logic
│   ├── ai/              # Gemini AI services
│   ├── blockchain/      # Flare integration (FDC, FTSO)
│   └── insurance/       # Policy & claims management
├── api/v1/              # API routes
└── tests/               # Test suite
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
