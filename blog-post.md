# Introducing PDF Reader MCP Server: Efficient PDF Analysis for Claude Code

I'm excited to announce the release of **PDF Reader MCP Server**, a new Model Context Protocol server that makes working with PDF files in Claude Code dramatically more efficient.

## The Problem

As someone who regularly works with research PDFs from major consulting firms (think McKinsey, BCG, Deloitte), I was constantly hitting the same frustrating wall. These documents are gold mines of insights that I use to:
- Learn about industry trends and best practices
- Pull context and data for my blog posts
- Create educational materials for my work
- Stay current with research in my field

But here's the thing: these PDFs are massive. Not just because of the content, but because they're packed with formatting, styling, charts, images, and visual elements. A 26-page research report can easily be 5MB+ with hundreds of decorative elements. All I want is the text - to search it, understand it, and extract meaningful insights.

If you've ever tried to analyze these documents with Claude, you know the pain: you paste in the entire text, it consumes massive amounts of context, and you're left with fewer tokens for actual analysis. A single consulting report can eat up your entire context window before you even ask your first question.

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

## Real-World Example: My Actual Use Case

Here's how I used it just last week with a McKinsey research report on AI adoption:

**The old, painful way:**
- Download the 26-page PDF (5.6MB with all the formatting)
- Extract text → massive wall of text with image descriptions and formatting artifacts
- Paste into Claude → 150,000+ tokens consumed
- Context left for my actual questions: barely any
- Result: Can't even ask follow-up questions or include other sources

**The new way with PDF Reader MCP:**
```
1. "What's the metadata for this McKinsey AI report?"
   → 26 pages, March 2025, Creator: Adobe InDesign
   → Now I know what I'm working with

2. "Search for 'workflow redesign' in the PDF"
   → Found 8 matches with surrounding context
   → I can see exactly where the relevant sections are

3. "Read the section about organizational changes for AI"
   → Extracts just that section, clean text
   → I copy this insight for my blog post

4. "Search for statistics about AI adoption rates"
   → Found 12 mentions with data points
   → Perfect for my educational materials

Context used: ~8,000 tokens
Remaining for analysis: 190,000+ tokens!
```

The difference? I can now analyze multiple consulting reports in a single session, cross-reference findings, and still have plenty of context left to synthesize everything into a coherent blog post or education document.

## The Technical Details

Built on the Model Context Protocol SDK and using pdf-parse for extraction, the server runs locally and communicates with Claude via stdio. It's fast, secure, and works with any PDF that contains extractable text.

The entire project is open source and available on:
- **npm**: [@hancengiz/pdf-reader-mcp-server](https://www.npmjs.com/package/@hancengiz/pdf-reader-mcp-server)
- **GitHub**: [hancengiz/read_pdf_as_text_mcp](https://github.com/hancengiz/read_pdf_as_text_mcp)

## What's Next?

I built this to scratch my own itch - I was constantly frustrated by context limitations when analyzing consulting research and other PDF documents. Whether you're:
- A consultant or researcher working with industry reports
- A content creator pulling insights for blog posts
- An educator creating materials from various sources
- Anyone who needs to work with large, heavily-formatted PDFs

...you'll probably find this as game-changing as I did.

Try it out and let me know what you think! Issues, suggestions, and PRs are welcome on GitHub.

---

*Built with Claude Code - yes, the irony of using Claude to build a tool that makes Claude better at handling PDFs is not lost on me. 😄*
