# Introducing PDF Reader MCP Server: Efficient PDF Analysis for Claude Code

I'm excited to announce the release of **PDF Reader MCP Server**, a new Model Context Protocol server that makes working with PDF files in Claude Code dramatically more efficient.

## The Problem

If you've ever tried to analyze large PDF documents with Claude, you know the pain: you paste in the entire text, it consumes massive amounts of context, and you're left with fewer tokens for actual analysis. For a 100-page document, this can easily eat up your entire context window before you even ask a question.

## The Solution

The PDF Reader MCP Server solves this by providing three specialized tools that let Claude work with PDFs intelligently:

### 🔍 **search-pdf** - Find What You Need
Search for specific terms or phrases within a PDF without loading the entire document. Get results with surrounding context, perfect for quickly locating relevant sections.

### 📄 **read-pdf** - Smart Text Extraction
Extract text from PDFs with options for cleaning and formatting. Only read what you need, when you need it.

### 📊 **pdf-metadata** - Document Intelligence
Get instant access to PDF metadata: page count, author, creation date, and more. Perfect for understanding documents before diving in.

## Why This Matters

Instead of dumping entire PDFs into your context, you can now:
- Search first, then read only relevant sections
- Check metadata to understand document structure
- Save massive amounts of context for actual analysis
- Work with multiple large PDFs in a single session

## Getting Started

Installation is simple:

```bash
# Install globally via npm
npm install -g @hancengiz/pdf-reader-mcp-server

# Add to Claude Code (easiest method)
claude mcp add pdf-reader npx @hancengiz/pdf-reader-mcp-server
```

That's it! Restart Claude Code and you'll have access to all three PDF tools.

## Real-World Example

Let's say you're analyzing a 200-page research paper about AI:

**Old way:**
- Copy entire 200 pages → paste into Claude
- Context: ~150,000 tokens gone
- Remaining context for analysis: minimal

**New way:**
```
1. "What's the metadata for research-paper.pdf?"
   → 26 pages, published March 2025, author info

2. "Search for 'neural networks' in the paper"
   → Found 47 matches with context

3. "Read pages 15-20 about transformer architecture"
   → Only loads those specific pages

Context used: ~5,000 tokens
Remaining for deep analysis: plenty!
```

## The Technical Details

Built on the Model Context Protocol SDK and using pdf-parse for extraction, the server runs locally and communicates with Claude via stdio. It's fast, secure, and works with any PDF that contains extractable text.

The entire project is open source and available on:
- **npm**: [@hancengiz/pdf-reader-mcp-server](https://www.npmjs.com/package/@hancengiz/pdf-reader-mcp-server)
- **GitHub**: [hancengiz/read_pdf_as_text_mcp](https://github.com/hancengiz/read_pdf_as_text_mcp)

## What's Next?

I built this to scratch my own itch - I was constantly frustrated by context limitations when analyzing PDF documents. If you work with PDFs regularly, I think you'll find it invaluable.

Try it out and let me know what you think! Issues, suggestions, and PRs are welcome on GitHub.

---

*Built with Claude Code - yes, the irony of using Claude to build a tool that makes Claude better at handling PDFs is not lost on me. 😄*
