# Learning & Best Practices

This document captures key learnings and best practices discovered during the development and maintenance of the PDF Reader MCP Server.

## Version Management

### NPX and Version Control

**Learning**: Always use `@latest` tag with npx commands to ensure users get the most recent version.

**Why it matters**:
- npx caches packages locally in `~/.npm/_npx`
- Without `@latest`, users might get stuck on old cached versions
- The `@latest` tag forces npx to check for and download the newest version

**Best Practice**:
```bash
# ✅ Good - Always gets latest version
claude mcp add pdf-reader npx @fabriqa.ai/pdf-reader-mcp@latest

# ❌ Avoid - May use cached older version
claude mcp add pdf-reader npx @fabriqa.ai/pdf-reader-mcp
```

**Cache Clearing**:
When testing new versions or experiencing version issues:
```bash
# Clear npx cache
npx clear-npx-cache

# Or manually remove cache directory
rm -rf ~/.npm/_npx
```

### Version Display in Startup Messages

**Learning**: Including version numbers in startup messages is crucial for debugging and user support.

**Implementation**:
```javascript
// Read version from package.json dynamically
const packageJson = JSON.parse(
  await fs.readFile(path.join(__dirname, "package.json"), "utf-8")
);
const VERSION = packageJson.version;

// Display in startup message
console.error(`PDF Reader MCP Server v${VERSION} running on stdio`);
```

**Benefits**:
- Users can easily verify which version is running
- Helps with debugging when users report issues
- Ensures version stays in sync with package.json automatically

### Claude Code MCP Server Lifecycle

**Learning**: MCP servers start once when Claude Code launches and persist throughout the session.

**Key Points**:
1. **Configuration changes** (in `~/.claude.json`) don't take effect until Claude Code restarts
2. **Code changes** in the MCP server don't apply to running sessions
3. **Version updates** require a full Claude Code restart to load new version
4. **Local vs npx**: When switching from local development to npx package:
   - Remove old local MCP server: `claude mcp remove <name>`
   - Add npx version: `claude mcp add <name> npx <package>@latest`
   - Restart Claude Code to load the new configuration

**Testing Workflow**:
```bash
# During development (local changes)
1. Make code changes
2. Exit Claude Code session
3. Restart Claude Code
4. Test changes

# After publishing (npx version)
1. Publish to npm
2. Clear npx cache (if needed)
3. Exit Claude Code
4. Restart Claude Code (will fetch latest from npm)
5. Verify version in startup message
```

## Publishing Workflow

### Git and npm Publishing Protocol

**Learning**: Always follow a structured workflow when publishing updates.

**Established Protocol**:
1. **Make changes** → **Run tests** (`npm test`)
2. **Commit changes** → **Ask user** before pushing to git
3. **Push to git** → **ALWAYS ask user** about npm publish
4. **Bump version** → **Run tests again** → **Publish to npm**
5. **Push version bump** to git

**Why this sequence matters**:
- Tests catch schema compliance issues before publishing
- User approval ensures intentional releases
- Version bump comes after feature commit for clean history
- Second test run validates the version bump didn't break anything

### Version Bumping Strategy

**Semantic Versioning Guidelines**:
- **Patch** (1.0.x): Bug fixes, documentation updates, minor improvements
- **Minor** (1.x.0): New features, backwards-compatible changes
- **Major** (x.0.0): Breaking changes, major refactoring

**Examples from this project**:
- Documentation update with @latest tag → Patch (1.0.7 → 1.0.8)
- Adding version display feature → Patch (1.0.6 → 1.0.7)
- New PDF tool added → Minor (1.0.x → 1.1.0)
- Changed schema structure → Major (1.x.x → 2.0.0)

## Schema Compliance

### JSON Schema Draft 2020-12 Requirement

**Critical Learning**: Claude API requires `$schema` field in all tool definitions.

