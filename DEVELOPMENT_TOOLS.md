# Development Tools Guide

This document describes the tools we've added to make development easier and catch errors earlier.

## JavaScript/Frontend Tools

### ESLint (Code Quality)
**What it does:** Finds bugs and potential errors in JavaScript code before you run it.

**Usage:**
```bash
# Check for errors
npm run lint

# Auto-fix simple errors
npm run lint:fix
```

**Benefits:**
- Catches undefined variables
- Finds syntax errors
- Detects unused code
- Prevents common bugs

### Prettier (Code Formatting)
**What it does:** Automatically formats your code to be consistent.

**Usage:**
```bash
# Format all files
npm run format

# Check if files need formatting
npm run format:check
```

**Benefits:**
- Consistent code style
- No more formatting debates
- Easier to read code

## Python/Backend Tools

### Type Hints (Built-in)
**What it does:** Document what types your functions expect and return.

**Example:**
```python
def format_phone_number(phone: str) -> str:
    # Type hints make it clear: input is str, output is str
    pass
```

**Benefits:**
- Better IDE autocomplete
- Catch type errors early
- Self-documenting code

### Marshmallow (Data Validation)
**What it does:** Validates API request/response data automatically.

**Benefits:**
- Automatic validation of incoming data
- Clear error messages
- Less manual validation code

## VS Code / Cursor Setup

Add these to your `.vscode/settings.json` (or Cursor settings):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  },
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true
}
```

## Recommended VS Code Extensions

1. **ESLint** - Shows linting errors in editor
2. **Prettier** - Code formatter
3. **Python** (Microsoft) - Python support with type checking
4. **Black Formatter** - Python code formatter
5. **Error Lens** - Shows errors inline in your code

## Installation

```bash
# Install JavaScript tools
npm install --save-dev eslint prettier

# Install Python tools (if using pip)
pip install marshmallow black mypy

# Or add to requirements.txt and install normally
```

## Quick Start

1. **Before coding:** Run `npm run lint` to check for errors
2. **After coding:** Run `npm run format` to format code
3. **Before committing:** Run both to catch issues early

## Future Improvements

- **Unit Tests** - Automatically test your code
- **API Documentation** - Auto-generate docs from code
- **Database Migrations** - Better schema management
- **CI/CD** - Automatically test and deploy

## Questions?

These tools are optional but recommended. They catch errors before they reach production and make code easier to maintain.

