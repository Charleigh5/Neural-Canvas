# Bug Fix Template

Copy this template when starting a new bug fix session.

---

## Entry: ERR-YYYY-MM-DD-NNN

**File**: `path/to/file.tsx`  
**Date**: YYYY-MM-DD  
**Severity**: Critical / High / Medium / Low  
**Status**: 🔄 In Progress / ✅ Resolved / ❌ Blocked

---

### Error(s) Addressed

| Line | Issue       | Type     |
| ---- | ----------- | -------- |
| ##   | Description | Category |

---

### Telemetry Data Collected

```text
[ ] IDE-reported errors (ESLint, TypeScript)
[ ] Browser console errors
[ ] Build/compile errors
[ ] Runtime error stack traces
[ ] Component state snapshot
```

**Error Output**:

```text
Paste error messages here
```

---

### Root Cause Analysis

**What happened?**

> Describe the symptoms

**Why did it happen?**

> Identify the underlying cause

**Contributing factors**:

- Factor 1
- Factor 2

---

### Fix Attempts

#### Attempt 1

**Description**: What change was made  
**Code Change**:

```tsx
// Before
old code

// After
new code
```

**Verification**:

```powershell
npm run lint -- --quiet
npx tsc --noEmit
```

**Result**: ✅ Success / ❌ Failed  
**Notes**: Any observations

---

#### Attempt 2 (if needed)

**Description**:  
**Code Change**:  
**Result**:  
**Notes**:

---

### Final Solution

**Summary**: Brief description of what fixed the issue

**Code Changes**:

```tsx
// Final working code
```

**Files Modified**:

- `path/to/file.tsx` (lines X-Y)

---

### Prevention Guidelines

1. **Immediate**: Steps to prevent this exact issue
2. **Systemic**: Changes to prevent this category of issues
3. **Process**: Workflow improvements

---

### References

- Link to relevant documentation: `<URL>`
- Link to standards/guidelines: `<URL>`
- Related entries: ERR-XXXX-XX-XX-###

---

### Verification Checklist

```text
[ ] npm run lint passes
[ ] npx tsc --noEmit passes
[ ] npm run build succeeds
[ ] Manual testing completed
[ ] Log entry updated with final solution
[ ] Quick search index updated
```
