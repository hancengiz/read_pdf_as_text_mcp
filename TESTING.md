# MCP Server Testing Guide

This document explains how to test MCP (Model Context Protocol) servers to ensure compliance with all MCP-enabled systems, including Claude Code, Claude Desktop, and other MCP clients.

## Overview

MCP server testing should cover two main aspects:

1. **Compliance Testing** - Ensures your server adheres to MCP specifications and JSON Schema standards
2. **Functional Testing** - Verifies your tools work correctly with actual inputs

## Testing Architecture

### Test Script Structure

The test suite (`test-server.js`) implements a multi-layered testing approach:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import Ajv from "ajv";
import addFormats from "ajv-formats";
```

### Layer 1: Connection Testing

Verify the server can establish MCP protocol connections:

```javascript
const client = new Client({
  name: "test-client",
  version: "1.0.0",
}, {
  capabilities: {},
});

await client.connect(transport);
```

**What this tests:**
- Server starts correctly
- Stdio transport works
- MCP handshake succeeds

### Layer 2: Compliance Testing

Validates that tool schemas are compatible with Claude's API and MCP clients.

#### Required Schema Fields

Every tool `inputSchema` must include:

```javascript
{
  // NOTE: Do NOT include $schema field - Claude API rejects it!
  type: "object",
  properties: { /* ... */ },
  required: [ /* ... */ ],
  additionalProperties: false  // Recommended for strict validation
}
```

**IMPORTANT:** Claude API requires schemas **WITHOUT** the `$schema` field. Including it will cause a 400 error.

#### Validation Checks

1. **Schema Metadata**
   - `$schema` field must **NOT** be present (Claude API rejects it)
   - MCP protocol uses JSON Schema but without version declaration in individual schemas

2. **Schema Structure**
   - `type` must be defined (typically "object")
   - `properties` must be defined
   - `required` array must list mandatory fields

3. **Schema Validity**
   - Must compile without errors using Ajv validator
   - All property types must be valid JSON Schema types
   - References must be resolvable

#### Implementation

```javascript
const ajv = new Ajv({
  strict: true,      // Enforce strict mode
  allErrors: true,   // Report all errors, not just first
  verbose: true,     // Include schema and data in errors
});
addFormats(ajv);     // Add format validators (uri, email, etc.)

function validateSchemaCompliance(toolName, schema) {
  // 1. Check required fields exist (NO $schema field for Claude API)
  const requiredFields = ['type', 'properties', 'required'];
  const missingFields = requiredFields.filter(field => !(field in schema));

  if (missingFields.length > 0) {
    console.error(`✗ Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }

  // 2. Validate NO $schema field (Claude API rejects it)
  if ('$schema' in schema) {
    console.error(`✗ Schema should NOT include $schema field for Claude API`);
    return false;
  }

  // 3. Validate schema compiles
  try {
    ajv.compile(schema);
    console.log(`✓ Schema is valid for Claude API`);
    return true;
  } catch (error) {
    console.error(`✗ Schema validation failed: ${error.message}`);
    return false;
  }
}
```

### Layer 3: Tool Discovery Testing

Verify all tools are discoverable:

```javascript
const tools = await client.listTools();
console.log(`✓ Found ${tools.tools.length} tools`);

// Run compliance checks on each tool
for (const tool of tools.tools) {
  validateSchemaCompliance(tool.name, tool.inputSchema);
}
```

### Layer 4: Functional Testing

Test actual tool execution with real parameters:

```javascript
const result = await client.callTool({
  name: "tool-name",
  arguments: {
    param1: "value1",
    param2: true,
  },
});

// Verify response structure
assert(result.content);
assert(Array.isArray(result.content));
assert(result.content[0].type === "text");
```

## Common Compliance Issues

### Issue 1: Including `$schema` Field

**Problem:**
```javascript
inputSchema: {
  $schema: "http://json-schema.org/draft-07/schema#",  // ❌ Claude API rejects this
  type: "object",
  properties: { /* ... */ }
}
```

**Error:**
```
tools.X.custom.input_schema: JSON schema is invalid. It must match JSON Schema draft 2020-12
```

**Solution:**
```javascript
inputSchema: {
  // ✓ NO $schema field
  type: "object",
  properties: { /* ... */ }
}
```

### Issue 2: Using `default` Keyword

**Problem:**
```javascript
properties: {
  clean_text: {
    type: "boolean",
    default: false,  // ⚠️ Not validated by most systems
  }
}
```

**Recommendation:**
```javascript
properties: {
  clean_text: {
    type: "boolean",
    description: "Clean text. Default: false",  // ✓ Document in description
  }
}
// Handle defaults in code instead
```

### Issue 3: Missing `additionalProperties`

**Problem:**
```javascript
inputSchema: {
  type: "object",
  properties: { /* ... */ },
  // ⚠️ additionalProperties defaults to true (permissive)
}
```

**Best Practice:**
```javascript
inputSchema: {
  type: "object",
  properties: { /* ... */ },
  additionalProperties: false,  // ✓ Strict validation
}
```

### Issue 4: Invalid Type Specifications

**Problem:**
```javascript
properties: {
  count: {
    type: "int",  // ❌ Invalid, should be "integer"
  }
}
```

**Solution:**
```javascript
properties: {
  count: {
    type: "integer",  // ✓ Valid JSON Schema type
  }
}
```

## Running Tests

### Install Dependencies

```bash
npm install --save-dev ajv ajv-formats
```

### Run Test Suite

```bash
npm test
```

Or directly:

```bash
node test-server.js
```

### Expected Output

```
Starting PDF Reader MCP Server test...

✓ Connected to MCP server

Testing: List Tools
✓ Found 3 tools:
  - read-pdf: Extract text from a PDF file...
  - search-pdf: Search for specific text...
  - pdf-metadata: Extract metadata from a PDF...


=== COMPLIANCE TESTS ===

Validating schema compliance for: read-pdf
✓ Schema is valid for Claude API
✓ Schema compliance check PASSED for: read-pdf

Validating schema compliance for: search-pdf
✓ Schema is valid for Claude API
✓ Schema compliance check PASSED for: search-pdf

Validating schema compliance for: pdf-metadata
✓ Schema is valid for Claude API
✓ Schema compliance check PASSED for: pdf-metadata

✓ All schemas passed compliance checks!

=== FUNCTIONAL TESTS ===
Test 1: Getting PDF metadata...
✓ Metadata extraction successful

Test 2: Searching for 'AI' in PDF...
✓ Search successful

Test 3: Reading PDF content...
✓ Read successful

All tests completed!
```

## Compatibility Testing

### Test with Different MCP Clients

#### 1. Claude Code (CLI)

```bash
# Add to config
claude mcp add your-server npx your-package

# Test in Claude Code
cc
> [try using your tool]
```

#### 2. Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["your-package"]
    }
  }
}
```

Restart Claude Desktop and test.

#### 3. Custom MCP Client

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({
  name: "test-client",
  version: "1.0.0",
}, {
  capabilities: {},
});

const transport = new StdioClientTransport({
  command: "npx",
  args: ["your-package"],
});

await client.connect(transport);
const tools = await client.listTools();
// Test your tools...
```