**Required Format**:
```javascript
inputSchema: {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: { /* ... */ },
  required: ["list", "of", "required"],
  additionalProperties: false
}
```

**Common Mistakes to Avoid**:
- ❌ Missing `$schema` field
- ❌ Using wrong draft version (draft-07 instead of 2020-12)
- ❌ Using unsupported keywords (like `default`)
- ❌ Missing `additionalProperties: false`

**Testing for Compliance**:
Always run `npm test` before committing. The test suite validates:
- Schema structure correctness
- JSON Schema draft 2020-12 compliance
- Functional behavior with real PDFs

## Development Best Practices

### File Organization

**Learning**: Keep test PDFs in the repository for automated testing.

**Current Setup**:
- `sample.pdf` - Real PDF for functional testing
- `test-server.js` - Automated test suite
- Tests validate both schema compliance AND actual PDF reading

### Documentation Maintenance

**Learning**: Keep multiple documentation sources in sync.

**Files to Update Together**:
1. **README.md** - Main user-facing documentation
2. **TESTING.md** - Testing procedures and validation
3. **blog-post.md** - User-friendly introduction
4. **CLAUDE.md** - Instructions for AI assistant
5. **LEARNING.md** - Historical learnings and best practices

**When to Update**:
- Installation commands change → Update all files with examples
- New feature added → Update README, blog-post, and TESTING
- Bug fixes → Update LEARNING with what was learned
- Version bumps → Let automation handle package.json updates

## Common Issues and Solutions

### Issue: Users Getting Old Versions

**Symptoms**:
- User reports missing features that should exist
- Version number in startup message doesn't match npm

**Solutions**:
1. Verify configuration uses `@latest`: `claude mcp list`
2. Clear npx cache: `npx clear-npx-cache`
3. Restart Claude Code completely
4. Check startup message shows correct version

### Issue: Schema Validation Failures

**Symptoms**:
- Error: "JSON schema is invalid"
- Tools not appearing in Claude Code
- MCP server fails to start

**Solutions**:
1. Run `npm test` to identify specific schema issues
2. Verify `$schema` field is present and correct
3. Check for unsupported JSON Schema keywords
4. Ensure all required fields are marked correctly

### Issue: MCP Server Not Updating

**Symptoms**:
- Code changes not reflected in running server
- Old behavior persists after fixes

**Solutions**:
1. Remember: MCP servers don't hot-reload
2. Exit Claude Code completely (not just the chat)
3. Restart Claude Code
4. Verify new version loaded via startup message

## Testing Philosophy

### Test-Driven Development

**Learning**: Always test BEFORE and AFTER changes.

**Our Testing Approach**:
1. **Compliance Tests**: Validate schema structure
2. **Functional Tests**: Verify PDF reading actually works
3. **Integration Tests**: Test with real Claude Code sessions

**When to Run Tests**:
- Before every commit
- After adding/modifying tools
- Before publishing to npm
- When debugging user issues

### Sample PDF Strategy

**Learning**: Use real-world PDFs for testing, not synthetic examples.

**Current Approach**:
- `sample.pdf` - 8-page AWS AI-DLC document
- Contains real formatting, structure, and content
- Validates end-to-end text extraction
- Provides realistic search scenarios

## Future Improvements

**Ideas for Consideration**:
1. Add automatic version check in startup
2. Create changelog automation
3. Add integration tests with multiple PDF types
4. Build user analytics for feature usage
5. Add performance benchmarks for large PDFs

## Key Takeaways

1. **Version Management**: Always use `@latest` and display version in startup
2. **Testing**: Run tests before every commit and publish
3. **Publishing**: Follow structured workflow with user confirmation
4. **Schema**: JSON Schema 2020-12 compliance is non-negotiable
5. **Documentation**: Keep all docs in sync when making changes
6. **Claude Code**: Understand MCP server lifecycle and restart requirements

---

*This document should be updated with each significant learning or discovery during development and maintenance.*
