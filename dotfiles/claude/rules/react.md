---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

# React

## Prop drilling

A prop may travel at most two levels below the component that owns it. Beyond
that, use the first fix that fits:

- **Colocate:** move state into the lowest component that uses it.
- **Compose:** pass `children` or slot props so middle layers never see the data.
- **TanStack Query:** fetch server data in the component that needs it.
- **Context:** for rarely changing values like theme, user, or locale. Split by
  concern, since every consumer re-renders on change.
- **Zustand:** for shared state that changes often. Use one field per selector,
  or `useShallow` for several.

```tsx
// Avoid: Layout and Sidebar forward `user` without reading it.
<Layout user={user} />

// Prefer: the parent renders the consumer directly.
<Layout sidebar={<Sidebar><UserMenu user={user} /></Sidebar>} />

// Prefer: composition via children.
<Layout>
    <Sidebar>
        <UserMenu user={user} />
    </Sidebar>
</Layout>
```

## Forms

- Use TanStack Form