## Best Practices

### 1. Always Validate Schemas

Run compliance tests before publishing:

```bash
npm test
```

### 2. Document Parameter Defaults

Since `default` isn't reliably enforced, document defaults in descriptions:

```javascript
{
  type: "boolean",
  description: "Enable verbose output. Default: false"
}
```

### 3. Use Strict Schema Validation

```javascript
{
  // No $schema field for Claude API
  type: "object",
  additionalProperties: false,  // Reject unknown properties
  required: ["mandatory-field"]  // List all required fields
}
```

### 4. Test Error Handling

Verify your server handles invalid inputs gracefully:

```javascript
try {
  await client.callTool({
    name: "your-tool",
    arguments: { invalid: "data" }
  });
} catch (error) {
  // Should return helpful error message
  console.log(error.message);
}
```

### 5. Version Your Schema

If you need to make breaking changes:

```javascript
{
  name: "your-tool-v2",  // New tool name
  description: "...",
  inputSchema: { /* new schema */ }
}
```

## Debugging Common Issues

### Server Won't Start

**Check:**
- Is `#!/usr/bin/env node` at the top of your entry file?
- Is the file executable? `chmod +x index.js`
- Are dependencies installed? `npm install`

### Tools Not Appearing

**Check:**
- Does `listTools()` return your tools?
- Are tool names unique?
- Is the server handler registered correctly?

### Schema Validation Fails

**Check:**
- Run test suite: `npm test`
- Ensure NO `$schema` field is present
- Verify all property types are valid
- Check `required` array matches property names

### Claude API Rejects Schema

**Check:**
- Does test suite pass? `npm test`
- Remove any `$schema` field (Claude API rejects it)
- Remove `default` keywords
- Add `additionalProperties: false`

## Continuous Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
name: Test MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## References

### Official Documentation
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification) - Official MCP spec and architecture
- [Building MCP Servers](https://modelcontextprotocol.io/docs/develop/build-server) - Official guide for building MCP servers with tool inputSchema examples
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk) - Official MCP SDK for TypeScript/JavaScript
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp) - Claude Code specific MCP integration guide
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol) - Introduction to Model Context Protocol

### Schema Validation
- [Ajv JSON Schema Validator](https://ajv.js.org/) - Fast JSON Schema validator
- [JSON Schema Documentation](https://json-schema.org/) - General JSON Schema reference

### Known Issues and Community Solutions
- [Claude Code GitHub Issues - JSON Schema](https://github.com/anthropics/claude-code/issues?q=is%3Aissue+json+schema) - Community reported schema validation issues
- Note: Claude API requires schemas WITHOUT `$schema` field despite error messages mentioning "draft 2020-12"

## Summary

A complete MCP server test suite should:

1. ✓ Test MCP protocol connection
2. ✓ Validate schema compliance (NO `$schema` field for Claude API)
3. ✓ Verify tool discovery
4. ✓ Test functional behavior with real data
5. ✓ Handle errors gracefully
6. ✓ Work with multiple MCP clients (Claude Code, Claude Desktop, etc.)

**Key Takeaways:**
- Claude API requires schemas **WITHOUT** the `$schema` field
- Use `additionalProperties: false` for strict validation
- Document default values in `description` fields, not with `default` keyword
- Test with actual data files (like sample.pdf) to validate end-to-end functionality
- MCP protocol uses JSON Schema format but without explicit version declarations

By following these guidelines, your MCP server will be compatible with Claude Code, Claude Desktop, and any other MCP-enabled system.
