---
description: Standardized protocol for resolving bugs and errors with telemetry, logging, and ESLint best practices
---

# Error Resolution Workflow

This workflow governs how all agents and developers handle bugs, errors, and issues in the Neural Canvas project. Follow this protocol for EVERY bug fix.

---

## 🔍 PRE-FIX PHASE: Research & Context

### Step 1: Review Error Resolution Log

Before making ANY changes:

1. **Review Protocol**: Check `docs/BUG_PROTOCOL.md` for the latest SOP.
2. **Check Log**: Review `docs/ERROR_RESOLUTION_LOG.md`:

```text
// turbo
1. Open docs/ERROR_RESOLUTION_LOG.md
2. Search for the affected file name
3. Review past issues, root causes, and solutions
4. Note any recurring patterns or related fixes
```

### Step 2: Gather Telemetry Data

Collect all available diagnostic information.
**CRITICAL**: Remove white-noise console logs before debugging (see `docs/BUG_PROTOCOL.md`). Only keep logs relevant to the bug.

Check list:

- [ ] IDE-reported errors (ESLint, TypeScript)
- [ ] Browser console errors (if applicable)
- [ ] Build/compile errors from terminal
- [ ] Runtime error stack traces
- [ ] Component state at time of error

### Step 3: Search for Similar Patterns

Search the log for similar error types:

```powershell
# Search for similar errors in the log
// turbo
grep -i "similar_error_keyword" docs/ERROR_RESOLUTION_LOG.md
```

---

## 🔧 FIX PHASE: Implementation

### Step 4: Create Fix Session Entry

Start a new entry in `docs/ERROR_RESOLUTION_LOG.md` using the template in `docs/templates/BUG_FIX_TEMPLATE.md`.

### Step 5: Document Each Attempt

For EVERY fix attempt:

1. Describe the change being made
2. Apply the change
3. Run verification:

   ```powershell
   // turbo
   npm run lint -- --quiet
   npx tsc --noEmit
   ```

4. Record the result (success/failure)
5. If failed, document WHY and try next approach

### Step 6: Apply Industry Best Practices

Reference these standards when fixing:

| Category       | Standard            | Resource                  |
| -------------- | ------------------- | ------------------------- |
| Accessibility  | WCAG 2.1 AA         | jsx-a11y plugin           |
| TypeScript     | Strict mode         | @typescript-eslint        |
| React          | Hooks rules         | eslint-plugin-react-hooks |
| Performance    | React.memo, useMemo | React docs                |
| Error Handling | Error Boundaries    | React Error Boundaries    |

---

## ✅ POST-FIX PHASE: Verification & Documentation

### Step 7: Run Full Verification Suite

```powershell
// turbo-all
npm run lint
npx tsc --noEmit
npm run build
```

### Step 8: Perform Root Cause Analysis

Answer these questions in the log entry:

1. **What** was the error? (symptoms)
2. **Why** did it occur? (root cause)
3. **How** was it fixed? (solution)
4. **How** to prevent recurrence? (prevention)

### Step 9: Update Error Resolution Log

Complete the log entry with:

- [ ] Final solution code snippets
- [ ] Root cause explanation
- [ ] Prevention guidelines
- [ ] References to docs/standards used

### Step 10: Update File History

If this file has had previous issues, add a cross-reference:

```markdown
### Related Issues

- See entry [DATE]: [Previous issue description]
```

---

## 📋 Quick Reference: Common Fix Patterns

### Accessibility Issues

```tsx
// ❌ Bad: Missing accessible name
<button onClick={handleClick}><Icon /></button>

// ✅ Good: With aria-label
<button onClick={handleClick} aria-label="Close dialog" title="Close">
  <Icon />
</button>
```

### TypeScript `any` Types

```tsx
// ❌ Bad: Using any
const handleEvent = (e: any) => { ... }

// ✅ Good: Proper typing
const handleEvent = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### Missing Display Name

```tsx
// ❌ Bad: Anonymous memo
export const Component = React.memo(({ prop }) => { ... });

// ✅ Good: With displayName
export const Component = React.memo(({ prop }) => { ... });
Component.displayName = 'Component';
```

### Inline Styles

```tsx
// ❌ Bad: Inline style object
<div style={{ filter: isActive ? 'none' : 'grayscale(20%)' }} />

// ✅ Good: Conditional Tailwind classes
<div className={isActive ? '' : 'grayscale-[20%]'} />
```

---

## 🚨 Critical Rules

1. **NEVER** skip the log review step
2. **ALWAYS** document fix attempts, even failed ones
3. **ALWAYS** run verification before marking complete
4. **ALWAYS** update the log with root cause analysis
5. **USE** the centralized logger for runtime errors
6. **REFERENCE** past fixes when solving new issues
