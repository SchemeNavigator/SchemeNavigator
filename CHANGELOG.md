# SchemeNavigator Change Log

This file records the project changes completed during the earlier backend repair and workflow-hardening sessions.

## 2026-08-26

### Backend Stabilization

- Resolved the backend issues reported during the initial repair session.
- Verified the backend test suite with `pytest backend -q`.
- Confirmed 84 backend tests passed and no editor diagnostics were reported.
- Kept remaining deprecation warnings separate from runtime failures.

### Workflow Reliability

- Increased the workflow timeout to 180 seconds.
- Added production token limits and increased output budgets for intent, planner, and verification stages.
- Reduced recommendation prompt candidates to 8 to control request size.
- Tightened planner and recommendation prompts to reduce truncated responses.
- Added bounded retries for transient provider failures and schema-correction failures.
- Preserved valid recommendations when confidence filtering would otherwise return no results.

### Eligibility and Recommendation Safety

- Added deterministic eligibility classification with `eligible`, `ineligible`, and `unknown` states.
- Inserted an eligibility gate before LLM recommendation ranking.
- Prevented known-ineligible schemes from reaching recommendation ranking.
- Added final eligibility filtering before results are returned.
- Removed the unsafe fallback that returned all low-confidence recommendations.
- Added compact prompt projections and centralized token-limit handling.
- Made production verification mandatory before reporting `success=true`.

### API and Configuration

- Updated recommendation service and workflow response handling to expose completed workflow status consistently.
- Updated API configuration for the longer workflow timeout and production limits.
- Improved handling of provider connection resets through one bounded retry.

### Validation

- Added focused tests for eligibility behavior, recommendation parsing, planner metadata, rate-limit handling, runtime imports, and offline workflow execution.
- Later validation reached 87 passing backend tests with no code errors reported.
- Live workflow validation completed successfully with:
  - `success: true`
  - `workflow_status: completed`
  - planner output present
  - verification output present
  - recommendations generated successfully
  - cautious final verdict returned correctly

## Main Areas Changed

- Planner models, nodes, and prompts
- Verification models, validators, agent, and prompts
- Eligibility gate and eligibility node
- Workflow state, builder, engine, routing, and execution management
- Intent and recommendation nodes
- LLM service, model factory, output parser, and exception handling
- Recommendation service and API configuration
- Focused backend and graph test coverage
