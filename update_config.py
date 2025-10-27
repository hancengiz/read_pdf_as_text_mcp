#!/usr/bin/env python3
import json
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
index_path = os.path.join(script_dir, "index.js")

# Path to the .claude.json file
config_path = os.path.expanduser("~/.claude.json")

# Read the existing config
with open(config_path, 'r') as f:
    config = json.load(f)

# Add the PDF reader MCP server to the global mcpServers
if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"]["pdf-reader"] = {
    "command": "node",
    "args": [index_path]
}

# Write back the updated config
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("Successfully added pdf-reader MCP server to ~/.claude.json")
print(f"Server path: {index_path}")
print("\nMCP Servers configured:")
for server_name in config["mcpServers"]:
    print(f"  - {server_name}")
