# SchemeNavigator

SchemeNavigator is a government scheme discovery platform focused on making public welfare programs easier to browse, search, and evaluate. The project currently provides a FastAPI backend that loads scheme data from a CSV file, exposes REST APIs for lookup and search, and validates citizen survey intake data as a foundation for future AI-driven recommendation workflows.

## Overview

This repository is organized around a clean backend-first architecture:

- A FastAPI application serves the public API.
- Scheme metadata is stored in a CSV and loaded via a repository layer.
- Services handle business logic without exposing CSV or pandas concerns to routes.
- Survey payloads are validated with Pydantic before any future eligibility logic is added.
- The structure is designed to support later phases with recommendation agents, graph workflows, and richer AI-assisted matching.

## Current Capabilities

The application currently supports:

- health checks and service status endpoints
- listing all schemes
- retrieving a scheme by slug
- searching schemes by keyword, level, category, and tags
- validating citizen survey submissions
- centralized error handling and standard JSON responses
- CSV-backed data loading with in-memory caching

## Project Structure

```text
SchemeNavigator-main/
├── README.md
├── main.py
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   ├── main.py
│   ├── data/
│   │   └── schemes.csv
│   └── app/
│       ├── agents/
│       ├── api/
│       ├── core/
│       ├── graph/
│       ├── models/
│       ├── prompts/
│       ├── repositories/
│       ├── services/
│       ├── tests/
│       └── utils/
└── config/
    └── api_config.json
```

## Tech Stack

- Python 3.12+
- FastAPI
- Pydantic
- pandas
- python-dotenv
- httpx
- pytest

## Getting Started

### 1. Create a virtual environment

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```bash
pip install -r backend/requirements.txt
```

### 3. Run the app

From the project root:

```bash
python main.py
```

Or, from the backend directory:

```bash
cd backend
python -m uvicorn main:app --reload
```

The API is available at:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/redoc

## Main API Endpoints

- `GET /` — application status
- `GET /health` — health payload with CSV readiness and timestamp
- `GET /schemes` — list all schemes
- `GET /schemes/{id}` — fetch a scheme by slug
- `GET /schemes/search` — filter schemes by keyword, level, category, or tags
- `POST /survey` — submit and validate a citizen survey

## Data Model

The current CSV-backed scheme repository stores fields such as:

- scheme name
- slug
- details
- benefits
- eligibility
- application
- documents
- level
- scheme category
- tags

The survey schema validates profile details like age, income, disability status, employment status, and other citizen information relevant for future eligibility matching.

## Architecture

The codebase follows a layered structure:

```text
FastAPI routes -> services -> repositories -> CSV data source
```

This keeps CSV parsing and storage concerns isolated from API logic and makes it easier to evolve into future AI or graph-driven recommendation flows without breaking the public API contract.

## Future Direction

The project is intentionally structured to support later phases such as:

- eligibility recommendation services
- AI-powered scheme matching
- graph-based workflow orchestration
- prompt-driven reasoning
- richer persistence and integration layers

## Additional Documentation

For deeper backend implementation details, API behavior, and local setup notes, see [backend/README.md](backend/README.md).

## Contributing

Keep route logic thin, keep data access in repositories, and preserve the standard API response envelope when adding new endpoints or services.
