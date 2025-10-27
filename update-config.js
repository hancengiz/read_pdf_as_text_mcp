#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

async function updateConfig() {
  try {
    const configPath = join(homedir(), '.claude.json');

    // Read existing config
    const configData = await readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Add or update the PDF reader MCP server
    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    config.mcpServers['pdf-reader'] = {
      command: 'npx',
      args: ['@hancengiz/pdf-reader-mcp-server']
    };

    // Write back the updated config
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');

    console.log('✅ Successfully updated pdf-reader MCP server in ~/.claude.json');
    console.log('\nConfiguration:');
    console.log('  command: npx');
    console.log('  args: @hancengiz/pdf-reader-mcp-server');
    console.log('\nMCP Servers configured:');
    for (const serverName in config.mcpServers) {
      console.log(`  - ${serverName}`);
    }
    console.log('\n⚠️  Please restart Claude Code for changes to take effect.');
  } catch (error) {
    console.error('Error updating config:', error.message);
    process.exit(1);
  }
}

updateConfig();
