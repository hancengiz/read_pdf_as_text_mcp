# Claude Instructions for PDF Reader MCP Server

This document provides instructions for Claude (AI assistant) when working on this MCP server project.

## Project Overview

This is an MCP (Model Context Protocol) server that provides PDF reading and text extraction capabilities. It must remain compatible with Claude Code, Claude Desktop, and all MCP-enabled systems.

## Critical Rules

### 1. Always Run Tests After Changes

**MANDATORY**: After making ANY changes to the codebase, you MUST run the test suite:

```bash
npm test
# OR
node test-server.js
```

**This is not optional.** The test suite validates:
- JSON Schema compliance (required for Claude API compatibility)
- MCP protocol correctness
- Functional behavior of all tools with actual PDF reading

**Note**: The test suite uses `sample.pdf` for functional tests. This file must exist in the project root to validate that PDF reading actually works. If `sample.pdf` is missing, functional tests will show warnings but compliance tests will still run.

### 2. Schema Compliance Requirements

When modifying or adding tool schemas in `index.js`, ALL schemas MUST include:

```javascript
inputSchema: {
  $schema: "https://json-schema.org/draft/2020-12/schema",  // REQUIRED!
  type: "object",
  properties: {
    // ... your properties
  },
  required: ["list", "of", "required", "fields"],
  additionalProperties: false  // STRONGLY RECOMMENDED
}
```

**Common mistakes to avoid:**
- ❌ Missing `$schema` field → causes Claude API errors
- ❌ Using wrong schema version (must be draft 2020-12, not draft-07)
- ❌ Using `default` keyword → not validated, document in description instead
- ❌ Invalid property types (use "integer" not "int", "string" not "str")
- ❌ Missing `additionalProperties: false` → allows unexpected parameters

### 3. Testing Workflow

When making changes, follow this workflow:

1. **Make your changes** to `index.js` or other files
2. **Run tests immediately**: `npm test`
3. **Verify compliance tests pass**:
   ```
   ✓ Schema compliance check PASSED for: [tool-name]
   ```
4. **Verify functional tests pass** (or fail gracefully if test PDFs are missing)
5. **Only proceed** if ALL compliance tests pass

### 4. If Tests Fail

If compliance tests fail:

```
✗ Schema compliance check FAILED for: read-pdf
```

**Do NOT ignore this.** Fix the schema before proceeding:

1. Check the error message for what's missing
2. Refer to `TESTING.md` for examples
3. Fix the schema
4. Run tests again
5. Repeat until all tests pass

### 5. Code Changes Guidelines

#### Adding a New Tool

```javascript
{
  name: "new-tool",
  description: "Clear description of what this tool does",
  inputSchema: {
    $schema: "https://json-schema.org/draft/2020-12/schema",  // Don't forget!
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Description with defaults documented here. Default: 'value'"
      }
    },
    required: ["param1"],
    additionalProperties: false
  }
}
```

**After adding:** Run `npm test` immediately.

#### Modifying Existing Tools

1. Make your changes
2. Run `npm test`
3. If compliance fails, you broke something - fix it
4. Document what changed in your commit

#### Updating Dependencies

After running `npm install` or `npm update`:

```bash
npm test
```

Ensure everything still works.

### 6. Testing Edge Cases

When adding new functionality, test:

- ✓ Valid inputs work correctly
- ✓ Invalid inputs fail gracefully with helpful errors
- ✓ Missing required parameters are caught
- ✓ Schema validates correctly with Ajv

### 7. Documentation Requirements

When changing functionality:

1. Update `README.md` if user-facing changes
2. Update `TESTING.md` if testing procedures change
3. Add examples for new features
4. Document breaking changes clearly

### 8. Git Commit Guidelines

Use clear, descriptive commit messages:

```bash
git commit -m "Add feature: [description]

- Specific change 1
- Specific change 2
- Run tests: all passing"
```

**Before committing:** Run `npm test` one final time.

### 9. Git Push and npm Publishing Protocol

**CRITICAL WORKFLOW - NEVER SKIP:**

#### After Any Git Commit:

1. **ALWAYS ask user before pushing to git**: "Would you like me to push these changes to git?"
2. **If user approves push**: Execute `git push`
3. **IMMEDIATELY after successful push**: ALWAYS ask "Would you like me to publish this to npm?"

**This is MANDATORY. Never skip asking about npm publish after a git push.**

#### Publishing to npm

Use the provided publish script:

```bash
./publish.sh
```

The script will:
1. Check for uncommitted changes
2. Run all tests
3. Ask for version bump (patch/minor/major)
4. Commit version bump
5. Run tests again
6. Ask to publish to npm
7. Ask to push to git

**Manual publish (if needed):**

```bash
# Bump version
npm version patch  # or minor/major

# Run tests
npm test

# Publish
npm publish

# Push to git
git push
```

**When to publish:**
- After fixing bugs (patch)
- After adding new features (minor)
- After breaking changes (major)
- After significant improvements
- When user requests it

## Development Workflow Checklist

Use this checklist for every change:

