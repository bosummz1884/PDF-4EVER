# Windsurf AI Global Rules - PDF Editor Project

## Core Programming Standards

### Language & Configuration
- **Primary Language**: TypeScript ONLY - no JavaScript files allowed
- **TypeScript Strict Mode**: ENABLED - all strict mode rules must be followed
  - `strict: true`
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `strictFunctionTypes: true`
  - `strictBindCallApply: true`
  - `strictPropertyInitialization: true`
  - `noImplicitReturns: true`
  - `noImplicitThis: true`
  - `noUncheckedIndexedAccess: true`
- **Linting**: ESLint is the project linter - all ESLint rules must be respected

## File Organization & Architecture

### Type Management
- **Location**: All types and interfaces MUST be placed in `client/src/types/pdf-types/`
- **Exports**: All type/interface exports must originate from this folder
- **Naming**: Use PascalCase for interfaces and types
- **Structure**: Organize types by feature/domain within the pdf-types folder

### State Management
- **Centralization**: ALL state management for the entire project MUST be contained in the PDF Editor Context file
- **No Scattered State**: Do not create additional state management solutions (Redux, Zustand, etc.)
- **Context Pattern**: Use React Context pattern exclusively for state management

## Code Preservation
- **No Deletion Policy**: NEVER delete existing code unless explicitly instructed to do so
- **Refactoring**: When refactoring, preserve original code as comments or move to backup files
- **Version Safety**: Always maintain backward compatibility when possible

## Documentation Standards

### README.md Requirements
- **Maintenance**: README.md file MUST be created and maintained throughout development
- **Updates**: Update README.md whenever new features, dependencies, or architectural changes are made
- **Sections Required**:
  - Project Overview
  - Setup Instructions
  - Architecture Overview
  - Available Scripts
  - Feature Documentation
  - Type System Documentation
  - Contributing Guidelines

### Code Documentation
- **JSDoc**: Use JSDoc comments for all functions, classes, and complex logic
- **Inline Comments**: Provide clear explanations for business logic
- **Type Documentation**: Document complex types with descriptions

## Development Workflow

### File Creation Rules
1. Always check if types exist in `client/src/types/pdf-types/` before creating new ones
2. Import types from the centralized types folder
3. Update context file for any new state requirements
4. Update README.md for any new features or changes

### Code Quality Standards
- Follow TypeScript strict mode guidelines
- Ensure all ESLint rules pass
- Use meaningful variable and function names
- Implement proper error handling
- Write type-safe code with proper generics where applicable

### Project Structure Compliance
```
client/
├── src/
│   ├── types/
│   │   └── pdf-types/          # ALL types and interfaces go here
│   ├── features
│   │   └── pdf-editor
|   |       └──PDFEditorContext    # ALL state management goes here
│   └── ...
└── README.md                   # Maintained documentation
```

## Error Handling & Validation

### TypeScript Compliance
- No `any` types unless absolutely necessary and documented
- Proper null/undefined checks
- Use type guards and assertions appropriately
- Implement proper generic constraints

### Runtime Safety
- Validate props and data at boundaries
- Implement proper error boundaries in React components
- Use try/catch blocks for async operations
- Provide meaningful error messages

## Communication Standards

### Before Making Changes
1. Confirm understanding of requirements
2. Identify which files will be modified
3. Verify type definitions exist or need to be created
4. Check state management requirements

### After Making Changes
1. Update README.md if necessary
2. Ensure all types are properly exported from pdf-types folder
3. Verify ESLint compliance
4. Confirm TypeScript strict mode compliance

## Forbidden Actions
- ❌ Writing JavaScript files
- ❌ Disabling TypeScript strict mode
- ❌ Ignoring ESLint rules without discussion
- ❌ Creating state outside of the PDF Editor Context
- ❌ Deleting code without explicit permission
- ❌ Skipping README.md updates
- ❌ Using `any` type without justification
- ❌ Creating types outside of the designated folder

## Required Actions
- ✅ Always use TypeScript
- ✅ Maintain strict mode compliance
- ✅ Place all types in `client/src/types/pdf-types/`
- ✅ Use centralized state management
- ✅ Keep README.md current
- ✅ Preserve existing code
- ✅ Follow ESLint rules
- ✅ Document changes and new features

---

**Remember**: These rules ensure project consistency, maintainability, and scalability. Always refer back to these guidelines when making any changes to the PDF editor project.