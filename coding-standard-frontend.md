# Frontend Coding Standard – React + TypeScript

The frontend follows the **Google TypeScript Style Guide** with additional React conventions.

---

# Language

- All frontend code must use **TypeScript**
- Avoid untyped variables when possible
- Define interfaces or types for important structures

---

# React Rules

- Use **functional components only**
- Use **React Hooks**
- Do not use class components

---

# File Structure

- One component per file
- Use **PascalCase** for component filenames
- Use **camelCase** for variables, hooks, and functions

Example:

UserProfile.tsx  
useGameState.ts

---

# Component Design

Components should be separated into two categories.

### Presentational Components

- purely visual
- receive props
- minimal logic

### Container Components

- manage room/game state
- communicate with backend APIs
- manage WebSocket subscriptions

---

# State Management

- Client state must not become the source of truth for gameplay logic
- Server state is authoritative
- Frontend reflects state pushed from the backend

---

# Side Effects

Side effects such as:

- WebSocket connections
- API calls
- timers

must be handled inside hooks.

---

# Exports

- Use **named exports**
- Avoid default exports

---

# Testing

Frontend tests should cover:

- key interaction flows
- visible state transitions
- UI updates during gameplay