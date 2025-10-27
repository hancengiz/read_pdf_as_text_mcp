# PDF Reader MCP Server

[![npm version](https://badge.fury.io/js/@hancengiz%2Fpdf-reader-mcp-server.svg)](https://www.npmjs.com/package/@hancengiz/pdf-reader-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@hancengiz/pdf-reader-mcp-server.svg)](https://www.npmjs.com/package/@hancengiz/pdf-reader-mcp-server)

A Model Context Protocol (MCP) server that provides efficient PDF text extraction capabilities for Claude Code. This server allows you to read, search, and extract metadata from PDF files without loading the entire content into Claude's context window.

**npm package**: [@hancengiz/pdf-reader-mcp-server](https://www.npmjs.com/package/@hancengiz/pdf-reader-mcp-server)

## Features

- **Read PDF Files**: Extract full text content from PDF files with optional text cleaning
- **Search PDFs**: Search for specific text within PDFs with context-aware results
- **Extract Metadata**: Get detailed metadata including title, author, page count, dates, etc.
- **Efficient Context Usage**: Process large PDFs without consuming excessive Claude Code context
- **Flexible Options**: Support for page ranges, case-sensitive search, and more

## Installation

### Option A: Install from npm (Recommended)

```bash
npm install -g @hancengiz/pdf-reader-mcp-server
```

After installation, the server will be available globally. You can configure it by running:

```bash
# The package will be installed in your global node_modules
# Typically: /usr/local/lib/node_modules/@hancengiz/pdf-reader-mcp-server
```

### Option B: Install from source

1. Clone this repository:
```bash
git clone https://github.com/hancengiz/read_pdf_as_text_mcp.git
cd read_pdf_as_text_mcp
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### If installed via npm:

Find your global npm installation path:
```bash
npm root -g
# Example output: /usr/local/lib/node_modules
```

Then configure Claude Code by adding to `~/.claude.json`:

```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "node",
      "args": [
        "/usr/local/lib/node_modules/@hancengiz/pdf-reader-mcp-server/index.js"
      ]
    }
  }
}
```

**Or use the npm bin directly:**
```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": [
        "@hancengiz/pdf-reader-mcp-server"
      ]
    }
  }
}
```

### If installed from source:

#### Option 1: Machine-Level (Recommended)
Add to your `~/.claude.json` file using the provided script:

```bash
python3 update_config.py
```

This will automatically add the MCP server to your global configuration, making it available across all projects.

#### Option 2: Claude Desktop
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "node",
      "args": [
        "/absolute/path/to/read_pdf_as_text_mcp/index.js"
      ]
    }
  }
}
```

#### Option 3: Project-Level
Create a `.mcp.json` file in your project directory:

```json
{
  "mcpServers": {
    "pdf-reader": {
      "command": "node",
      "args": [
        "/absolute/path/to/read_pdf_as_text_mcp/index.js"
      ]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/read_pdf_as_text_mcp/index.js` with the actual absolute path where you installed this server.

## Usage

Once configured, restart Claude Code. The following tools will be available:

### 1. read-pdf

Extract text content from a PDF file.

**Parameters:**
- `file` (required): Path to the PDF file
- `pages` (optional): Page range (e.g., '1-5', '1,3,5', 'all'). Default: 'all'
- `clean_text` (optional): Clean and normalize extracted text. Default: false
- `include_metadata` (optional): Include PDF metadata in output. Default: true

**Example:**
```
Can you read the PDF at /path/to/document.pdf?
```

### 2. search-pdf

Search for specific text within a PDF file.

**Parameters:**
- `file` (required): Path to the PDF file
- `query` (required): Text to search for
- `case_sensitive` (optional): Case sensitive search. Default: false
- `whole_word` (optional): Match whole words only. Default: false

**Example:**
```
Search for "machine learning" in /path/to/document.pdf
```

### 3. pdf-metadata

Extract metadata from a PDF file.

**Parameters:**
- `file` (required): Path to the PDF file

**Example:**
```
Get metadata from /path/to/document.pdf
```

## Example Workflow

Here's how you might use this MCP server with Claude Code:

1. **Extract metadata first** to understand the document:
   ```
   What's the metadata for ~/Documents/research-paper.pdf?
   ```

2. **Search for specific topics** without reading the entire file:
   ```
   Search for "neural networks" in ~/Documents/research-paper.pdf
   ```

3. **Read specific sections** when you know what you're looking for:
   ```
   Read pages 10-15 from ~/Documents/research-paper.pdf with cleaned text
   ```

## Benefits

- **Context Efficiency**: Process large PDF files without loading everything into Claude's context
- **Faster Analysis**: Search and extract only what you need
- **Better Performance**: Reduce token usage when working with multiple or large PDFs
- **Flexible Extraction**: Choose what information to extract and how to format it

## Technical Details

- Built with the [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- Uses [pdf-parse](https://www.npmjs.com/package/pdf-parse) for PDF text extraction
- Runs as a local Node.js process communicating via stdio
- Supports all PDF versions that pdf-parse can handle

## Troubleshooting

### Server not appearing in Claude Code

1. Verify the path in your configuration file is correct
2. Ensure Node.js is installed and in your PATH
3. Check that dependencies are installed: `npm install`
4. Restart Claude Code completely
5. Check Claude Code logs for any error messages

### PDF not found errors

- Use absolute paths to PDF files
- Verify file permissions
- Ensure the PDF file exists at the specified location

### Text extraction issues

- Some PDFs (scanned images) may not contain extractable text
- Try enabling `clean_text` option for better formatting
- Complex layouts may affect text extraction quality

## Development

To modify or extend the server:

1. Edit `index.js` to add new tools or modify existing ones
2. Update the `ListToolsRequestSchema` handler to register new tools
3. Add corresponding handlers in the `CallToolRequestSchema` handler
4. Restart the server (restart Claude Code) to test changes

## License

MIT

## Contributing

Feel free to submit issues or pull requests to improve this MCP server.
