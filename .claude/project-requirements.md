# Project Development Requirements

## Technology Stack

### Framework & Libraries
- **Next.js**: Use latest version (16.x or higher)
- **React**: Use latest stable version (19.x or higher)
- **Tailwind CSS**: Use latest version (4.x or higher)
- **TypeScript**: Use TypeScript 5.x for type safety

### Package Manager
- **pnpm**: Use pnpm as the package manager

## Development Standards

### Language & Localization
- **Primary Language**: English
  - All UI text must be in English
  - All code comments in English
  - All documentation in English
  - Variable and function names in English

### Code Quality
- **Type Safety**: Strict TypeScript mode enabled
- **No `any` types**: Avoid using `any`, use proper types or `unknown`
- **Minimal Code**: Write only the absolute minimal code needed
- **No Verbose Implementations**: Avoid unnecessary abstractions

### Performance
- **Optimize for Performance**:
  - Use React.memo for expensive components
  - Implement proper memoization
  - Avoid unnecessary re-renders
  - Use efficient algorithms (e.g., O(1) lookups with Map instead of O(n) with find)

### File Operations
- **Prefer Editing**: Always prefer editing existing files over creating new ones
- **No Unnecessary Files**: Don't create documentation files unless explicitly requested

### SEO & Accessibility
- **SEO Optimization**:
  - Proper meta tags
  - Semantic HTML
  - Structured data when applicable
- **Accessibility**:
  - ARIA labels where needed
  - Keyboard navigation support
  - Proper contrast ratios

## Code Style

### React Components
- Use functional components with hooks
- Use `'use client'` directive when needed for client components
- Prefer composition over inheritance

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use dark mode support with `dark:` variants

### State Management
- Use Zustand for global state (already in project)
- Use React hooks for local state
- Implement proper state persistence with localStorage

## Git Workflow
- Write clear, descriptive commit messages
- Keep commits atomic and focused
- Follow conventional commit format when possible

## Testing
- Only add tests when explicitly requested by user
- Don't automatically generate test files

## Documentation
- Only create documentation when explicitly requested
- Keep inline comments minimal and meaningful
- Use JSDoc for complex functions when necessary
