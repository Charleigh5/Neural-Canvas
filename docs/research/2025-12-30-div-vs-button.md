# Research: React Accessibility - Div vs Native Button

**Query**: React accessibility "div role=button" vs native `<button>` best practices. specific lint rules jsx-a11y/click-events-have-key-events. Is it better to refactor to `<button>`? Also, performance impact of defining event handlers inside `.map()` in React.
**Date**: 2025-12-30
**Tool**: mcp_perplexity-ask_perplexity_ask

---

## Summary

The native `<button>` element is universally preferred over `<div role="button">` for interactive elements. Native buttons provide built-in keyboard accessibility (Enter/Space), focus management, and screen reader support without extra code. Defining event handlers inside `.map()` loops creates new function instances on every render, which creates performance overhead in large lists.

---

## Key Findings

### Finding 1: Native `<button>` Superiority

Native buttons automatically handle `Enter` and `Space` key activation, while `div` requires manual `onKeyDown` handlers to replicate this behavior. Using `div` also necessitates manual `tabIndex="0"` and `role="button"` attributes.

- **Source**: [MDN Web Docs - ARIA: button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role)
- **Relevance**: Refactoring `ReelLibrary` items to `<button>` removes the need for the custom `handleKeyDown` function entirely.

### Finding 2: Performance of Inline Handlers

Creating functions inside a `map` callback (like `const handleKeyDown = ...`) allocates new memory for that function for every item on every render. While modern JS engines are fast, this is an unnecessary overhead that breaks shallow comparison in memoized children.

- **Source**: [React Docs - Legacy](https://legacy.reactjs.org/docs/accessibility.html)
- **Relevance**: Moving to `<button>` eliminates the handler logic completely, solving this performance smell naturally.

### Finding 3: `jsx-a11y` Lint Rules

The rule `click-events-have-key-events` exists specifically to enforce that non-native interactive elements support keyboard interaction. Using a native element bypasses this rule because the browser guarantees compliance.

---

## Citations

| #   | Source            | URL                                                                                                            | Accessed   |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | MDN Web Docs      | [MDN Button Role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/button_role) | 2025-12-30 |
| 2   | Deque Systems     | [Accessible ARIA Buttons](https://deque.com/blog/accessible-aria-buttons/)                                     | 2025-12-30 |
| 3   | React Legacy Docs | [React Accessibility](https://legacy.reactjs.org/docs/accessibility.html)                                      | 2025-12-30 |

---

## Application to Project

### Recommended Action

Refactor the `ReelLibrary` component to replace the mapped `div` with a `button`.

### Files Affected

- `components/sequencer/ReelLibrary.tsx`: Change outer `div` to `button`, remove `role`, `tabIndex`, and `onKeyDown`.

### Anti-Patterns to Avoid

- Defining complex event handlers inside `map` callbacks.
- Re-implementing native browser features (like button activation) in JavaScript.

---

## Raw Response

```html
<details>
  <summary>Full Perplexity Response (click to expand)</summary>
</details>
```

**Use the native `<button>` element instead of `<div role="button">` whenever possible, as it provides built-in accessibility features like keyboard activation (Enter and Space keys), focus management, and screen reader support without extra attributes.**

### Why `<button>` is Better Than `<div role="button">`

Native `<button>` elements are automatically focusable, tabbable, and trigger actions on both Enter and Space keys, while correctly announcing as buttons to screen readers. In contrast, a `<div role="button">` requires additional setup:

- `tabindex="0"` for focusability.
- `onKeyDown` handlers for Enter and Space.
- `role="button"` for semantic meaning.

Refactoring to `<button>` requires less code and is less error-prone.

```html
</details>
```