- [ ] Made code changes
- [ ] Ran `npm test`
- [ ] All compliance tests passed
- [ ] Functional tests behave as expected (verify PDF reading works with sample.pdf)
- [ ] Verified actual PDF content is extracted correctly
- [ ] Updated documentation if needed
- [ ] Committed changes with clear message
- [ ] **ASKED USER** before pushing to git
- [ ] Pushed to remote repository (if user approved)
- [ ] **ASKED USER** if they want to publish to npm (MANDATORY after every push)

## Sample PDF Requirement

**Important**: The project must contain `sample.pdf` in the root directory for functional testing.

- The test suite automatically uses `sample.pdf` if present
- Tests validate that the MCP server can actually read PDF content
- Without `sample.pdf`, you'll only see compliance tests passing
- Functional tests prove the tools work end-to-end with real PDF files

**When adding sample.pdf to .gitignore or removing it:**
Make sure to document this and understand that functional tests won't validate actual PDF reading.

## Common Tasks

### Task: Fix a Schema Validation Error

```bash
# 1. Identify which tool failed
npm test  # Look for "✗ Schema compliance check FAILED"

# 2. Check the error message
# Common issues:
# - "Missing required fields: $schema" → Add $schema field
# - "Invalid $schema value" → Use draft 2020-12 URL
# - "Schema validation failed" → Check property types

# 3. Fix the schema in index.js

# 4. Test again
npm test

# 5. Verify it passes
# Look for: "✓ Schema compliance check PASSED"
```

### Task: Add a New PDF Processing Feature

```bash
# 1. Implement the feature in index.js
# 2. Add the tool definition with compliant schema
# 3. Add handler method
# 4. Test immediately
npm test

# 5. Add functional test in test-server.js
# 6. Test again
npm test

# 7. Update README.md with usage example
# 8. Commit
```

### Task: Debug a Failing Tool

```bash
# 1. Run tests to identify the issue
npm test

# 2. Check both compliance AND functional test output
# 3. Fix the issue
# 4. Test again
npm test

# 5. Verify both compliance and functional tests pass
```

## Integration Testing

### Test with Claude Code

After changes pass `npm test`:

```bash
# 1. Ensure tests pass
npm test

# 2. Add to Claude Code (if not already added)
claude mcp add pdf-reader npx @fabriqa.ai/pdf-reader-mcp

# 3. Start Claude Code
cc

# 4. Test the tool manually
> read sample.pdf and summarize it
```

### Test with Claude Desktop

1. Ensure `npm test` passes
2. Update `claude_desktop_config.json`
3. Restart Claude Desktop
4. Test tools manually

## Reference Documentation

- **TESTING.md**: Comprehensive testing guide
- **README.md**: User-facing documentation
- **index.js**: Main server implementation
- **test-server.js**: Test suite implementation

## Schema Validation Reference

### Valid JSON Schema Draft 2020-12 Types

```javascript
type: "string"     // Text
type: "number"     // Any number (int or float)
type: "integer"    // Whole numbers only
type: "boolean"    // true/false
type: "array"      // List of items
type: "object"     // Nested object
type: "null"       // Null value
```

### Common Schema Patterns

**String with pattern:**
```javascript
{
  type: "string",
  pattern: "^[0-9]+$",
  description: "Numeric string"
}
```

**Enum (limited choices):**
```javascript
{
  type: "string",
  enum: ["option1", "option2", "option3"],
  description: "Must be one of: option1, option2, option3"
}
```

**Array of items:**
```javascript
{
  type: "array",
  items: {
    type: "string"
  },
  description: "List of strings"
}
```

**Optional parameter with default:**
```javascript
{
  type: "boolean",
  description: "Enable feature. Default: false"
}
// Note: Handle the default in code, not in schema!
```

## Error Messages to Watch For

### Claude API Errors

If you see this in Claude Code:
```
API Error: 400 tools.X.custom.input_schema: JSON schema is invalid
```

**This means:** Schema is not JSON Schema draft 2020-12 compliant
**Action:** Run `npm test` and fix failing schemas

### MCP Protocol Errors

```
Error: Server did not respond to initialize
```

**This means:** Server won't start or crashed
**Action:** Check server logs, verify `index.js` syntax

### Tool Execution Errors

```
Error: Unknown tool: [tool-name]
```

**This means:** Tool not registered or name mismatch
**Action:** Check `setupHandlers()` tool definitions

## Performance Considerations

- PDF parsing can be memory-intensive for large files
- Test with various PDF sizes during development
- Consider adding file size limits if needed
- Monitor for memory leaks with long-running processes

## Security Considerations

- Always validate file paths to prevent directory traversal
- Sanitize PDF input paths
- Limit PDF file size if deploying publicly
- Don't expose internal file system paths in errors

## Final Reminder

**🚨 CRITICAL: Always run `npm test` after making changes! 🚨**

This is the single most important rule for maintaining compatibility with Claude Code and other MCP clients. Schema validation errors will break the integration, and the test suite is designed to catch these issues before they reach production.

## Questions?

When in doubt:
1. Run `npm test`
2. Check `TESTING.md` for detailed guidance
3. Look at existing tool schemas for examples
4. Ensure all compliance tests pass before committing
