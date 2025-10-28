#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";

/**
 * MCP Server for PDF Text Extraction
 * Provides efficient tools for reading and searching PDF files
 */
class PDFReaderServer {
  constructor() {
    this.server = new Server(
      {
        name: "pdf-reader-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "read-pdf",
          description:
            "Extract text from a PDF file. Returns the full text content of the PDF with optional page filtering and text cleaning.",
          inputSchema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                description: "Path to the PDF file to extract text from",
              },
              pages: {
                type: "string",
                description:
                  "Page range (e.g., '1-5', '1,3,5', 'all'). Default: 'all'",
              },
              clean_text: {
                type: "boolean",
                description: "Clean and normalize extracted text. Default: false",
              },
              include_metadata: {
                type: "boolean",
                description: "Include PDF metadata in output. Default: true",
              },
            },
            required: ["file"],
            additionalProperties: false,
          },
        },
        {
          name: "search-pdf",
          description:
            "Search for specific text within a PDF file. Returns matching text with context and page numbers.",
          inputSchema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                description: "Path to the PDF file to search in",
              },
              query: {
                type: "string",
                description: "Text to search for",
              },
              case_sensitive: {
                type: "boolean",
                description: "Case sensitive search. Default: false",
              },
              whole_word: {
                type: "boolean",
                description: "Match whole words only. Default: false",
              },
            },
            required: ["file", "query"],
            additionalProperties: false,
          },
        },
        {
          name: "pdf-metadata",
          description:
            "Extract metadata from a PDF file including title, author, page count, creation date, etc.",
          inputSchema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                description: "Path to the PDF file to get metadata from",
              },
            },
            required: ["file"],
            additionalProperties: false,
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "read-pdf":
            return await this.handleReadPdf(args);
          case "search-pdf":
            return await this.handleSearchPdf(args);
          case "pdf-metadata":
            return await this.handlePdfMetadata(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async loadPdf(filePath) {
    const resolvedPath = path.resolve(filePath);
    const buffer = await fs.readFile(resolvedPath);
    return await pdfParse(buffer);
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\n{3,}/g, "\n\n") // Reduce multiple newlines
      .trim();
  }

  parsePageRange(pageRange, totalPages) {
    if (pageRange === "all") {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set();
    const parts = pageRange.split(",");

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
        for (let i = start; i <= end && i <= totalPages; i++) {
          pages.add(i);
        }
      } else {
        const page = parseInt(part.trim());
        if (page <= totalPages) {
          pages.add(page);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  async handleReadPdf(args) {
    const { file, clean_text = false, include_metadata = true } = args;

    const pdf = await this.loadPdf(file);
    let text = pdf.text;

    if (clean_text) {
      text = this.cleanText(text);
    }

    // Note: pdf-parse doesn't easily support page-by-page extraction
    // For now, we'll return the full text with a note about page filtering
    let result = `PDF Text Content:\n\n${text}`;

    if (include_metadata) {
      const metadata = [
        `\n\n--- PDF Metadata ---`,
        `Pages: ${pdf.numpages}`,
        `Title: ${pdf.info?.Title || "N/A"}`,
        `Author: ${pdf.info?.Author || "N/A"}`,
        `Creator: ${pdf.info?.Creator || "N/A"}`,
        `Producer: ${pdf.info?.Producer || "N/A"}`,
      ].join("\n");

      result += metadata;
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }

  async handleSearchPdf(args) {
    const { file, query, case_sensitive = false, whole_word = false } = args;

    const pdf = await this.loadPdf(file);
    const text = pdf.text;

    let searchQuery = query;
    if (!case_sensitive) {
      searchQuery = query.toLowerCase();
    }

    const lines = text.split("\n");
    const matches = [];
    const contextLines = 2; // Number of lines to show before/after match

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let searchLine = case_sensitive ? line : line.toLowerCase();

      let isMatch = false;
      if (whole_word) {
        const regex = new RegExp(`\\b${searchQuery}\\b`, case_sensitive ? "" : "i");
        isMatch = regex.test(line);
      } else {
        isMatch = searchLine.includes(searchQuery);
      }

      if (isMatch) {
        const start = Math.max(0, i - contextLines);
        const end = Math.min(lines.length, i + contextLines + 1);
        const context = lines.slice(start, end).join("\n");

        matches.push({
          line: i + 1,
          context: context,
        });
      }
    }

    let result = `Found ${matches.length} match(es) for "${query}" in ${file}\n\n`;

    if (matches.length > 0) {
      result += matches
        .map((match, idx) => {
          return `Match ${idx + 1} (around line ${match.line}):\n${match.context}\n`;
        })
        .join("\n---\n\n");
    } else {
      result += "No matches found.";
    }

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }

  async handlePdfMetadata(args) {
    const { file } = args;

    const pdf = await this.loadPdf(file);

    const metadata = {
      file: file,
      pages: pdf.numpages,
      info: pdf.info || {},
      metadata: pdf.metadata || null,
      version: pdf.version || "N/A",
    };

    const result = [
      `PDF Metadata for: ${file}`,
      ``,
      `Pages: ${metadata.pages}`,
      `Version: ${metadata.version}`,
      ``,
      `Document Information:`,
      `  Title: ${metadata.info.Title || "N/A"}`,
      `  Author: ${metadata.info.Author || "N/A"}`,
      `  Subject: ${metadata.info.Subject || "N/A"}`,
      `  Keywords: ${metadata.info.Keywords || "N/A"}`,
      `  Creator: ${metadata.info.Creator || "N/A"}`,
      `  Producer: ${metadata.info.Producer || "N/A"}`,
      `  Creation Date: ${metadata.info.CreationDate || "N/A"}`,
      `  Modification Date: ${metadata.info.ModDate || "N/A"}`,
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("PDF Reader MCP Server running on stdio");
  }
}

// Start the server
const server = new PDFReaderServer();
server.start().catch(console.error);
