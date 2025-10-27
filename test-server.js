#!/usr/bin/env node

/**
 * Test script for PDF Reader MCP Server
 * This simulates MCP client requests to test the server functionality
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testServer() {
  console.log("Starting PDF Reader MCP Server test...\n");

  // Start the server process
  const serverProcess = spawn("node", [path.join(__dirname, "index.js")], {
    stdio: ["pipe", "pipe", "inherit"],
  });

  // Create client with stdio transport
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(__dirname, "index.js")],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✓ Connected to MCP server\n");

    // List available tools
    console.log("Testing: List Tools");
    const tools = await client.listTools();
    console.log(`✓ Found ${tools.tools.length} tools:`);
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test 1: Get PDF Metadata
    console.log("Test 1: Getting PDF metadata...");
    try {
      const metadataResult = await client.callTool({
        name: "pdf-metadata",
        arguments: {
          file: path.join(
            __dirname,
            "the-state-of-ai-how-organizations-are-rewiring-to-capture-value_final.pdf"
          ),
        },
      });
      console.log("✓ Metadata extraction successful:");
      console.log(metadataResult.content[0].text);
      console.log();
    } catch (error) {
      console.error("✗ Metadata test failed:", error.message);
    }

    // Test 2: Search in PDF
    console.log("Test 2: Searching for 'AI' in PDF...");
    try {
      const searchResult = await client.callTool({
        name: "search-pdf",
        arguments: {
          file: path.join(
            __dirname,
            "the-state-of-ai-how-organizations-are-rewiring-to-capture-value_final.pdf"
          ),
          query: "AI",
          case_sensitive: false,
        },
      });
      console.log("✓ Search successful:");
      const text = searchResult.content[0].text;
      // Show first 500 characters of results
      console.log(text.substring(0, 500) + "...\n");
    } catch (error) {
      console.error("✗ Search test failed:", error.message);
    }

    // Test 3: Read PDF (with metadata)
    console.log("Test 3: Reading PDF content (first 1000 chars)...");
    try {
      const readResult = await client.callTool({
        name: "read-pdf",
        arguments: {
          file: path.join(
            __dirname,
            "the-state-of-ai-how-organizations-are-rewiring-to-capture-value_final.pdf"
          ),
          clean_text: true,
          include_metadata: true,
        },
      });
      console.log("✓ Read successful:");
      const text = readResult.content[0].text;
      console.log(text.substring(0, 1000) + "...\n");
    } catch (error) {
      console.error("✗ Read test failed:", error.message);
    }

    console.log("All tests completed!");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await client.close();
    serverProcess.kill();
    process.exit(0);
  }
}

testServer().catch(console.error);
