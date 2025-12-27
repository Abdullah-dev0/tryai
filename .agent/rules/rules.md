---
trigger: always_on
---

## Build/Lint/Test Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations with Drizzle
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes directly to database

No test framework is configured. If adding tests, check with the user for preferred approach.

## Documentation

- ALWAYS use Context7 for getting latest docs on libraries and frameworks
- Use `context7_resolve-library-id` first to get the library ID
- Then use `context7_get-library-docs` with that ID to fetch documentation
- Mode 'code' for API references and code examples
- Mode 'info' for conceptual guides and architecture

## Code Style Guidelines

### Imports

- Use `@/` alias for internal imports (configured in tsconfig.json paths)
- Third-party imports first, then internal imports
- Use named exports: `import { Component } from "@/components/ui/button"`
- React imports: `import * as React from "react"` (ESM style)
- Separate React hooks import: `import { useState, useEffect } from "react"`

### Formatting & Indentation

- Use tabs for indentation (2 spaces visual width)
- No code comments unless explicitly requested
- Keep lines reasonable length, break long chains
- ESLint configured with Next.js recommended rules
- `console.log` not allowed; use `console.warn` or `console.error` only

### Types

- TypeScript strict mode enabled
- Use `interface` for component props and object shapes
- Use `type` for unions, primitives, and inferred types
- Database types: `export type User = typeof user.$inferSelect`
- Type assertions sparingly, prefer type narrowing
- Generic types with constraints: `T extends DateGroupable`

### Naming Conventions

- Components: PascalCase (`ChatInterface`, `MessageList`)
- Functions/Variables: camelCase ONLY (`handleSubmit`, `isLoading`)
- File names: camelCase ONLY (`chatInterface.tsx`, `utils.ts`)

### React Patterns

- Use `use client` directive for client components
- Function components with hooks (no class components)

### Database (Drizzle ORM)

- SQLite with LibSQL client
- Schema in `lib/db/schema.ts`
- Use timestamp modes: `timestamp_ms` or `number`
- Relations defined with `relations()`
- Cascade deletes on foreign keys
- Indexes on frequently queried columns

### Styling

- Tailwind CSS v4 for styling
- Radix UI primitives for components
- `cn()` utility for conditional class merging (clsx + tailwind-merge)
- shadcn/ui component structure
- Class variance authority (cva) for component variants
