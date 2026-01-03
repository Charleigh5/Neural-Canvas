---
description: How to conduct web research using the Perplexity MCP server
---

# Perplexity MCP Research Protocol

This document provides complete instructions for using the Perplexity MCP server for web research.

---

## 1. WHEN TO USE

Use Perplexity MCP for:

- **Bug Research**: Finding solutions to errors, stack traces, or unexpected behavior
- **API Documentation**: Looking up current library/framework documentation
- **Best Practices**: Finding recommended patterns for specific technologies
- **Compatibility**: Checking version compatibility between packages
- **Security**: Researching vulnerabilities or security advisories
- **Current Events**: Any time-sensitive information (releases, deprecations)

**DO NOT use for**:

- Information already in project docs (`docs/`, `README.md`)
- Questions answerable from codebase analysis
- Opinions or subjective recommendations

---

## 2. HOW TO USE

### Tool Selection

| Tool                                | When to Use                        | Speed | Depth  |
| ----------------------------------- | ---------------------------------- | ----- | ------ |
| `mcp_perplexity-ask_perplexity_ask` | Quick questions, everyday searches | Fast  | Medium |

### Calling the Tool

```json
{
  "tool": "mcp_perplexity-ask_perplexity_ask",
  "parameters": {
    "messages": [
      {
        "role": "user",
        "content": "[Your specific question here]"
      }
    ]
  }
}
```

### Query Formulation Best Practices

1. **Be Specific**: Include technology, version, and context
   - ❌ "How to fix React error"
   - ✅ "React 19 useEffect cleanup function not called on unmount in StrictMode"

2. **Include Error Context**: Paste relevant error messages
   - ❌ "TypeScript error with imports"
   - ✅ "TypeScript error TS2307: Cannot find module '@google/genai' in Vite project"

3. **Specify Constraints**: Mention your stack
   - ❌ "Best state management"
   - ✅ "Zustand vs Redux Toolkit for React 19 with TypeScript strict mode"

---

## 3. WHY TO USE

### Benefits Over Generic Search

1. **Real-time Data**: Uses live web search, not training data cutoffs
2. **Source Citations**: Returns URLs for verification
3. **Synthesized Answers**: Combines multiple sources into coherent response
4. **Conversational Context**: Can follow up with clarifying questions

### Required By Project Rules

Per `_AI_INSTRUCTIONS.md` Section 6:

> "Use Perplexity MCP for ALL web searches. Never use generic search when Perplexity is available."

---

## 4. OUTPUT FORMAT

### Standard Research Document

After every Perplexity query, document findings using this template:

```markdown
# Research: [Topic Title]

**Query**: [Exact question asked]
**Date**: [YYYY-MM-DD]
**Tool**: mcp_perplexity-ask_perplexity_ask

---

## Summary

[2-3 sentence executive summary of findings]

---

## Key Findings

### Finding 1: [Title]

[Detailed explanation]

- **Source**: [URL]
- **Relevance**: [How this applies to our project]

### Finding 2: [Title]

[Detailed explanation]

- **Source**: [URL]
- **Relevance**: [How this applies to our project]

### Finding 3: [Title]

[Detailed explanation]

- **Source**: [URL]
- **Relevance**: [How this applies to our project]

---

## Citations

| #   | Source      | URL        | Accessed |
| --- | ----------- | ---------- | -------- |
| 1   | [Site Name] | [Full URL] | [Date]   |
| 2   | [Site Name] | [Full URL] | [Date]   |
| 3   | [Site Name] | [Full URL] | [Date]   |

---

## Application to Project

### Recommended Action

[Specific steps to apply this research]

### Files Affected

- `path/to/file1.ts` - [What changes]
- `path/to/file2.tsx` - [What changes]

### Anti-Patterns to Avoid

- [Pattern 1 to avoid based on research]
- [Pattern 2 to avoid based on research]

---

## Raw Response

<details>
<summary>Full Perplexity Response (click to expand)</summary>

[Paste complete unmodified response here for reference]

</details>
```

---

## 5. INTEGRATION WITH ERROR RESOLUTION

When research is for bug fixing, also add to `docs/ERROR_RESOLUTION_LOG.md`:

```markdown
## [Date] - [Bug Title]

### Research Conducted

- **Query**: [What was searched]
- **Tool**: mcp_perplexity-ask_perplexity_ask
- **Key Citation**: [Most authoritative URL]

### Solution Applied

[What was implemented based on research]

### Prevention Rule

[Rule to prevent this bug in future]
```

---

## 6. EXAMPLE WORKFLOW

### Scenario: Fixing a Zustand hydration error

**Step 1: Formulate Query**

```text
"Zustand persist middleware hydration error 'Cannot read properties of undefined'
in React 19 with TypeScript"
```

**Step 2: Execute Search**
Call `mcp_perplexity-ask_perplexity_ask` with the query.

**Step 3: Parse Response**

- Extract solution steps
- Note all cited URLs
- Identify version-specific caveats

**Step 4: Document**
Create research document using template above.

**Step 5: Apply**
Implement the fix, citing the research.

**Step 6: Log**
Add entry to `docs/ERROR_RESOLUTION_LOG.md` with prevention rule.

---

## 7. QUICK REFERENCE

```text
┌─────────────────────────────────────────────────────────────┐
│                    PERPLEXITY MCP CHECKLIST                 │
├─────────────────────────────────────────────────────────────┤
│ □ Query is specific (includes version, context, error)     │
│ □ Used mcp_perplexity-ask_perplexity_ask tool              │
│ □ Extracted and verified all citations                      │
│ □ Documented findings using standard template               │
│ □ Added to ERROR_RESOLUTION_LOG.md (if bug-related)        │
│ □ Applied findings with citation in code comments           │
└─────────────────────────────────────────────────────────────┘
```
