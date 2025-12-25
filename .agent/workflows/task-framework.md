---
description: Comprehensive 4-phase framework for complex development tasks (Scout → Architect → Engineer → Auditor)
---

# Task Framework Workflow

Use this structured approach for complex tasks: feature builds, refactors, architectural decisions.

---

## 📋 PHASE 1: Conceptual Exploration (The Scout)

Before writing any code, thoroughly explore the problem space.

### Historical Origins

- What are the foundational principles of this request?
- What prior art exists in the codebase?

### Related Ideas

- What existing libraries, patterns, or frameworks parallel this?
- What can be reused vs. built from scratch?

### Future Potential

- How must this scale? What future-proofing is required?
- What are the extension points for upcoming features?

### Constraints

- List all hard boundaries (latency requirements, security rules, compatibility)
- Identify non-negotiable requirements vs. nice-to-haves

---

## ⚖️ PHASE 2: Adversarial Synthesis (The Architect)

Challenge assumptions before committing to an approach.

### Primary Thesis

- Propose the "standard" or "obvious" solution approach
- Document the expected benefits

### Powerful Antithesis

- Critically attack the thesis
- Find the race conditions, memory leaks, UX friction, security flaws
- Consider edge cases that break the solution

### Superior Synthesis

- Merge the conflict into a robust final architecture
- Explain WHY this is the definitive choice
- Document trade-offs accepted

---

## 🛠️ PHASE 3: Actionable Blueprint (The Engineer)

Create a precise implementation plan.

### Technology & Architecture Context

- **Frameworks**: [Verified versions]
- **Language**: [Strict types required]
- **State Management**: [Approach chosen]

### Data Schema (Pre-Generation)

- Define exact types, interfaces, and schemas before coding
- Use Zod/TypeScript for validation

### Step-by-Step Execution

- [ ] **Step 1: Scaffolding** - Specific file paths and structure
- [ ] **Step 2: Core Logic** - Main function/logic implementation
- [ ] **Step 3: Interface** - UI/UX integration & animations
- [ ] **Step 4: Integration** - Connect to existing systems

### Edge Cases & Error Handling

| Case                | Handler                       |
| ------------------- | ----------------------------- |
| Null/Undefined Data | Graceful fallback UI          |
| Network Timeout     | Exponential backoff           |
| Invalid Input       | Validation with user feedback |

---

## 🛡️ PHASE 4: The Auditor (Verification)

No code ships without verification.

### Type Check

- [ ] No `any` types allowed
- [ ] All props and returns typed

### Security

- [ ] Input sanitization verified
- [ ] No exposed secrets or keys
- [ ] Proper error messages (no stack traces to users)

### Performance

- [ ] Optimized for target runtime
- [ ] No unnecessary re-renders
- [ ] Lazy loading where appropriate

### Self-Critique

- If I were a senior reviewer at Google, what would I flag?
- Address all concerns before marking complete

---

## 🎯 Baton Handoff

After completing all phases, clearly define:

- **What was delivered**: Summary of changes
- **What's next**: Immediate follow-up steps
- **Blockers**: Any decisions needed from stakeholder

---

## Quick Reference Checklist

```markdown
[ ] Phase 1: Problem fully explored
[ ] Phase 2: Solution stress-tested
[ ] Phase 3: Implementation complete
[ ] Phase 4: All verifications pass
[ ] Documentation updated
[ ] Error Resolution Log checked/updated
```
