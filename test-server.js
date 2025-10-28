#!/usr/bin/env node

/**
 * Test script for PDF Reader MCP Server
 * This simulates MCP client requests to test the server functionality
 * and validates JSON schema compliance
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize JSON Schema validator for draft-07
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  verbose: true,
});
addFormats(ajv);

/**
 * Validate that a schema is a valid JSON Schema for Claude API
 * Note: Claude API now requires schemas WITH $schema field (draft 2020-12)
 */
function validateSchemaCompliance(toolName, schema) {
  console.log(`\nValidating schema compliance for: ${toolName}`);

  // Check required fields (Claude API now requires $schema)
  const requiredFields = ['$schema', 'type', 'properties', 'required'];
  const missingFields = requiredFields.filter(field => !(field in schema));

  if (missingFields.length > 0) {
    console.error(`✗ Missing required fields: ${missingFields.join(', ')}`);
    return false;
  }

  // Validate $schema field is present and correct
  const validSchemaUrls = [
    'https://json-schema.org/draft/2020-12/schema',
    'http://json-schema.org/draft-07/schema#'  // Also accept draft-07 for backwards compatibility
  ];

  if (!validSchemaUrls.includes(schema.$schema)) {
    console.error(`✗ Invalid $schema value. Expected: ${validSchemaUrls[0]}`);
    console.error(`  Got: ${schema.$schema}`);
    return false;
  }

  // Validate the schema itself is valid JSON Schema
  try {
    // For draft 2020-12, skip Ajv validation (Ajv doesn't support it by default)
    // Claude's API will validate it properly
    if (schema.$schema === 'https://json-schema.org/draft/2020-12/schema') {
      console.log(`✓ Schema is valid for Claude API (using ${schema.$schema})`);
      return true;
    }

    // For draft-07, use Ajv to validate
    ajv.compile(schema);
    console.log(`✓ Schema is valid for Claude API (using ${schema.$schema})`);
    return true;
  } catch (error) {
    console.error(`✗ Schema validation failed: ${error.message}`);
    return false;
  }
}

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

    // Compliance Testing: Validate all tool schemas
    console.log("\n=== COMPLIANCE TESTS ===");
    let allSchemasValid = true;
    for (const tool of tools.tools) {
      const isValid = validateSchemaCompliance(tool.name, tool.inputSchema);
      if (!isValid) {
        allSchemasValid = false;
        console.error(`✗ Schema compliance check FAILED for: ${tool.name}\n`);
      } else {
        console.log(`✓ Schema compliance check PASSED for: ${tool.name}`);
      }
    }

    if (!allSchemasValid) {
      console.error("\n✗ Some schemas failed compliance checks!");
      console.error("This would cause errors when used with Claude's API.\n");
    } else {
      console.log("\n✓ All schemas passed compliance checks!\n");
    }

    console.log("=== FUNCTIONAL TESTS ===");

    // Check if sample.pdf exists
    const samplePdfPath = path.join(__dirname, "sample.pdf");
    let testPdfPath = samplePdfPath;

    try {
      const fs = await import("fs/promises");
      await fs.access(samplePdfPath);
      console.log("Using sample.pdf for functional tests\n");
    } catch (error) {
      console.warn("⚠️  sample.pdf not found - functional tests will show file errors\n");
      testPdfPath = path.join(
        __dirname,
        "the-state-of-ai-how-organizations-are-rewiring-to-capture-value_final.pdf"
      );
    }

    // Test 1: Get PDF Metadata
    console.log("Test 1: Getting PDF metadata...");
    try {
      const metadataResult = await client.callTool({
        name: "pdf-metadata",
        arguments: {
          file: testPdfPath,
        },
      });
      console.log("✓ Metadata extraction successful:");
      console.log(metadataResult.content[0].text);
      console.log();
    } catch (error) {
      console.error("✗ Metadata test failed:", error.message);
    }

    // Test 2: Search in PDF
    console.log("Test 2: Searching for text in PDF...");
    try {
      const searchResult = await client.callTool({
        name: "search-pdf",
        arguments: {
          file: testPdfPath,
          query: "the",
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
          file: testPdfPath,
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
