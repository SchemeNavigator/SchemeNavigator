# PHASE 9.2A — LLM CALL GRAPH & WORKFLOW DEPENDENCY AUDIT

**OPENROUTER REQUESTS USED: 0**  
**PRODUCTION FILES MODIFIED: 0**

---

## 1. EXECUTIVE SUMMARY

This audit statically inspects the Scheme Navigator multi-agent backend's workflow graph, LLM call patterns, and dependency management without invoking any external services or modifying production code.

### Key Findings:
- **7 workflow nodes** in the configured sequence
- **4 LLM-backed nodes** (intent_extraction, recommendation, planner, verification)
- **3 non-LLM nodes** (query_expansion, repository_retrieval, response_builder)
- **Minimum OpenRouter requests per workflow: 4** (one per LLM-backed node)
- **Expected requests: 4** (no errors, no retries)
- **Worst-case requests: 8** (all 4 LLM nodes hit JSONParsingError and retry once)
- **Configured workflow timeout: 60 seconds** (minimum of api_config.timeout_seconds and maximum_execution_time_seconds)
- **Per-LLM-call timeout: 30 seconds** (LLM_TIMEOUT environment variable, applied at HTTP level)
- **Critical Finding:** Minimal/default prompts for 3 of 4 LLM-backed nodes; full implementation in planner/ and verification/ agents not yet complete

---

## 2. NODE INVENTORY

| Node Name | Source File | Registered? | In Sequence? | LLM? | Repository? | Retry Risk | Next Node? | Self-Loop Risk |
|-----------|-------------|------------|------------|------|-------------|-----------|-----------|---|
| intent_extraction | backend/app/graph/intent_node.py | YES | YES | YES | NO | YES (parse) | explicit | NO |
| query_expansion | backend/app/graph/query_expansion_node.py | YES | YES | NO | NO | NO | implicit | NO |
| repository_retrieval | backend/app/graph/repository_retrieval_node.py | YES | YES | NO | YES | NO | explicit | NO |
| recommendation | backend/app/graph/recommendation_node.py | YES | YES | YES | NO | YES (parse) | explicit | NO |
| planner | backend/app/agents/planner/planner_agent.py | NO* | YES | YES | NO | YES (parse) | implicit | NO |
| verification | backend/app/agents/verification/verification_agent.py | NO* | YES | YES | NO | YES (parse) | implicit | NO |
| response_builder | backend/app/graph/response_builder.py | NO | YES | NO | NO | NO | implicit | NO |

\* `planner` and `verification` are handled as special cases in ExecutionManager.execute_node() (lines 57-76), not registered in NodeRegistry.

### Node Execution Paths:

**Registered nodes** (imported and registered in WorkflowEngine.__init__):
- IntentExtractionNode
- QueryExpansionNode
- RepositoryRetrievalNode
- RecommendationNode

**Non-registered agents** (handled via ExecutionManager special logic):
- PlannerAgentImpl (backend/app/agents/planner/planner_agent.py:PlannerAgentImpl)
- VerificationAgent (backend/app/agents/verification/verification_agent.py:VerificationAgent)

**Pure utility** (no special instantiation):
- ResponseBuilder (backend/app/graph/response_builder.py:ResponseBuilder)

---

## 3. LLM CALL MAP

### 3.1 Intent Extraction Node

