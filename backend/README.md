# Scheme Navigator Backend

Scheme Navigator Backend is the production-oriented FastAPI foundation for the Scheme Navigator project. It is intentionally built as a clean, layered backend that can serve the current CSV-based data source today and support future AI agents, databases, and external integrations later without changing the public API contract.

This phase does not implement any AI agents, prompt orchestration, LangChain, LangGraph, or OpenRouter logic. It only provides the backend infrastructure those components will use later.

## What This Backend Does

The application currently:

- starts a FastAPI server successfully,
- loads scheme data from a CSV file using pandas,
- caches the CSV load through a singleton loader,
- exposes REST endpoints for health checks, scheme browsing, scheme search, and survey intake,
- validates survey payloads with Pydantic,
- returns a standard JSON response shape for all endpoints,
- logs incoming requests, repository access, validation success, response completion, and server errors,
- handles errors centrally without exposing Python stack traces to clients,
- ships with pytest coverage for the repository, health endpoint, search endpoint, and survey validation.

## Tech Stack

- Python 3.12+
- FastAPI
- pandas
- python-dotenv
- Pydantic
- httpx
- Python logging
- pytest

## Project Layout

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── agents/
│   ├── graph/
│   ├── prompts/
│   ├── utils/
│   └── tests/
├── data/
│   └── schemes.csv
├── .env
├── .gitignore
├── main.py
├── README.md
└── requirements.txt
```

## Architecture

The backend follows a layered architecture:

```text
FastAPI Routes -> Service Layer -> Repository Layer -> CSV Data
```

Rules enforced by the design:

- Routes never read CSV files directly.
- Services never use pandas.
- Repositories are the only layer that understands CSV loading and caching.
- The repository returns Python objects, not raw DataFrames.
- Business logic stays in services.
- Data access stays in repositories.

## Current CSV Schema

The repository is aligned to the current `data/schemes.csv` file. The active columns are:

- `scheme_name`
- `slug`
- `details`
- `benefits`
- `eligibility`
- `application`
- `documents`
- `level`
- `schemeCategory`
- `tags`

Notes:

- `slug` is treated as the scheme identifier for lookup endpoints.
- The CSV may contain an extra empty column in some rows; the loader normalizes that safely.

## Data Model

### Scheme

The public scheme object includes the current CSV fields:

- `scheme_name`
- `slug`
- `details`
- `benefits`
- `eligibility`
- `application`
- `documents`
- `level`
- `scheme_category`
- `tags`

### SurveyRequest

The survey request model validates citizen profile input before the backend does any future eligibility work.

Fields:

- `age`
- `gender`
- `state`
- `district`
- `area`
- `category`
- `minority`
- `disability`
- `disability_percentage`
- `employment_status`
- `occupation`
- `bpl`
- `annual_income`

Validation rules:

- age cannot be negative,
- income cannot be negative,
- disability percentage must be between 0 and 100,
- required text fields cannot be empty or whitespace.

### Standard API Response

Every endpoint returns the same response envelope:

```json
{
	"success": true,
	"message": "...",
	"data": {}
}
```

This consistent shape makes client-side handling easier and leaves room for future metadata.

## Configuration

Configuration is loaded from `.env` using `python-dotenv`.

Supported environment variables:

- `OPENROUTER_API_KEY`
- `MODEL_NAME`
- `LOG_LEVEL`
- `CSV_PATH`

The current phase only uses `LOG_LEVEL` and `CSV_PATH`, but the other variables are already prepared for the next phase.

Default `.env` values:

```env
OPENROUTER_API_KEY=
MODEL_NAME=
LOG_LEVEL=INFO
CSV_PATH=data/schemes.csv
```

## Logging

The backend uses Python logging and emits structured operational messages for:

- incoming requests,
- validation success,
- repository calls,
- responses sent,
- server errors.

Logs are configured centrally in `app/core/logging.py` and activated during app startup.

## Error Handling

Global exception handlers are registered for:

- 400 bad requests,
- 404 not found,
- 422 validation errors,
- 500 unexpected server errors.

All errors are returned in the standard response envelope. Internal stack traces are never exposed to the client.

## API Endpoints

### `GET /`

Purpose: confirms the backend is running.

Response:

```json
{
	"success": true,
	"message": "Backend Running",
	"data": {
		"status": "Backend Running"
	}
}
```

### `GET /health`

Purpose: returns application status, CSV readiness, and a current timestamp.

Response includes:

- application status,
- whether the CSV has been loaded,
- UTC timestamp of the health check.

### `GET /schemes`

Purpose: returns every scheme from the CSV.

This endpoint reads from the service layer, which delegates to the repository.

### `GET /schemes/{id}`

Purpose: returns one scheme by identifier.

Current identifier behavior:

- the route parameter is matched against `slug`.

### `GET /schemes/search`

Purpose: searches schemes with a generic filter interface that future agents can use without knowing the CSV layout.

Accepted query parameters:

- `keyword`
- `level`
- `scheme_category`
- `tag`

Behavior:

- `keyword` performs a case-insensitive partial search across `scheme_name`, `details`, `benefits`, `eligibility`, `application`, `documents`, `scheme_category`, and `tags`.
- `level` filters by the `level` column.
- `scheme_category` filters by the `schemeCategory` column.
- `tag` searches inside the tags array.
- all filters are case-insensitive, trimmed, partial, and combined with AND logic.

Examples:

```text
/schemes/search?keyword=odisha
/schemes/search?keyword=passport
/schemes/search?tag=Scholarship
/schemes/search?keyword=student&level=State&scheme_category=Education&tag=Scholarship
```

### `POST /survey`

Purpose: accepts and validates citizen survey data.

Current behavior:

- validates the payload,
- logs validation success,
- echoes the received data,
- does not run AI or eligibility logic yet.

## Repository Layer
							
`SchemeRepository` is the only layer that knows how the CSV works.

Responsibilities:

- load the CSV using pandas,
- cache the loaded DataFrame through a singleton loader,
- normalize column names and empty columns,
- convert rows into `Scheme` objects,
- implement `load_all()`, `find_by_id()`, `find_by_scheme_name()`, `filter()`, and `search()`.

### Caching

The CSV is loaded once per file path and reused from memory after startup. This avoids re-reading the file for every request.

## Service Layer

`SchemeService` contains business logic only.

Responsibilities:

- warm up the repository on startup,
- expose scheme retrieval methods to the API layer,
- provide survey validation hooks,
- keep pandas and CSV concerns out of the route layer.

## Tests

Pytest coverage currently includes:

- repository CSV loading,
- repository search behavior,
- survey model validation,
- health endpoint behavior,
- search endpoint behavior.

Run tests from the backend directory:

```bash
python -m pytest -q
```

## Installation

From the `backend/` directory:

```bash
pip install -r requirements.txt
```

## Run Locally

```bash
uvicorn main:app --reload
```

If you prefer to be explicit about Python:

```bash
python -m uvicorn main:app --reload
```

The server will usually be available at:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

## Example Requests

### Health Check

```bash
curl http://127.0.0.1:8000/health
```

### Get All Schemes

```bash
curl http://127.0.0.1:8000/schemes
```

### Search Schemes

```bash
curl "http://127.0.0.1:8000/schemes/search?level=State"
```

### Submit Survey

```bash
curl -X POST http://127.0.0.1:8000/survey \
	-H "Content-Type: application/json" \
	-d '{
		"age": 28,
		"gender": "Female",
		"state": "Kerala",
		"district": "Ernakulam",
		"area": "Urban",
		"category": "General",
		"minority": false,
		"disability": false,
		"disability_percentage": 0,
		"employment_status": "Employed",
		"occupation": "Software Engineer",
		"bpl": false,
		"annual_income": 500000
	}'
```

## Extending the Project

This backend is designed to be extended in later phases.

Likely next additions:

- eligibility evaluation services,
- agent orchestration layer,
- graph workflows,
- prompt templates,
- external API integrations,
- persistence beyond CSV,
- richer search and filtering,
- audit logging,
- authentication and authorization.

## Notes for Contributors

- Keep route logic thin.
- Keep CSV parsing in the repository layer.
- Keep business decisions in services.
- Preserve the standard response format.
- Avoid adding AI logic in this phase.

## Troubleshooting

### CSV does not load

Check that `CSV_PATH` in `.env` points to an existing file and that the file is readable.

### Endpoint returns validation errors

Inspect the request body against the `SurveyRequest` schema and ensure numeric fields are not negative.

### Tests fail after changing the CSV

Update the repository mapping and any tests that create fixture CSV rows so they match the new column structure.

## Current Status

The backend is functional, the CSV loads successfully, and the test suite passes.
