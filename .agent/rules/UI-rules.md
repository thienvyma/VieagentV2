---
trigger: always_on
---

# VieAgent V2 Project Rules

> **These rules are mandatory for all development in VieAgent V2.**

## 🎨 UI/UX Requirements (CRITICAL)

### 1. Light & Dark Mode Support
- **MANDATORY**: All UI components MUST support both Light Mode and Dark Mode.
- **Shared Theme**: Use a shared theme configuration (e.g., in `globals.css` or `tailwind.config.ts`) to manage colors.
- **Implementation**:
    - Use Tailwind CSS dark mode classes (`dark:bg-gray-900`, etc.).
    - Ensure text contrast is accessible in both modes.
    - Test all new components in both modes before finishing.

### 2. Design Aesthetics
- **Premium Feel**: Use subtle gradients, glassmorphism where appropriate, and smooth transitions.
- **Interactive**: Hover effects, active states, and micro-animations are required.
- **Responsive**: Mobile-first design is standard.

---

## 💻 Coding Standards (Vibe Coding)

### 1. General Principles
- **Read First**: Always read `constants/` and `types/` before calling or writing code.
- **No Hardcoding**: Never hardcode strings, numbers, or colors. Use constants.
- **Strict Types**: No `any`. Define interfaces/types for all data structures (Props, State, API Responses).
- **Error Handling**:
    - Handle ALL errors. No empty `catch` blocks.
    - Log errors with context.
    - Use toast notifications for user-facing errors.

### 2. Component Structure
- Use the standard template:
    1. Imports (React -> Next -> Third-party -> Internal)
    2. Props Interface
    3. Component Definition (Memoized if needed)
    4. Hooks (Auth, State)
    5. Handlers (with try/catch)
    6. Render (Clean JSX)

### 3. State Management
- Prefer Server Actions for data mutation.
- Use React Query (if applicable) or SWR for client-side fetching needs beyond Server Components.
- Use Context only for global state (Auth, Theme).

### 4. Naming Conventions
- **Files/Folders**: `kebab-case` or `camelCase` (be consistent within strictures).
- **Components**: `PascalCase`.
- **Functions/Variables**: `camelCase`.
- **Constants**: `SCREAMING_SNAKE_CASE`.
- **Database**: `snake_case`.

---

## 🛡️ Security & Performance
- **Validate Inputs**: Always validate user input (Zod recommended).
- **Auth Checks**: Ensure protected routes check for authentication/authorization.
- **Optimization**: Use `next/image`, lazy loading, and server components where possible.