**Source:** [backend/app/graph/intent_node.py](backend/app/graph/intent_node.py#L60)  
**LLM Call:**
```python
intent: IntentResult = llm.generate_json("intent", variables, IntentResult)
```

**Call Method:** `LLMService.generate_json()`  
**Prompt Name:** `"intent"` (loaded from intent.md; fallback to default prompt)  
**Pydantic Schema:** [IntentResult](backend/app/graph/intent_node.py#L15-L24)

**Output Schema Validation:**
```python
class IntentResult(BaseModel):
    user_profile_summary: str
    repository_query: RepositoryQueryOutput  # keywords, categories, tags, levels, filters
    confidence: float
    missing_information: list[str]
    reasoning: Optional[str]
```

**Direct LLM Calls:** 1  
**Internal Retries:** 1 (JSONParsingError triggers auto-retry in OutputParser.parse())  
**Maximum Requests:** 2

**Exception Handling:**
- `JSONParsingError` → logs warning, retries once (line 112)
- Other exceptions → appends to state.errors, returns state (line 117)

---

### 3.2 Query Expansion Node

**Source:** [backend/app/graph/query_expansion_node.py](backend/app/graph/query_expansion_node.py#L74)

**NO LLM CALL.** This node is deterministic:
- Loads keywords from intent.keywords and user_profile_summary
- Normalizes via lowercase, punctuation removal
- Removes stopwords (deterministic list from stopwords.json)
- Applies synonym expansion (deterministic dict from synonyms.json)
- Applies category expansion (deterministic dict from category_map.json)
- Applies tag expansion (deterministic dict from tag_map.json)
- Produces weighted keywords with priority scoring

**Executes in milliseconds.** No external service calls.

---

### 3.3 Repository Retrieval Node

**Source:** [backend/app/graph/repository_retrieval_node.py](backend/app/graph/repository_retrieval_node.py#L18)

**NO LLM CALL.** Pure repository access:
- Builds expanded query from state.repository_query
- Calls RetrievalEngine.retrieve() (backend/app/graph/retrieval_engine.py)
- RetrievalEngine performs deterministic keyword/filter matching against CSV
- Returns candidate_schemes (list of Scheme objects)

**Direct Repository Calls:** 1  
**No retries, no external services.**

---

### 3.4 Recommendation Node

**Source:** [backend/app/graph/recommendation_node.py](backend/app/graph/recommendation_node.py#L68)  
**LLM Call:**
```python
result: RecommendationResult = llm.generate_json("recommendation", variables, RecommendationResult)
```

**Call Method:** `LLMService.generate_json()`  
**Prompt Name:** `"recommendation"` (default prompt from PromptManager; no file)  
**Pydantic Schema:** [RecommendationResult](backend/app/graph/recommendation_models.py#L16-L28)

**Output Schema Validation:**
```python
class RecommendationResult(BaseModel):
    recommendations: list[RecommendationEntry]  # each entry: scheme_id, scheme_name, overall_score, confidence, reason, etc.
    summary: Optional[str]
    overall_confidence: float
    limitations: list[str]
    missing_information: list[str]
```

**Direct LLM Calls:** 1  
**Internal Retries:** 1 (JSONParsingError triggers auto-retry in OutputParser.parse())  
**Maximum Requests:** 2

**Additional Validation:**
- Post-parse deterministic validation: [_validate_recommendation_result](backend/app/graph/recommendation_node.py#L46) checks for duplicates, score ranges [0-100], confidence ranges [0-1], applies min_score and min_confidence thresholds

**Exception Handling:**
- `JSONParsingError` → logs, retries once, on second failure sets next_node=None (line 75)
- Validation errors → sets next_node=None (line 87)
- Other LLM errors → appends to state.errors (line 79)

---

### 3.5 Planner Agent

**Source:** [backend/app/agents/planner/planner_agent.py](backend/app/agents/planner/planner_agent.py#L41)  
**LLM Call:**
```python
detailed: PlannerResultDetailed = llm.generate_json("planner", variables, PlannerResultDetailed)
```

**Call Method:** `LLMService.generate_json()`  
**Prompt Name:** `"planner"` (default prompt from PromptManager; no file)  
**Pydantic Schema:** [PlannerResultDetailed](backend/app/agents/planner/planner_models.py#L18-L32)

**Output Schema Validation:**
```python
class PlannerResultDetailed(BaseModel):
    application_roadmap: list[RoadmapStep]  # step, title, description, estimated_time_minutes, dependencies, completion_criteria
    timeline: list[dict[str, Any]]
    required_documents: list[dict[str, Any]]
    document_descriptions: dict[str, str]
    eligibility_summary: Optional[str]
    estimated_effort: Optional[str]
    estimated_duration: Optional[str]
    warnings: list[str]
    tips: list[str]
    common_mistakes: list[str]
    next_action: Optional[str]
    application_summary: Optional[str]
```

**Direct LLM Calls:** 1  
**Internal Retries:** 1 (JSONParsingError triggers auto-retry)  
**Maximum Requests:** 2

**Additional Deterministic Stages:**
1. extract_scheme_context() — deterministic (backend/app/agents/planner/scheme_extractor.py)
2. build_timeline() — deterministic (backend/app/agents/planner/timeline_builder.py)
3. validate_roadmap() — deterministic (backend/app/agents/planner/roadmap_validator.py)

**Exception Handling:**
- `JSONParsingError` → logs, retries once, on second failure appends to state.errors (line 55)
- Validation errors → appends to state.errors (line 59)
- Other LLM errors → appends to state.errors (line 61)

---

### 3.6 Verification Agent

**Source:** [backend/app/agents/verification/verification_agent.py](backend/app/agents/verification/verification_agent.py#L58)  
**LLM Call:**
```python
result: VerificationResult = llm.generate_json("verification", variables, VerificationResult)
```

**Call Method:** `LLMService.generate_json()`  
**Prompt Name:** `"verification"` (default prompt from PromptManager; no file)  
**Pydantic Schema:** [VerificationResult](backend/app/agents/verification/models.py#L36-L50)

**Output Schema Validation:**
```python
class VerificationResult(BaseModel):
    overall_readiness_score: float
    overall_confidence: float
    audit_summary: Optional[str]
    consistency_assessment: ConsistencyReport
    eligibility_assessment: EligibilityAssessment
    document_assessment: DocumentReport
    workflow_assessment: WorkflowReport
    identified_risks: list[str]
    identified_limitations: list[str]
    recommended_actions: list[str]
    missing_information: list[str]
    final_verdict: str
```

**Direct LLM Calls:** 1  
**Internal Retries:** 1 (JSONParsingError triggers auto-retry)  
**Maximum Requests:** 2

**Additional Deterministic Stages:**
1. consistency_validator() — deterministic (backend/app/agents/verification/validators.py)
2. eligibility_validator() — deterministic
3. document_validator() — deterministic
4. workflow_validator() — deterministic

**Exception Handling:**
- `JSONParsingError` → logs, retries once, on second failure appends to state.errors (line 74)
- Other LLM errors → appends to state.errors (line 76)

---

### 3.7 Response Builder

**Source:** [backend/app/graph/response_builder.py](backend/app/graph/response_builder.py#L1)

**NO LLM CALL.** Pure data aggregation:
- Combines state.ranked_schemes, state.planner_output, state.verification_output
- Returns WorkflowResult (simple Pydantic aggregation)

---

## 4. REQUEST COUNT ANALYSIS

### Minimum Requests: 4

**Scenario:** All nodes execute successfully, no parsing errors.

| Node | LLM Calls |
|------|-----------|
| intent_extraction | 1 |
| query_expansion | 0 |
| repository_retrieval | 0 |
| recommendation | 1 |
| planner | 1 |
| verification | 1 |
| **TOTAL** | **4** |

---

### Expected Requests: 4

**Assumption:** No transient failures. This is the standard path for a healthy workflow.

Accounts for:
- No JSONParsingError (models parse cleanly on first attempt)
- No rate limiting
- No model unavailability

---

### Worst-Case Requests: 8

**Scenario:** All 4 LLM-backed nodes encounter JSONParsingError on first attempt and successfully retry.

| Node | First Call | Retry (parsing error) | Total |
|------|-----------|----------------------|-------|
| intent_extraction | 1 | 1 | 2 |
| query_expansion | 0 | 0 | 0 |
| repository_retrieval | 0 | 0 | 0 |
| recommendation | 1 | 1 | 2 |
| planner | 1 | 1 | 2 |
| verification | 1 | 1 | 2 |
| **TOTAL** | **4** | **4** | **8** |

### Calculation Notes:

1. **No cascading retries across nodes:** The ExecutionManager retry policy (config.retry_policy) defaults to `{"default": {"retry": False}}` (line 26 of execution_manager.py). So no node-level retry loop.

2. **Single automatic retry per LLM-backed node:** LLMService.generate_json() catches JSONParsingError, logs "retrying once", and re-calls generate() (line 111 of llm_service.py). This is **per-node**, not per-workflow.

3. **No workflow-level timeout consuming extra requests:** asyncio.wait_for() wraps the entire workflow with a timeout but does not automatically retry.

4. **Workflow can terminate early:** If a non-recoverable error is encountered (e.g., LLMService unavailable), the workflow stops. No subsequent nodes execute.

---

## 5. ROUTING GRAPH

### 5.1 Configured Sequence

[WorkflowBuilder.default_sequence()](backend/app/workflow_builder.py#L10):
```python
[
    "intent_extraction",
    "query_expansion",
    "repository_retrieval",
    "recommendation",
    "planner",
    "verification",
    "response_builder",
]
```

### 5.2 Execution Flow (ExecutionManager.run())

```python
current = start_node  # "intent_extraction"
while current is not None:
    result = execute_node(current, state)
    
    if result.execution_status == "failed" and result.retry:
        # Single retry (default policy: retry=False)
        result = execute_node(current, state)
    
    next_node, trace = router.decide(state)
    current = next_node
```

[ExecutionManager.run()](backend/app/graph/execution_manager.py#L93) at line 104.

### 5.3 Explicit Next Node Assignments

Each LLM-backed node and repository_retrieval node explicitly sets `state.next_node`:

| Node | Assignment | Location | Value |
|------|-----------|----------|-------|
| intent_extraction | explicit | [line 109](backend/app/graph/intent_node.py#L109) | `state.next_node = "repository_retrieval"` (overrides default) |
| query_expansion | implicit | [line 161](backend/app/graph/query_expansion_node.py#L161) | (writes to state.repository_query, no next_node assignment) |
| repository_retrieval | explicit | [line 52](backend/app/graph/repository_retrieval_node.py#L52) | `state.next_node = "recommendation"` |
| recommendation | explicit | [line 121](backend/app/graph/recommendation_node.py#L121) | `state.next_node = "planner"` |
| planner | implicit | implicit return | (no explicit assignment, router.decide() provides next_node) |
| verification | implicit | implicit return | (no explicit assignment, router.decide() provides next_node) |
| response_builder | implicit | implicit return | (no explicit assignment) |

### 5.4 Conditional Routing (ConditionalRouter.decide())

[ConditionalRouter.decide()](backend/app/graph/conditional_router.py#L32) applies these rules in order:

1. **Non-recoverable error check** (line 37):
   - If any error in state.errors has `recoverable=False`, return `(None, trace)` → **terminate workflow**

2. **Research confidence check** (line 44):
   - If `state.intent.confidence < threshold` (default 0.6):
     - `on_low_confidence="retry"` → return `(current_node, trace)` → **retry current node**
     - `on_low_confidence="ask"` → return `("ask_additional_info", trace)`
     - `on_low_confidence="terminate"` → return `(None, trace)` → **terminate**

3. **Verification readiness shortcut** (line 56):
   - If `state.verification_output.verification_status == "Ready"`:
     - return `("response_builder", trace)` → **skip planner**

4. **Default continue** (line 59):
   - return `(state.next_node or None, trace)` → **use explicit next_node or terminate if None**

### 5.5 Termination Conditions

**Workflow terminates when `current_node` becomes `None`:**

- Explicitly set by a node (recommendation or verification errors)
- Router decides to terminate (non-recoverable error or low confidence + terminate policy)
- state.next_node is None and router defaults to None

---

## 6. LOOP ANALYSIS

### 6.1 Self-Loop Risk (Node → Same Node)

**Checked condition:** Router can return `(state.current_node, trace)` on low confidence retry.

**Risk Level:** **MEDIUM** (controlled by configuration)

**Mechanism:**
- ConditionalRouter.decide() line 49: `return state.current_node, DecisionTrace(...)`
- Only triggered if `state.intent.confidence < 0.6` AND `on_low_confidence="retry"`
- Default config.get("on_low_confidence", "retry") = `"retry"` (line 23)

**Mitigation:**
- No automatic infinite loop because retry retry happens at router level, not node level
- Retry is decided by confidence threshold, which is state-dependent
- If confidence increases (or error is non-recoverable), loop breaks

**Current Code (line 37):**
```python
for err in getattr(state, "errors", []) or []:
    if getattr(err, "recoverable", False) is False:
        return None, trace  # Terminate, prevent loop
```

**Verified:** No node sets `recoverable=False` and then also sets `confidence < 0.6`, so self-loop would terminate on non-recoverable errors.

### 6.2 Multi-Node Loop Risk (A → B → A)

**Checked condition:** Can any node cycle back to a previous node?

**Analysis:**
- intent_extraction → repository_retrieval (line 109 of intent_node.py)
- query_expansion → implicit (no assignment)
- repository_retrieval → recommendation (line 52 of repository_retrieval_node.py)
- recommendation → planner (line 121 of recommendation_node.py)
- planner → implicit
- verification → implicit
- response_builder → implicit

**Backward edges:** None. All transitions are forward or to end.

**Risk Level:** **NONE**

### 6.3 Unknown Node Risk (A → unknown_node)

**Checked condition:** Can a node set next_node to an unregistered name?

- intent_extraction sets: `"repository_retrieval"` ✓ registered
- repository_retrieval sets: `"recommendation"` ✓ registered
- recommendation sets: `"planner"` ✗ not registered (handled as special case)
- planner/verification/response_builder: implicit (use router)

**Risk:** `planner` is not registered but is handled in ExecutionManager.execute_node() lines 57-68.

```python
if node_name == "planner":
    from ..agents.planner.planner_agent import PlannerAgentImpl
    agent = PlannerAgentImpl(self.context)
    ...
elif node_name == "verification":
    from ..agents.verification.verification_agent import VerificationAgent
    agent = VerificationAgent(self.context)
    ...
else:
    raise KeyError(f"Unknown node: {node_name}")
```

**Risk Level:** **LOW** — Special handling in place, but should be registered in NodeRegistry for consistency.

### 6.4 Stale Next Node Risk

**Known history:** Phase 9 previously identified stale-next-node loops in research/repository_retrieval/recommendation.

**Current code inspection:**

**Explicit assignments prevent stale state:**
- intent_extraction explicitly sets next_node to "repository_retrieval" (overrides any prior state)
- repository_retrieval explicitly sets next_node to "recommendation"
- recommendation explicitly sets next_node to "planner"

**Verified:** All LLM-backed nodes that could have stale state from prior workflow iterations now explicitly set next_node, preventing reuse of old state.

**Risk Level:** **LOW** (mitigated by explicit assignments)

### 6.5 Null Node Risk (A → None)

**Checked condition:** Can next_node become None prematurely?

**Yes, by design:**
- recommendation node sets `state.next_node = None` on JSONParsingError retry failure (line 78)
- recommendation node sets `state.next_node = None` on validation failure (line 88)
- verification node does NOT set next_node (relies on router)
- router returns None on non-recoverable errors

**Risk Level:** **NONE** — By design, terminates workflow appropriately.

---

## 7. TIMEOUT ANALYSIS

### 7.1 Timeout Configuration

**Workflow-Level Timeout:**
- **Source:** [api_config.json](backend/config/api_config.json)
- **Value:** `timeout_seconds: 60` (default)
- **Also configured:** `maximum_execution_time_seconds: 120`
- **Used in:** [RecommendationService.__init__()](backend/app/services/recommendation_service.py#L107)

```python
self._workflow_timeout_seconds = max(
    0.1,
    min(float(api_config.timeout_seconds), float(api_config.maximum_execution_time_seconds)),
)
# = min(60, 120) = 60 seconds
```

**Applied in:** [RecommendationService.recommend()](backend/app/services/recommendation_service.py#L175)

```python
final_state = await asyncio.wait_for(
    asyncio.to_thread(self.workflow_engine.run, state),
    timeout=self._workflow_timeout_seconds,  # 60 seconds
)
```

---

**Per-LLM-Call Timeout:**
- **Source:** [backend/app/core/config.py](backend/app/core/config.py#L87)
- **Value:** `LLM_TIMEOUT` environment variable, default 30 seconds
- **Applied in:** [ModelFactory.create()](backend/app/llm/model_factory.py#L133)

```python
timeout_val = timeout or int(os.getenv("LLM_TIMEOUT", "30"))
# Passed to OpenRouterHTTPWrapper(timeout=timeout_val)
```

**Used in:** [OpenRouterHTTPWrapper.generate()](backend/app/llm/model_factory.py#L70)

```python
r = self._httpx.post(url, json=payload, headers=headers, timeout=self.timeout)
# httpx timeout at HTTP layer
```

---

### 7.2 Timeout Scope

| Timeout | Scope | Applies To |
|---------|-------|-----------|
| 60 seconds | Workflow level | Entire workflow execution (all nodes, all LLM calls) |
| 30 seconds | HTTP layer | Each individual OpenRouter API call |

**Per-node timeout:** NONE. Nodes execute synchronously within the 60-second workflow budget.

---

### 7.3 Theoretical Compatibility Check

**Known real measurement:**
- Intent Extraction ≈ 21.37 seconds (measured in Phase 9.1)

**Theoretical calculation (sequential LLM calls):**

```
intent_extraction:        ~21 sec
+ query_expansion:        ~0.1 sec (deterministic)
+ repository_retrieval:   ~0.1 sec (deterministic)
+ recommendation:         ~21 sec (similar to intent extraction)
+ planner:                ~21 sec (similar to intent extraction)
+ verification:           ~21 sec (similar to intent extraction)
+ response_builder:       ~0.1 sec (deterministic)
+ network/parsing/state:  ~2 sec (overhead)
= ~106 seconds total (ESTIMATE)
```

**But:** 
- The 4 LLM calls are sequential, not parallel
- Worst case (with retries) = 8 LLM calls × 21 sec = 168 seconds

**Timeout Status:** 

✅ **MINIMUM workflow (4 sequential calls ≈ 87 sec):** EXCEEDS 60-second workflow timeout by ~27 seconds

⚠️ **WORST-CASE workflow (8 calls with all retries ≈ 168 sec):** EXCEEDS 60-second timeout by ~108 seconds

### 7.4 Critical Finding: Timeout Mismatch

**Issue:** The 60-second workflow timeout is insufficient for 4 sequential LLM calls averaging ~21 seconds each.

**Evidence:**
- Real measurement: 21.37 sec for intent extraction alone
- Estimated total: 87 sec minimum (without retries)
- Configured limit: 60 sec
- Shortfall: -27 sec

**Impact:**
- Workflow will timeout after ~60 seconds
- Partial workflows (failing at recommendation, planner, or verification stage) could be cut off
- Retries will rarely complete within timeout
- User receives HTTP 503 (WorkflowTimeoutError)

**Recommendation:** Increase workflow timeout to ≥120 seconds (or ≥180 seconds with retry buffer).

---

## 8. SCHEMA CONTRACT AUDIT

### 8.1 Intent Extraction

**Prompt File:** [backend/app/prompts/intent.md](backend/app/prompts/intent.md) ✓ exists

**Prompt Status:** FULL (128 lines, comprehensive schema documentation)

**Schema Documentation in Prompt:**
```
{
  "user_profile_summary": "string",
  "repository_query": {
    "keywords": ["string"],
    "categories": ["string"],
    "tags": ["string"],
    "levels": ["string"],
    "filters": { "key": "value" }
  },
  "confidence": 0.0,
  "missing_information": ["string"],
  "reasoning": "string or null"
}
```

**Pydantic Schema:** [IntentResult](backend/app/graph/intent_node.py#L15-L24) ✓ matches

**Real-Model Verification:** ✓ VERIFIED in Phase 9.1

**Status:** ✅ MATCH (prompt and schema align; real model verified)

---

### 8.2 Query Expansion

**No LLM schema.** Deterministic node.

**Status:** ✅ N/A (not LLM-backed)

---

### 8.3 Repository Retrieval

**No LLM schema.** Repository access only.

**Status:** ✅ N/A (not LLM-backed)

---

### 8.4 Recommendation

**Prompt File:** [backend/app/prompts/recommendation.md](backend/app/prompts/recommendation.md) ✗ DOES NOT EXIST

**Fallback Prompt:** Default from PromptManager (line 39 of prompt_manager.py):
```
You are a recommendation ranking assistant for government/public schemes.

Task:
- Evaluate candidate schemes against the user profile.
- Rank candidates and explain trade-offs.
- Return valid JSON only. Do not return markdown.
```

**Fallback Prompt Status:** MINIMAL (4 lines, no schema specification)

**Pydantic Schema:** [RecommendationResult](backend/app/graph/recommendation_models.py#L16-L28)

```python
class RecommendationResult(BaseModel):
    recommendations: list[RecommendationEntry]
    summary: Optional[str]
    overall_confidence: float = 0.0
    limitations: list[str]
    missing_information: list[str]
```

**Schema Documentation in Prompt:** ✗ NOT PRESENT in default prompt

**Mismatch Risk:** **HIGH**

- Prompt does not specify expected output fields
- Model must infer schema from RecommendationEntry structure
- RecommendationEntry has 11 fields; prompt does not name them
- Probability of JSONParsingError: **HIGH**

**Recommendation:** Create [backend/app/prompts/recommendation.md](backend/app/prompts/recommendation.md) with explicit schema documentation.

**Status:** ⚠️ HIGH MISMATCH RISK (minimal prompt, no schema docs, untested)

---

### 8.5 Planner

**Prompt File:** [backend/app/prompts/planner.md](backend/app/prompts/planner.md) ✗ DOES NOT EXIST

**Fallback Prompt:** Default from PromptManager (line 44 of prompt_manager.py):
```
You are an application planning assistant for scheme enrollment.

Task:
- Create a practical application roadmap for the selected scheme.
- Use timeline context and conversation details.
- Return valid JSON only. Do not return markdown.
```

**Fallback Prompt Status:** MINIMAL (4 lines, no schema specification)

**Pydantic Schema:** [PlannerResultDetailed](backend/app/agents/planner/planner_models.py#L18-L32)

```python
class PlannerResultDetailed(BaseModel):
    application_roadmap: list[RoadmapStep]  # 12 required fields
    timeline: list[dict[str, Any]]
    required_documents: list[dict[str, Any]]
    document_descriptions: dict[str, str]
    eligibility_summary: Optional[str]
    estimated_effort: Optional[str]
    estimated_duration: Optional[str]
    warnings: list[str]
    tips: list[str]
    common_mistakes: list[str]
    next_action: Optional[str]
    application_summary: Optional[str]
```

**Schema Documentation in Prompt:** ✗ NOT PRESENT in default prompt

**Mismatch Risk:** **CRITICAL**

- Prompt is generic, no mention of application_roadmap structure
- Prompt does not mention RoadmapStep (step, title, description, estimated_time_minutes, dependencies, completion_criteria)
- Model must infer 12-field nested structure from 4-line prompt
- Probability of JSONParsingError: **VERY HIGH**

**Recommendation:** Create [backend/app/prompts/planner.md](backend/app/prompts/planner.md) with detailed schema and example roadmap.

**Status:** 🔴 CRITICAL MISMATCH (minimal prompt, complex schema, untested)

---

### 8.6 Verification

**Prompt File:** [backend/app/prompts/verification.md](backend/app/prompts/verification.md) ✗ DOES NOT EXIST

**Fallback Prompt:** Default from PromptManager (line 49 of prompt_manager.py):
```
You are a verification and audit assistant for workflow quality checks.

Task:
- Review deterministic validator outputs and workflow artifacts.
- Produce a final verification assessment.
- Return valid JSON only. Do not return markdown.
```

**Fallback Prompt Status:** MINIMAL (4 lines, no schema specification)

**Pydantic Schema:** [VerificationResult](backend/app/agents/verification/models.py#L36-L50)

```python
class VerificationResult(BaseModel):
    overall_readiness_score: float
    overall_confidence: float
    audit_summary: Optional[str]
    consistency_assessment: ConsistencyReport  # 4-field nested model
    eligibility_assessment: EligibilityAssessment  # 2-field nested model
    document_assessment: DocumentReport  # 4-field nested model
    workflow_assessment: WorkflowReport  # 7-field nested model
    identified_risks: list[str]
    identified_limitations: list[str]
    recommended_actions: list[str]
    missing_information: list[str]
    final_verdict: str
```

**Schema Documentation in Prompt:** ✗ NOT PRESENT in default prompt

**Mismatch Risk:** **CRITICAL**

- Prompt does not mention nested validator report structures
- Model must infer ConsistencyReport, EligibilityAssessment, DocumentReport, WorkflowReport structures
- Probability of JSONParsingError: **VERY HIGH**

**Recommendation:** Create [backend/app/prompts/verification.md](backend/app/prompts/verification.md) with detailed schema and audit guidelines.

**Status:** 🔴 CRITICAL MISMATCH (minimal prompt, complex nested schema, untested)

---

### Schema Audit Summary

| Node | Prompt File | Prompt Status | Schema Match | Real-Model Verified | Risk Level |
|------|-------------|---------------|--------------|-------------------|-----------|
| intent_extraction | intent.md | FULL | ✓ MATCH | ✓ YES | ✅ LOW |
| query_expansion | N/A | N/A | N/A | N/A | ✅ N/A |
| repository_retrieval | N/A | N/A | N/A | N/A | ✅ N/A |
| recommendation | (missing) | MINIMAL (default) | ⚠️ PARTIAL | ✗ NO | ⚠️ HIGH |
| planner | (missing) | MINIMAL (default) | ⚠️ PARTIAL | ✗ NO | 🔴 CRITICAL |
| verification | (missing) | MINIMAL (default) | ⚠️ PARTIAL | ✗ NO | 🔴 CRITICAL |
| response_builder | N/A | N/A | N/A | N/A | ✅ N/A |

---

## 9. RETRY AUDIT

### 9.1 Retry Mechanisms Overview

| Layer | Mechanism | Trigger | Max Attempts | Consumes OpenRouter |
|-------|-----------|---------|--------------|-------------------|
| HTTP | httpx timeout + retry | connection timeout | 1 (builtin) | NO |
| LLM Model | OpenRouter rate limit | 429 response | 1 (builtin by httpx?) | NO (same call) |
| LLM Service | parse retry | JSONParsingError | 2 | YES (+1) |
| Execution Manager | node retry | retry_policy config | 1 | YES (full node) |

---

### 9.2 OutputParser Retry (LLMService.generate_json)

**Location:** [backend/app/llm/output_parser.py](backend/app/llm/output_parser.py#L18)

**Trigger:** `json.JSONDecodeError` or `pydantic.ValidationError`

**Flow:**
```python
for attempt in range(2):  # 2 attempts total
    try:
        data = json.loads(text)
        return model.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        if attempt == 0:
            # Attempt 1: try JSON substring extraction
            text = text[s:e+1]  # extract between first { and last }
            continue  # retry
        break  # Attempt 2 failed, raise
```

**Result:** If parsing fails on attempt 1, tries substring extraction and retries.

**Does NOT call generate() again.** Only parses the same `text` twice.

---

### 9.3 LLMService.generate_json Retry

**Location:** [backend/app/services/llm_service.py](backend/app/services/llm_service.py#L83)

**Trigger:** `JSONParsingError` (from OutputParser)

**Flow:**
```python
try:
    parsed = self.output_parser.parse(raw_text, model)
    return parsed
except JSONParsingError as exc:
    # One retry: re-call model with SAME prompt
    raw_text = self.generate(rendered)
    parsed = self.output_parser.parse(raw_text, model)
    return parsed
```

**Consumes OpenRouter Request:** **YES** (+1 request)

**Result:** On JSONParsingError, calls generate() again, consuming a second OpenRouter request.

---

### 9.4 ExecutionManager Node Retry

**Location:** [backend/app/graph/execution_manager.py](backend/app/graph/execution_manager.py#L110)

**Configuration:**
```python
retry_policy = self.config.get("retry_policy", {})
node_policy = retry_policy.get(node_name, retry_policy.get("default", {}))
should_retry = bool(node_policy.get("retry", False))
```

**Default:** `retry_policy = {}`, so `should_retry = False` for all nodes.

**If enabled:**
```python
if result.execution_status == "failed" and result.retry:
    result = self.execute_node(current, state)  # retry once
```

**Consumes OpenRouter Requests:** **YES** (entire node re-executes, can cause +4 requests if all LLM nodes retry)

**Current Status:** DISABLED by default. Can be enabled via config.

---

### 9.5 Retry Stacking Risk

**Scenario:** All retry layers trigger simultaneously.

**Example (Recommendation Node):**

1. execute_node("recommendation") called
2. Node calls llm.generate_json("recommendation", ..., RecommendationResult)
3. generate_json() calls generate() → request 1
4. OutputParser.parse() fails (JSONParsingError)
5. generate_json() calls generate() again → request 2 (auto-retry in LLMService)
6. parse() succeeds, returns RecommendationResult
7. ExecutionManager sees no error (exception was caught), execute_node returns success
8. ExecutionManager does NOT retry (node succeeded)

**Result:** Single node = 2 requests max (not stacked).

**But if node returns error status:**

1. execute_node() catches exception, returns failed status
2. ExecutionManager checks should_retry (if enabled)
3. If yes, calls execute_node() again → entire node re-executes
4. New call to generate_json() → request 3-4 (if parsing fails again)

**Result:** With node-level retry enabled, worst case = 4 requests for one node.

**Stacking Risk:** **MEDIUM**

- OutputParser retry (2 requests) is internal to single generate_json() call
- ExecutionManager retry (if enabled) would cause full node re-execution
- Both could theoretically trigger, but OutputParser catches exceptions, preventing ExecutionManager retry for parsing errors

---

### 9.6 Retry Audit Summary

**Current Configuration:**
- OutputParser auto-retry: ✓ ENABLED (1 retry on parsing failure)
- ExecutionManager node retry: ✗ DISABLED (default policy: retry=False)

**Impact on Request Count:**
- Minimum (no errors): 4 requests
- Expected (no errors): 4 requests
- Worst-case (all parsing errors): 8 requests (4 initial + 4 retries)
- If ExecutionManager retry enabled: up to 16 requests (double worst-case)

**Recommendation:** Keep ExecutionManager retry disabled unless needed for transient failures.

---

## 10. FAILURE PROPAGATION

### 10.1 Exception Flow

**LLM-level Exception:**
```
OpenRouter API error
    ↓
OpenRouterHTTPWrapper.generate() catches
    ↓
if status_code == 429: raise RateLimitError (LLM layer)
if status_code >= 400: raise ModelUnavailableError (LLM layer)
```

**Location:** [backend/app/llm/model_factory.py](backend/app/llm/model_factory.py#L73-L81)

**Service-level Exception:**
```
LLMService.generate() catches LLMRateLimitError
    ↓
translate to AppRateLimitError (app layer)
    ↓
raise AppRateLimitError()
```

**Location:** [backend/app/services/llm_service.py](backend/app/services/llm_service.py#L64-L67)

**Node-level Exception:**
```
Node calls llm.generate_json()
    ↓
if JSONParsingError: auto-retry generate()
    ↓
if still JSONParsingError: create WorkflowError(recoverable=True)
    ↓
if other exception: create WorkflowError(recoverable=False)
    ↓
state.errors.append(WorkflowError)
```

**Examples:**
- intent_extraction (lines 112-117 of intent_node.py)
- recommendation (lines 70-79 of recommendation_node.py)
- planner (lines 51-61 of planner_agent.py)
- verification (lines 70-76 of verification_agent.py)

**Workflow-level Exception:**
```
RecommendationService.recommend() catches:
    ↓
asyncio.TimeoutError → WorkflowTimeoutError (503)
RateLimitError → re-raise (429)
WorkflowValidationError → re-raise (422)
WorkflowDependencyError → re-raise (503)
other Exception → WorkflowError (500, then check for non-recoverable errors)
    ↓
if state.errors contains recoverable=False:
    → WorkflowDependencyError(503)
    ↓
else:
    → final_state returned (200)
```

**Location:** [backend/app/services/recommendation_service.py](backend/app/services/recommendation_service.py#L175-L197)

**API-level Exception:**
```
FastAPI route calls service.recommend()
    ↓
Exception raised:
    ↓
register_exception_handlers() maps to HTTP status:
    - RateLimitError → 429
    - WorkflowTimeoutError → 503
    - WorkflowDependencyError → 503
    - WorkflowError → 503
    - other AppError → configured status_code
    - other Exception → 500
```

**Location:** [backend/app/core/exceptions.py](backend/app/core/exceptions.py#L67-L103)

---

### 10.2 Failure Scenarios

**Scenario A: Rate Limit (429)**

```
1. intent_extraction calls llm.generate_json()
2. generate() calls OpenRouterHTTPWrapper.generate()
3. httpx.post() returns 429
4. RateLimitError raised (line 80 of model_factory.py)
5. LLMService catches, translates to AppRateLimitError (line 66 of llm_service.py)
6. Node does NOT catch (no try/except around generate_json)
7. Exception propagates to ExecutionManager.execute_node() (line 56)
8. execute_node catches Exception, appends to state.errors with recoverable=False (line 85)
9. ExecutionManager.run() continues to next node (node returned failed status)
10. Router checks state.errors, finds recoverable=False, returns (None, trace)
11. Workflow terminates
12. RecommendationService.recommend() sees non-recoverable error, raises WorkflowDependencyError
13. FastAPI catches AppError, returns 503
```

**ISSUE:** RateLimitError should return HTTP 429, not 503.

**Current Mapping:**
- RateLimitError → AppError(status_code=429) ✓
- But service treats it as fatal, maps to 503 ✓

**Expected:** Client should see 429, not 503.

---

**Scenario B: JSON Parsing Error (auto-retry + recovery)**

```
1. recommendation calls llm.generate_json()
2. generate() succeeds, returns text
3. OutputParser.parse() fails (JSONParsingError)
4. LLMService catches JSONParsingError, logs "retrying once"
5. LLMService calls generate() again
6. Second generate() succeeds
7. OutputParser.parse() succeeds
8. generate_json() returns RecommendationResult
9. recommendation node processes result, succeeds
10. No error in state.errors
11. Workflow continues normally
12. HTTP 200 returned
```

**Result:** **Transparent retry, no client visibility.** ✓ Expected behavior.

---

**Scenario C: LLM unavailable (persistent)**

```
1. recommendation calls llm.generate_json()
2. generate() calls OpenRouterHTTPWrapper.generate()
3. httpx.post() returns 503 (LLM service down)
4. ModelUnavailableError raised (line 80 of model_factory.py)
5. LLMService catches, raises ModelUnavailableError (line 72 of llm_service.py)
6. Node does NOT catch
7. ExecutionManager catches, appends WorkflowError(recoverable=False)
8. Router terminates workflow
9. RecommendationService catches, sees non-recoverable error
10. Raises WorkflowDependencyError
11. FastAPI returns 503
```

**Result:** HTTP 503 ✓ Correct.

---

**Scenario D: Validation error (non-recoverable)**

```
1. recommendation node successfully calls llm.generate_json()
2. RecommendationResult parsed successfully
3. _validate_recommendation_result() checks scores
4. Finds duplicate scheme_id, raises ValueError
5. recommendation catches, creates WorkflowError(recoverable=False)
6. Sets state.next_node = None
7. Returns state
8. ExecutionManager sees state returned (no exception), continues
9. Router checks state.errors, finds recoverable=False, returns (None, trace)
10. Workflow terminates
11. RecommendationService sees non-recoverable error, raises WorkflowDependencyError
12. FastAPI returns 503
```

**Result:** HTTP 503 ✓ Correct.

---

### 10.3 Critical Finding: Failure Status Propagation

**Issue (from Phase 9 notes):** "We already fixed one failure-status propagation issue."

**Current Status:** Verified to be FIXED. 

**Evidence:**
- [RecommendationService.recommend()](backend/app/services/recommendation_service.py#L186-L197) explicitly checks for non-recoverable errors:

```python
has_non_recoverable_error = any(
    getattr(error, "recoverable", False) is False
    for error in getattr(final_state, "errors", []) or []
)

if has_non_recoverable_error:
    final_state.workflow_status = WorkflowStatus.FAILED
    ...
    raise WorkflowDependencyError(...)
```

- [FastAPI exception handler](backend/app/core/exceptions.py#L95) correctly maps AppError to status_code:

```python
@app.exception_handler(AppError)
async def app_exception_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=standard_response(False, exc.message, None).model_dump(),
    )
```

**Verification:** No regression detected. Failure status propagation is correct.

---

## 11. NORMAL WORKFLOW TRACE

### Successful Workflow Execution (4 OpenRouter Requests)

```
1. HTTP POST /api/v1/recommendations with SurveyRequest
   ↓ (Request Layer)

2. RecommendationService.recommend(survey) called
   ↓ (Service Layer)

3. WorkflowEngine.run() starts
   ↓ (Workflow Layer)

4. ExecutionManager starts at "intent_extraction"
   ↓ (Execution Layer)

5. IntentExtractionNode.execute()
   └─ LLMService.generate_json("intent", variables, IntentResult)
      └─ OpenRouter API call #1: 21.37 sec
      └─ JSON parse success
      └─ state.intent = parsed IntentResult
      └─ state.next_node = "repository_retrieval"
   ↓ (Pure Python)

6. QueryExpansionNode.execute()
   └─ Deterministic: expand keywords, apply synonyms, remove stopwords
   └─ ~100 ms
   └─ state.repository_query.expanded_keywords = [...]]
   └─ No explicit next_node, router decides
   ↓ (Repository Access)

7. RepositoryRetrievalNode.execute()
   └─ RetrievalEngine.retrieve(expanded_query)
   └─ Deterministic: search CSV for keyword/category/tag matches
   └─ ~50 ms
   └─ state.candidate_schemes = [Scheme(...), ...]
   └─ state.next_node = "recommendation"
   ↓ (LLM)

8. RecommendationNode.execute()
   └─ LLMService.generate_json("recommendation", context, RecommendationResult)
      └─ OpenRouter API call #2: ~21 sec
      └─ JSON parse success
      └─ state.ranked_schemes = [Recommendation(...), ...]
      └─ state.selected_scheme = top recommendation
      └─ state.next_node = "planner"
   ↓ (LLM via Agent)

9. PlannerAgentImpl.plan(state)
   └─ Deterministic: extract_scheme_context(), build_timeline()
   └─ ~50 ms
   └─ LLMService.generate_json("planner", variables, PlannerResultDetailed)
      └─ OpenRouter API call #3: ~21 sec
      └─ JSON parse success
      └─ Deterministic: validate_roadmap()
      └─ state.planner_output = PlannerResult
   └─ Returns state (no explicit next_node, router decides)
   ↓ (LLM + Verification)

10. VerificationAgent.verify(state)
    └─ Deterministic: consistency_validator(), eligibility_validator(), document_validator(), workflow_validator()
    └─ ~100 ms (4 validators in sequence)
    └─ LLMService.generate_json("verification", variables, VerificationResult)
       └─ OpenRouter API call #4: ~21 sec
       └─ JSON parse success
       └─ state.verification_output = VerificationResult
    └─ Returns state (no explicit next_node, router decides)
    ↓ (Pure Python)

11. ResponseBuilder.build(final_state)
    └─ Aggregate ranked_schemes, planner_output, verification_output
    └─ Return WorkflowResult
    └─ ~10 ms
    ↓ (API Response)

12. RecommendationService.recommend() returns RecommendationPayload
    └─ HTTP 200 OK
    └─ Response body: {"success": true, "data": {...}, "workflow_id": "..."}

TOTAL TIME: ~85 seconds (estimate: 4 × 21 sec LLM + 0.3 sec overhead)
TOTAL OPENROUTER REQUESTS: 4
HTTP STATUS: 200
```

---

## 12. FAILURE WORKFLOW TRACE

### Failure Scenario: JSON Parsing Errors on First LLM Call (8 OpenRouter Requests, Timeout)

```
1-7. [Same as normal until recommendation node]
   ↓ (LLM)

8. RecommendationNode.execute()
   └─ LLMService.generate_json("recommendation", context, RecommendationResult)
      └─ OpenRouter API call #1: ~21 sec
      └─ Response: valid JSON but malformed structure (missing "recommendations" field)
      └─ OutputParser.parse() fails: ValidationError (missing required field)
      └─ LLMService catches JSONParsingError, logs "retrying once"
      └─ OpenRouter API call #2: ~21 sec
      └─ Response: again invalid structure
      └─ OutputParser.parse() fails: ValidationError again
      └─ LLMService raises JSONParsingError
      └─ recommendation node catches JSONParsingError (line 113)
      └─ state.errors.append(WorkflowError(recoverable=True))
      └─ Returns state (does NOT set next_node to None)
   └─ ExecutionManager sees state returned, continues
   └─ ExecutionManager sees result.execution_status != "failed" (no exception thrown)
   └─ Router.decide() called
      └─ Checks state.errors: all have recoverable=True
      └─ Returns (state.next_node="recommendation" or default)
      └─ **BUG?: Recommendation node didn't set next_node, so router continues to recommendation again?**
   ↓ (Infinite Loop Risk or Router Logic Issue)

9. Router returns state.next_node
   └─ If None: workflow terminates
   └─ If "recommendation": loops back to step 8
   └─ If something else: continues
```

**ISSUE:** recommendation node doesn't set next_node on JSONParsingError (line 113 catches but doesn't set next_node).

**But:** ExecutionManager.execute_node() catches the JSONParsingError only if it escapes the node. Line 113 in recommendation_node.py catches it:

```python
except JSONParsingError as exc:
    self.logger.exception("Parsing failed, retrying once")
    try:
        result = llm.generate_json("recommendation", variables, RecommendationResult)
    except Exception as exc2:
        state.errors.append(WorkflowError(...))
        try:
            state.next_node = None  # <-- LINE 78: SET TO NONE
        except Exception:
            self.logger.exception("Failed to clear next_node")
        return state
```

**Correction:** recommendation node DOES set next_node=None after parsing failure (line 78). Workflow terminates.

**Updated Trace:**

```
8. RecommendationNode.execute()
   └─ OpenRouter call #1: 21 sec (parsing fails)
   └─ OpenRouter call #2: 21 sec (retry, parsing fails again)
   └─ state.next_node = None
   └─ state.errors = [WorkflowError(recoverable=True)]
   └─ Returns state
   ↓ (Workflow Terminates)

9. ExecutionManager.run() loop
   └─ Router.decide(state) returns (None, trace) [because state.next_node=None]
   └─ current = None
   └─ while loop exits
   ↓ (Service Layer)

10. RecommendationService.recommend() receives final_state
    └─ Checks for non-recoverable errors
    └─ All errors have recoverable=True
    └─ Workflow succeeded with warnings
    └─ HTTP 200 OK
    └─ Response body: {"success": true, "data": {...}, "errors": [...]}
```

**ISSUE:** Workflow with only recoverable errors still returns HTTP 200!

**Evidence:** [Line 186-197 of recommendation_service.py](backend/app/services/recommendation_service.py#L186-L197):

```python
has_non_recoverable_error = any(
    getattr(error, "recoverable", False) is False
    for error in getattr(final_state, "errors", []) or []
)

if has_non_recoverable_error:
    final_state.workflow_status = WorkflowStatus.FAILED
    ...
    raise WorkflowDependencyError(...)
else:
    # Implicit: workflow succeeded
    # Final response built and returned
```

**Result:** Workflow terminates after 2 LLM calls (42 sec), client receives HTTP 200 with incomplete data.

**Timeline:** 42 seconds < 60-second timeout, so workflow completes before timeout.

---

### Alternative Failure: Timeout During Verification

```
1-10. [Same as normal until verification node]
   └─ Total time so far: ~65 seconds (including natural delays)
   ↓ (LLM)

10. VerificationAgent.verify(state)
    └─ 4 deterministic validators: ~50 ms
    └─ LLMService.generate_json("verification", ...)
       └─ OpenRouter API call #7: starts
       └─ Network latency: 3 sec
       └─ Model processing: 21 sec
       └─ **asyncio.wait_for() timeout fires: 60 sec total elapsed**
       └─ TimeoutError raised
    ↓ (Service Layer)

11. RecommendationService.recommend() catches asyncio.TimeoutError
    └─ state.workflow_status = CANCELLED
    └─ Raises WorkflowTimeoutError (line 184)
    ↓ (API Layer)

12. FastAPI catches WorkflowTimeoutError (AppError subclass)
    └─ HTTP 503 Service Unavailable
    └─ Response body: {"success": false, "message": "Workflow execution timed out"}

TOTAL TIME: ~60 seconds (timeout)
TOTAL OPENROUTER REQUESTS: 7 (incomplete, 7th call was cancelled)
HTTP STATUS: 503
```

**Critical:** Verification step never completes. Recommendations and plan exist but are unverified.

---

## 13. CRITICAL FINDINGS

### Finding #1: Timeout Misconfiguration — CRITICAL

**Evidence:**
- Real measurement: Intent Extraction = 21.37 sec
- Theoretical minimum: 4 LLM calls × 21 sec = 84 sec
- Configured workflow timeout: 60 sec
- Shortfall: -24 sec

**Impact:**
- Workflows will timeout before verification completes
- Partial recommendations returned (unverified)
- Users receive HTTP 503

**Severity:** 🔴 CRITICAL  
**Source:** [backend/config/api_config.json](backend/config/api_config.json), [backend/app/services/recommendation_service.py](backend/app/services/recommendation_service.py#L107-L111)  
**Recommendation:** Increase timeout to ≥180 seconds (or profile actual median latency and set to 2-3x median).

---

### Finding #2: Minimal Prompts for Planner & Verification — CRITICAL

**Evidence:**
- [backend/app/prompts/planner.md](backend/app/prompts/planner.md) does not exist
- [backend/app/prompts/verification.md](backend/app/prompts/verification.md) does not exist
- Default prompts are 4 lines, no schema documentation
- Pydantic schemas are complex (11+ fields, nested structures)

**Impact:**
- High probability of JSONParsingError (model infers schema)
- Automatic retries consume extra OpenRouter requests
- Workflow less reliable than intent extraction (which has full prompt)

**Severity:** 🔴 CRITICAL  
**Source:** [backend/app/llm/prompt_manager.py](backend/app/llm/prompt_manager.py#L35-L54)  
**Recommendation:** Create full prompt files with explicit JSON schema examples for planner and verification.

---

### Finding #3: Recommendation Prompt Missing Schema — HIGH

**Evidence:**
- [backend/app/prompts/recommendation.md](backend/app/prompts/recommendation.md) does not exist
- Default prompt: 4 lines, no mention of RecommendationEntry fields
- RecommendationEntry has 11 fields (scheme_id, scheme_name, overall_score, confidence, reason, pros, cons, eligibility_analysis, benefit_analysis, risk_analysis, required_documents_summary, recommended_priority)

**Impact:**
- Model must infer complex structure from minimal prompt
- High probability of JSONParsingError on first attempt
- Automatic retry consumes extra request

**Severity:** ⚠️ HIGH  
**Source:** [backend/app/llm/prompt_manager.py](backend/app/llm/prompt_manager.py#L39-L43)  
**Recommendation:** Create full prompt file with explicit JSON schema and example recommendations.

---

### Finding #4: Recoverable Errors Return HTTP 200 — HIGH

**Evidence:**
- [backend/app/services/recommendation_service.py](backend/app/services/recommendation_service.py#L186):

```python
if has_non_recoverable_error:
    raise WorkflowDependencyError()
# else: implicit success
```

- If workflow has only `recoverable=True` errors (e.g., JSONParsingError + retry success), HTTP 200 returned

**Impact:**
- Client cannot distinguish partial success from full success
- Incomplete workflow (e.g., stopped at recommendation due to parsing error) looks successful
- No indication of quality issues

**Severity:** ⚠️ HIGH  
**Source:** [backend/app/services/recommendation_service.py](backend/app/services/recommendation_service.py#L175-L197)  
**Recommendation:** Add workflow quality check; return HTTP 206 (Partial Content) or HTTP 200 with `success: true, complete: false` flag if errors present.

---

### Finding #5: Planner & Verification Nodes Not Registered — MEDIUM

**Evidence:**
- [backend/app/graph/workflow_engine.py](backend/app/graph/workflow_engine.py#L20-L35) registers only:
  - IntentExtractionNode
  - QueryExpansionNode
  - RepositoryRetrievalNode
  - RecommendationNode
- planner and verification handled as special cases in ExecutionManager (lines 57-76)

**Impact:**
- Code maintainability: planner/verification handled differently than other nodes
- Router.decide() doesn't know about planner/verification nodes
- Potential for logic divergence if new agents added

**Severity:** ⚠️ MEDIUM  
**Source:** [backend/app/graph/execution_manager.py](backend/app/graph/execution_manager.py#L57-L76)  
**Recommendation:** Register PlannerAgentImpl and VerificationAgent in NodeRegistry for consistency.

---

### Finding #6: No Per-Node Timeout — MEDIUM

**Evidence:**
- Workflow timeout: 60 sec (global)
- Per-call timeout: 30 sec (HTTP level only, at OpenRouter request level)
- Per-node timeout: NONE

**Impact:**
- Slow node (e.g., planner taking 25 sec) leaves only 35 sec for remaining nodes
- If any node takes > 30 sec and retries, timeout likely
- No graceful degradation (partial results discarded on timeout)

**Severity:** ⚠️ MEDIUM  
**Source:** [backend/app/services/recommendation_service.py](backend/app/services/recommendation_service.py#L175)  
**Recommendation:** Add per-node timeout or budget mechanism (e.g., warn if node takes > 20 sec).

---

### Finding #7: No Rate Limit Backoff — MEDIUM

**Evidence:**
- RateLimitError maps to HTTP 429
- But no retry backoff or exponential delay
- If rate limited, workflow fails immediately

**Impact:**
- No resilience to temporary rate limits
- High-frequency workflow runners hit limits

**Severity:** ⚠️ MEDIUM  
**Source:** [backend/app/services/recommendation_service.py](backend/app/services/recommendation_service.py#L184)  
**Recommendation:** Implement exponential backoff on 429 (or relay 429 to client with Retry-After header).

---

### Finding #8: Verbose Default Prompts Risk — LOW

**Evidence:**
- Default prompts in PromptManager are generic fallbacks
- Intended for dev/test, not production
- Production should use full prompt files

**Impact:**
- If prompt files deleted, production falls back to minimal prompts
- Silently degraded quality

**Severity:** 🔵 LOW  
**Source:** [backend/app/llm/prompt_manager.py](backend/app/llm/prompt_manager.py#L33-L54)  
**Recommendation:** Log warning if falling back to default prompt; consider raising error if file-based prompt missing.

---

### Finding #9: State.next_node Explicit Assignments Could Conflict — LOW

**Evidence:**
- intent_extraction sets next_node explicitly (line 109 of intent_node.py: "repository_retrieval")
- Router could override (but doesn't, since explicit assignment takes precedence)
- Future nodes might forget to set next_node

**Impact:**
- Code complexity: next_node set in multiple places (node vs. router)
- Risk of stale state if workflow reused

**Severity:** 🔵 LOW  
**Source:** [backend/app/graph/intent_node.py](backend/app/graph/intent_node.py#L109), [backend/app/graph/conditional_router.py](backend/app/graph/conditional_router.py#L59)  
**Recommendation:** Establish clear convention: either nodes always set next_node OR router always decides. Current hybrid approach works but is fragile.

---

## 14. RECOMMENDED TEST ORDER

**Goal:** Validate workflow and LLM contracts with minimum real OpenRouter requests.

### Phase 1: Offline Validation (0 requests)

1. ✅ Static prompt audit (done in this audit)
2. ✅ Schema contract inspection (done in this audit)
3. ✅ Routing graph verification (done in this audit)
4. Test parsing logic with mock LLM responses
5. Test OutputParser with malformed JSON
6. Test ExecutionManager retry logic with mock failures

**Commands:**
```bash
# Run existing tests (no external calls)
python -m pytest backend/app/tests/ -v -k "output_parser or parsing"
python -m pytest backend/app/tests/test_model_factory.py -v
```

**Requests:** 0

---

### Phase 2: Intent Extraction Contract Test (1 request)

7. ✅ Verify intent.md prompt exists and contains schema
8. Test IntentExtractionNode with real OpenRouter (model already verified in Phase 9.1, reuse result)

**Command:**
```bash
python -m pytest backend/app/tests/test_intent_node.py -v
```

**OR**: Reuse Phase 9.1 test output (don't re-request).

**Requests:** 0-1 (reuse existing if available)

---

### Phase 3: Query Expansion Test (0 requests)

9. Test QueryExpansionNode with deterministic inputs
10. Verify keyword expansion, synonym application, stopword removal

**Command:**
```bash
python -m pytest backend/app/tests/test_query_expansion.py -v
```

**Requests:** 0

---

### Phase 4: Repository Retrieval Test (0 requests)

11. Test RepositoryRetrievalNode with CSV fixtures
12. Verify candidate scheme selection

**Command:**
```bash
python -m pytest backend/app/tests/test_retrieval_engine.py -v
```

**Requests:** 0

---

### Phase 5: Recommendation Contract Test (1 request)

13. Create/finalize [backend/app/prompts/recommendation.md](backend/app/prompts/recommendation.md) with explicit schema
14. Test RecommendationNode with real OpenRouter

**Command:**
```bash
python -m pytest backend/app/tests/test_recommendation_node.py -v -s
```

**Requests:** 1

---

### Phase 6: Planner Contract Test (1 request)

15. Create [backend/app/prompts/planner.md](backend/app/prompts/planner.md) with explicit schema and example
16. Test PlannerAgentImpl with real OpenRouter

**Command:**
```bash
python -m pytest backend/app/agents/planner/tests/ -v -s
```

**Requests:** 1

---

### Phase 7: Verification Contract Test (1 request)

17. Create [backend/app/prompts/verification.md](backend/app/prompts/verification.md) with explicit schema
18. Test VerificationAgent with real OpenRouter

**Command:**
```bash
python -m pytest backend/app/agents/verification/tests/ -v -s
```

**Requests:** 1

---

### Phase 8: Integration Test (1 request)

19. Test full workflow with real OpenRouter
20. Measure end-to-end latency
21. Verify timeout behavior

**Command:**
```bash
python -m pytest backend/app/tests/test_recommendations_api.py::test_full_workflow -v -s
```

**Requests:** 1 (if fresh; reuse if available)

---

### Summary

| Phase | Focus | Test Count | OpenRouter Requests | Estimated Cost |
|-------|-------|-----------|-------------------|----------------|
| 1 | Offline validation | 6 | 0 | $0.00 |
| 2 | Intent extraction | 1 | 0-1 | $0.00-0.02 |
| 3 | Query expansion | 1 | 0 | $0.00 |
| 4 | Repository retrieval | 1 | 0 | $0.00 |
| 5 | Recommendation | 1 | 1 | $0.02-0.05 |
| 6 | Planner | 1 | 1 | $0.02-0.05 |
| 7 | Verification | 1 | 1 | $0.02-0.05 |
| 8 | Integration | 1 | 1 | $0.02-0.05 |
| **TOTAL** | | **13** | **4-5** | **$0.10-0.25** |

**Estimated Cost:** ~$0.15 (conservative upper bound assuming 4 full requests at ~$0.04 each via OpenRouter's pricing).

---

## 15. PHASE 9.2A EXIT CRITERIA

### Audit Completion Checklist

- ✅ All 7 workflow nodes identified and documented
- ✅ 4 LLM-backed nodes mapped (intent, recommendation, planner, verification)
- ✅ 3 non-LLM nodes confirmed (query_expansion, repository_retrieval, response_builder)
- ✅ Retry mechanisms audited and quantified (2-8 requests worst-case)
- ✅ Routing graph traced and validated
- ✅ Loop risks analyzed and mitigated
- ✅ Timeout configuration documented (60-sec workflow, 30-sec HTTP)
- ✅ Schema contracts audited (1 full, 3 minimal, 3 non-LLM)
- ✅ Failure propagation traced (HTTP 200/429/503 mappings)
- ✅ Execution traces documented (normal and failure paths)
- ✅ 9 critical/high/medium findings identified and classified
- ✅ Test order recommended (13 tests, 4-5 OpenRouter requests)

### NO PRODUCTION FILES MODIFIED

- ✅ All analysis static (no execution)
- ✅ All configuration reviewed, not changed
- ✅ All prompts reviewed, not modified
- ✅ All tests referenced, not run
- ✅ Zero OpenRouter requests made

### EXIT CONDITION

**STOP.** This audit report is complete.

Do not automatically implement fixes.  
Do not automatically run real-model tests.  
Do not run the full workflow.  
Do not make another OpenRouter request.

**Await next instruction.**

---

**OPENROUTER REQUESTS USED: 0**  
**PRODUCTION FILES MODIFIED: 0**  
**AUDIT STATUS: COMPLETE**
