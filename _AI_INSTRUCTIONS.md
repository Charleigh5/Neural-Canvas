# STUDIO.OS | AI OPERATIONAL PROTOCOLS

## 1. CORE DIRECTIVE

**Objective**: Build a robust, "Look Amazing" Neural Canvas.
**Critical Rule**: Prevent error recurrence by leveraging historical failure data.

## 2. CONTINUOUS IMPROVEMENT & ERROR PREVENTION (MANDATORY)

This project uses a strict "Fix-Your-Errors" protocol. You MUST:

1. **PRE-CODE CHECK**: Before writing any code, search `docs/ERROR_RESOLUTION_LOG.md` and `docs/BUG_PROTOCOL.md` for:
   - Similar past bugs.
   - "What Not To Do" (Anti-Patterns).
   - Specific fix patterns required for this module.
2. **ANTI-PATTERNS**: Strictly AVOID any coding patterns marked as "Root Cause" or "WRONG" in the error logs.
3. **DOCUMENTATION**: Every bug fix MUST be logged in `docs/ERROR_RESOLUTION_LOG.md`:
   - **Symptom**: What broke.
   - **Root Cause**: Why it broke.
   - **Solution**: How it was fixed.
   - **Prevention**: Rule to stop it from happening again.

## 3. IMPLEMENTATION STANDARDS

- **Best Practices**: Use verified documents and React/TypeScript standards.
- **Task Lists**: Create a task list for every file/feature change.
- **Depth**: detailed step-by-step breakdown of requests.

## 4. ARCHITECTURAL RULES

- **Structure**: Root directory is `/`. No `src/` prefix.
- **Styling**: **Tailwind CSS ONLY**. No inline styles unless dynamic (verify against lint rules).
- **State**: **Zustand**. Use `store/slices/` for modularity.
- **Animation**: **Framer Motion**.
- **AI**: Use `@google/genai` (no `GoogleGenerativeAI` import).
- **WASM**: Ensure `vite.config.ts` has WASM plugins for `voy-search`.

## 5. EXECUTION PROCESS

1. **Analyze**: Determine request scope.
2. **Research**: Check `ERROR_RESOLUTION_LOG.md` for constraints.
3. **Specify**: Create design spec.
4. **Code**: Output XML block with changes.
5. **Verify**: Log new learnings if errors occur.

## 6. WEB RESEARCH PROTOCOL (MANDATORY)

**Use Perplexity MCP for ALL web searches.** Never use generic search when Perplexity is available.

- **Primary Tool**: `mcp_perplexity-ask_perplexity_ask` (sonar-pro model)
- **Workflow**: Follow `/perplexity-research` workflow
- **Citations**: ALWAYS include source URLs in documentation
- **Template**: Use the research output template from `.agent/workflows/perplexity-research.md`
