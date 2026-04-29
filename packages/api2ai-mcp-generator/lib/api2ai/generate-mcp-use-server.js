#!/usr/bin/env node

/**
 * OpenAPI to MCP Server Generator (mcp-use framework)
 * 
 * Generates a complete MCP server using the mcp-use framework from any OpenAPI spec.
 * 
 * Usage:
 *   node generate-mcp-use-server.js <openapi-spec> [output-folder] [options]
 * 
 * Examples:
 *   node generate-mcp-use-server.js ./petstore.json ./my-mcp-server
 *   node generate-mcp-use-server.js https://petstore3.swagger.io/api/v3/openapi.json ./petstore-mcp --base-url https://petstore3.swagger.io/api/v3
 */

import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// OpenAPI Spec Loading & Parsing
// ============================================================================

async function loadOpenApiSpec(specPathOrUrl) {
  if (specPathOrUrl.startsWith('http://') || specPathOrUrl.startsWith('https://')) {
    const response = await fetch(specPathOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  const content = await fs.readFile(specPathOrUrl, 'utf-8');

  if (specPathOrUrl.endsWith('.yaml') || specPathOrUrl.endsWith('.yml')) {
    const yaml = await import('js-yaml').catch(() => null);
    if (yaml) {
      return yaml.load(content);
    }
    throw new Error('YAML spec detected but js-yaml is not installed. Run: npm install js-yaml');
  }

  return JSON.parse(content);
}

// Convert OpenAPI schema to Zod schema string
function schemaToZod(schema, required = false) {
  if (!schema) return 'z.unknown()';

  let zodStr;

  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        zodStr = `z.enum([${schema.enum.map(e => `'${e}'`).join(', ')}])`;
      } else if (schema.format === 'date-time') {
        zodStr = 'z.string().datetime()';
      } else if (schema.format === 'date') {
        zodStr = 'z.string().date()';
      } else if (schema.format === 'email') {
        zodStr = 'z.string().email()';
      } else if (schema.format === 'uri' || schema.format === 'url') {
        zodStr = 'z.string().url()';
      } else {
        zodStr = 'z.string()';
      }
      break;

    case 'integer':
      zodStr = 'z.number().int()';
      break;

    case 'number':
      zodStr = 'z.number()';
      break;

    case 'boolean':
      zodStr = 'z.boolean()';
      break;

    case 'array':
      zodStr = `z.array(${schemaToZod(schema.items, true)})`;
      break;

    case 'object':
      if (schema.properties) {
        const props = Object.entries(schema.properties)
          .map(([key, val]) => {
            const isReq = schema.required?.includes(key);
            const propZod = schemaToZod(val, isReq);
            // Add description if available
            const desc = val.description ? `.describe('${val.description.replace(/'/g, "\\'")}')` : '';
            return `    ${sanitizePropertyName(key)}: ${propZod}${desc}`;
          })
          .join(',\n');
        zodStr = `z.object({\n${props}\n  })`;
      } else if (schema.additionalProperties) {
        zodStr = `z.record(z.string(), ${schemaToZod(schema.additionalProperties, true)})`;
      } else {
        zodStr = 'z.record(z.string(), z.unknown())';
      }
      break;

    default:
      // Handle anyOf, oneOf, allOf
      if (schema.anyOf) {
        const options = schema.anyOf.map(s => schemaToZod(s, true)).join(', ');
        zodStr = `z.union([${options}])`;
      } else if (schema.oneOf) {
        const options = schema.oneOf.map(s => schemaToZod(s, true)).join(', ');
        zodStr = `z.union([${options}])`;
      } else {
        zodStr = 'z.unknown()';
      }
  }

  // Add optional if not required
  if (!required) {
    zodStr += '.optional()';
  }

  return zodStr;
}

// Sanitize property name for JS object key
function sanitizePropertyName(name) {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name;
  }
  return `'${name}'`;
}

// Build Zod schema for tool parameters
function buildZodSchema(operation, pathParams) {
  const allParams = [...(pathParams || []), ...(operation.parameters || [])];
  const properties = [];

  for (const param of allParams) {
    const schema = param.schema || { type: 'string' };
    const zodType = schemaToZod(schema, param.required);
    const desc = param.description ? `.describe('${param.description.replace(/'/g, "\\'")}')` : '';
    properties.push(`    ${sanitizePropertyName(param.name)}: ${zodType}${desc}`);
  }

  // Handle request body
  if (operation.requestBody) {
    const content = operation.requestBody.content;
    const mediaType = content?.['application/json'] || Object.values(content || {})[0];

    if (mediaType?.schema) {
      const zodType = schemaToZod(mediaType.schema, operation.requestBody.required);
      const desc = operation.requestBody.description
        ? `.describe('${operation.requestBody.description.replace(/'/g, "\\'")}')`
        : `.describe('Request body')`;
      properties.push(`    requestBody: ${zodType}${desc}`);
    }
  }

  if (properties.length === 0) {
    return 'z.object({})';
  }

  return `z.object({\n${properties.join(',\n')}\n  })`;
}

// Extract tools from OpenAPI spec
function extractTools(spec, options = {}) {
  const tools = [];
  const { baseUrl: overrideBaseUrl, excludeOperationIds = [], filterFn } = options;

  let baseUrl = overrideBaseUrl;
  if (!baseUrl && spec.servers && spec.servers.length > 0) {
    baseUrl = spec.servers[0].url;
  }

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths || {})) {
    const pathParams = pathItem.parameters || [];

    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']) {
      const operation = pathItem[method];
      if (!operation) continue;

      const operationId = operation.operationId ||
        `${method}_${pathTemplate.replace(/[^a-zA-Z0-9]/g, '_')}`;

      if (excludeOperationIds.includes(operationId)) continue;

      // Build tool name (sanitized)
      const name = operationId
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const description = operation.summary ||
        operation.description ||
        `${method.toUpperCase()} ${pathTemplate}`;

      // Build Zod schema string
      const zodSchema = buildZodSchema(operation, pathParams);

      // Extract execution parameters
      const allParams = [...pathParams, ...(operation.parameters || [])];
      const executionParameters = allParams.map(p => ({
        name: p.name,
        in: p.in,
      }));

      let requestBodyContentType;
      if (operation.requestBody?.content) {
        requestBodyContentType = Object.keys(operation.requestBody.content)[0];
      }

      const tool = {
        name,
        description: description.substring(0, 1024),
        zodSchema,
        method,
        pathTemplate,
        executionParameters,
        requestBodyContentType,
        operationId,
        baseUrl,
      };

      if (filterFn && !filterFn(tool)) continue;

      tools.push(tool);
    }
  }

  return tools;
}

// ============================================================================
// Code Generation
// ============================================================================

function generatePackageJson(serverName, tools, port) {
  return JSON.stringify({
    name: serverName,
    version: '1.0.0',
    description: `MCP server generated from OpenAPI spec (${tools.length} tools)`,
    type: 'module',
    main: 'src/index.js',
    scripts: {
      start: 'node src/index.js',
      dev: 'node --watch src/index.js',
    },
    dependencies: {
      'mcp-use': '^1.11.2',
      'zod': '^3.23.0',
      'dotenv': '^16.4.0',
    },
    engines: { node: '>=18.0.0' },
  }, null, 2);
}

function generateEnvFile(baseUrl, port) {
  return `# Server Configuration
PORT=${port}
NODE_ENV=development

# API Configuration
API_BASE_URL=${baseUrl || 'https://api.example.com'}

# Authentication (uncomment and configure as needed)
# API_KEY=your-api-key
# API_AUTH_HEADER=X-Custom-Auth:your-token

# MCP Server URL (for UI widgets in production)
# MCP_URL=https://your-production-url.com

# Allowed Origins (comma-separated, for production)
# ALLOWED_ORIGINS=https://app1.com,https://app2.com
`;
}

function generateEnvExampleFile(baseUrl, port) {
  return `# Server Configuration
PORT=${port}
NODE_ENV=development

# API Configuration  
API_BASE_URL=${baseUrl || 'https://api.example.com'}

# Authentication
API_KEY=your-api-key-here
# API_AUTH_HEADER=Header-Name:header-value

# MCP Configuration
# MCP_URL=https://your-mcp-server.com
# ALLOWED_ORIGINS=https://allowed-origin.com
`;
}

function generateHttpClient() {
  return `// HTTP client for API requests

/**
 * Build URL with path parameters substituted
 */
export function buildUrl(baseUrl, pathTemplate, pathParams = {}) {
  let url = pathTemplate;
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(\`{\${key}}\`, encodeURIComponent(String(value)));
  }
  return new URL(url, baseUrl).toString();
}

/**
 * Build query string from parameters
 */
export function buildQueryString(queryParams = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  }
  return params.toString();
}

/**
 * Execute HTTP request for a tool
 */
export async function executeRequest(toolConfig, args, config = {}) {
  const { baseUrl: configBaseUrl, headers: configHeaders = {} } = config;
  const baseUrl = configBaseUrl || toolConfig.baseUrl;
  
  if (!baseUrl) {
    throw new Error(\`No base URL configured for tool: \${toolConfig.name}\`);
  }
  
  // Separate parameters by location
  const pathParams = {};
  const queryParams = {};
  const headerParams = {};
  let body;
  
  for (const param of toolConfig.executionParameters || []) {
    const value = args[param.name];
    if (value === undefined) continue;
    
    switch (param.in) {
      case 'path':
        pathParams[param.name] = value;
        break;
      case 'query':
        queryParams[param.name] = value;
        break;
      case 'header':
        headerParams[param.name] = value;
        break;
    }
  }
  
  // Handle request body
  if (args.requestBody !== undefined) {
    body = args.requestBody;
  }
  
  // Build URL
  let url = buildUrl(baseUrl, toolConfig.pathTemplate, pathParams);
  
  // Add query parameters
  const queryString = buildQueryString(queryParams);
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  // Build headers
  const headers = {
    'Accept': 'application/json',
    ...configHeaders,
    ...headerParams,
  };
  
  // Set content type for request body
  if (body !== undefined) {
    headers['Content-Type'] = toolConfig.requestBodyContentType || 'application/json';
  }
  
  // Build request options
  const requestOptions = {
    method: toolConfig.method.toUpperCase(),
    headers,
  };
  
  if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(requestOptions.method)) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  // Execute request
  const response = await fetch(url, requestOptions);
  
  // Parse response
  const contentType = response.headers.get('content-type') || '';
  let data;
  
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  return {
    status: response.status,
    statusText: response.statusText,
    data,
    ok: response.ok,
  };
}
`;
}

function generateToolsConfig(tools) {
  const toolConfigs = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    method: tool.method,
    pathTemplate: tool.pathTemplate,
    executionParameters: tool.executionParameters,
    requestBodyContentType: tool.requestBodyContentType,
    baseUrl: tool.baseUrl,
  }));

  return `// Tool configurations extracted from OpenAPI spec
// Generated: ${new Date().toISOString()}

export const toolConfigs = ${JSON.stringify(toolConfigs, null, 2)};

// Create a map for quick lookup
export const toolConfigMap = new Map(toolConfigs.map(t => [t.name, t]));
`;
}

function generateServerIndex(serverName, tools, baseUrl, port) {
  // Generate tool registration code using proper MCP format
  const toolRegistrations = tools.map(tool => {
    return `
// ${tool.description}
server.tool(
  {
    name: '${tool.name}',
    description: '${tool.description.replace(/'/g, "\\'")}',
    schema: ${tool.zodSchema},
  },
  async (params) => {
    const toolConfig = toolConfigMap.get('${tool.name}');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (!result.ok) {
      return text(\`Error: \${result.status} \${result.statusText}\\n\${
        typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)
      }\`);
    }

    // Return MCP content based on response type
    if (typeof result.data === 'string') {
      return text(result.data);
    } else if (typeof result.data === 'object' && result.data !== null) {
      return object(result.data);
    } else {
      return text(String(result.data));
    }
  }
);`;
  }).join('\n');

  return `#!/usr/bin/env node

/**
 * ${serverName} - MCP Server
 *
 * Features:
 * - ${tools.length} API tools available
 * - Built-in Inspector at http://localhost:${port}/inspector
 */

import 'dotenv/config';
import { MCPServer } from 'mcp-use/server';
import { text, object } from 'mcp-use/server';
import { z } from 'zod';
import { executeRequest } from './http-client.js';
import { toolConfigMap } from './tools-config.js';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '${port}');
const isDev = process.env.NODE_ENV !== 'production';

// API configuration
const apiConfig = {
  baseUrl: process.env.API_BASE_URL || ${baseUrl ? `'${baseUrl}'` : 'null'},
  headers: {},
};

// Set up authentication headers
if (process.env.API_KEY) {
  apiConfig.headers['Authorization'] = \`Bearer \${process.env.API_KEY}\`;
}

if (process.env.API_AUTH_HEADER) {
  const [key, ...valueParts] = process.env.API_AUTH_HEADER.split(':');
  const value = valueParts.join(':'); // Handle values with colons
  if (key && value) {
    apiConfig.headers[key.trim()] = value.trim();
  }
}

// ============================================================================
// Server Setup
// ============================================================================

const server = new MCPServer({
  name: '${serverName}',
  version: '1.0.0',
  description: 'MCP server generated from OpenAPI specification',
  baseUrl: process.env.MCP_URL || \`http://localhost:\${PORT}\`,
  allowedOrigins: isDev 
    ? undefined  // Development: allow all origins
    : process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [],
});

// ============================================================================
// Tool Registrations
// ============================================================================
${toolRegistrations}

// ============================================================================
// Start Server
// ============================================================================

server.listen(PORT);

console.log(\`
🚀 ${serverName} MCP Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Server:    http://localhost:\${PORT}
🔍 Inspector: http://localhost:\${PORT}/inspector
📡 MCP:       http://localhost:\${PORT}/mcp
🔄 SSE:       http://localhost:\${PORT}/sse

🛠️  Tools Available: ${tools.length}
${tools.slice(0, 5).map(t => `   • ${t.name}`).join('\n')}${tools.length > 5 ? `\n   ... and ${tools.length - 5} more` : ''}
Environment: \${isDev ? 'Development' : 'Production'}
API Base:    \${apiConfig.baseUrl || 'Not configured'}
\`);
`;
}

function generateReadme(serverName, tools, specPath, baseUrl, port) {
  const toolList = tools
    .map(t => `| \`${t.name}\` | ${t.method.toUpperCase()} | ${t.pathTemplate} | ${t.description.substring(0, 50)}${t.description.length > 50 ? '...' : ''} |`)
    .join('\n');

  return `# ${serverName}

MCP server auto-generated from OpenAPI specification using the [mcp-use](https://mcp-use.com) framework.

## Features

- 🛠️ **${tools.length} API Tools** - All operations from the OpenAPI spec
- 🔍 **Built-in Inspector** - Test tools at \`/inspector\`
- 📡 **Streamable HTTP** - Modern MCP transport
- 🔐 **Authentication Support** - Bearer tokens & custom headers
- 🎨 **UI Widgets** - Compatible with ChatGPT and MCP-UI

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start the server
npm start

# Or with hot reload
npm run dev
\`\`\`

Then open http://localhost:${port}/inspector to test your tools!

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`PORT\` | Server port | ${port} |
| \`NODE_ENV\` | Environment (development/production) | development |
| \`API_BASE_URL\` | Base URL for API requests | ${baseUrl || 'From OpenAPI spec'} |
| \`API_KEY\` | Bearer token for Authorization header | - |
| \`API_AUTH_HEADER\` | Custom auth header (format: \`Header:value\`) | - |
| \`MCP_URL\` | Public MCP server URL (for widgets) | http://localhost:${port} |
| \`ALLOWED_ORIGINS\` | Allowed origins in production (comma-separated) | - |

## Connect to Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
**Windows**: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

\`\`\`json
{
  "mcpServers": {
    "${serverName}": {
      "url": "http://localhost:${port}/mcp"
    }
  }
}
\`\`\`

## Connect to ChatGPT

This server supports the OpenAI Apps SDK. Configure your ChatGPT integration to use:

\`\`\`
http://localhost:${port}/mcp
\`\`\`

## Available Tools

| Tool | Method | Path | Description |
|------|--------|------|-------------|
${toolList}

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| \`GET /inspector\` | Interactive tool testing UI |
| \`POST /mcp\` | MCP protocol endpoint |
| \`GET /sse\` | Server-Sent Events endpoint |
| \`GET /health\` | Health check endpoint |

## Project Structure

\`\`\`
${serverName}/
├── .env              # Environment configuration
├── .env.example      # Example environment file
├── package.json      # Dependencies
├── README.md         # This file
└── src/
    ├── index.js        # Main server with MCP tool registrations
    ├── http-client.js  # HTTP utilities for API calls
    └── tools-config.js # Tool configurations from OpenAPI spec
\`\`\`

## How It Works

Each tool is registered using the proper MCP format:

\`\`\`javascript
server.tool(
  {
    name: 'getPetById',
    description: 'Find pet by ID',
    schema: z.object({
      petId: z.number().int().describe('ID of pet to return'),
    }),
  },
  async (params) => {
    // Fetch data from the API
    const result = await executeRequest(toolConfig, params, apiConfig);

    // Return MCP content (text or object)
    return result.ok ? object(result.data) : text(\`Error: \${result.status}\`);
  }
);
\`\`\`

## Production Deployment

### Docker

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE ${port}
CMD ["npm", "start"]
\`\`\`

### PM2

\`\`\`bash
pm2 start src/index.js --name ${serverName}
\`\`\`

## Source

- **OpenAPI Spec**: \`${specPath}\`
- **Generated**: ${new Date().toISOString()}
- **Framework**: [mcp-use](https://mcp-use.com)

## License

MIT
`;
}

// ============================================================================
// Main Generator
// ============================================================================

async function generateMcpServer(specPathOrUrl, outputFolder, options = {}) {
  const {
    baseUrl,
    serverName = 'openapi-mcp-server',
    port = 3000,
  } = options;

  console.log(`\n📖 Loading OpenAPI spec: ${specPathOrUrl}`);
  const spec = await loadOpenApiSpec(specPathOrUrl);

  console.log(`   Title: ${spec.info?.title || 'Unknown'}`);
  console.log(`   Version: ${spec.info?.version || 'Unknown'}`);

  const tools = extractTools(spec, { baseUrl, ...options });
  console.log(`✅ Extracted ${tools.length} tools\n`);

  // Create directory structure
  const srcDir = path.join(outputFolder, 'src');
  await fs.mkdir(srcDir, { recursive: true });

  const effectiveBaseUrl = baseUrl || tools[0]?.baseUrl;

  // Generate all files
  const files = [
    {
      path: path.join(outputFolder, 'package.json'),
      content: generatePackageJson(serverName, tools, port)
    },
    {
      path: path.join(outputFolder, '.env'),
      content: generateEnvFile(effectiveBaseUrl, port)
    },
    {
      path: path.join(outputFolder, '.env.example'),
      content: generateEnvExampleFile(effectiveBaseUrl, port)
    },
    {
      path: path.join(srcDir, 'http-client.js'),
      content: generateHttpClient()
    },
    {
      path: path.join(srcDir, 'tools-config.js'),
      content: generateToolsConfig(tools)
    },
    {
      path: path.join(srcDir, 'index.js'),
      content: generateServerIndex(serverName, tools, effectiveBaseUrl, port)
    },
    {
      path: path.join(outputFolder, 'README.md'),
      content: generateReadme(serverName, tools, specPathOrUrl, effectiveBaseUrl, port)
    },
    {
      path: path.join(outputFolder, '.gitignore'),
      content: 'node_modules/\n.env\n*.log\n'
    },
  ];

  for (const file of files) {
    await fs.writeFile(file.path, file.content);
    console.log(`  ✓ ${path.relative(outputFolder, file.path)}`);
  }

  console.log(`
🎉 MCP-Use Server Generated 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


  cd ${outputFolder}
  npm install
  npm start

Then open http://localhost:${port}/inspector to test your tools!
`);

  return {
    outputFolder,
    toolCount: tools.length,
    tools: tools.map(t => t.name),
    port,
  };
}

// ============================================================================
// Exports & CLI
// ============================================================================

export { generateMcpServer, extractTools, loadOpenApiSpec };

// CLI entry point
const isMainModule = process.argv[1]?.includes('api2ai');

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    console.log(`
OpenAPI to MCP Server Generator (mcp-use framework)

Usage:
  npx api2ai <openapi-spec> [output-folder] [options]

Arguments:
  openapi-spec    Path to local file or URL to remote OpenAPI spec
  output-folder   Directory to create the server in (default: ./mcp-server)

Options:
  --name <name>   Server name (default: openapi-mcp-server)
  --base-url <url> Override API base URL from the spec
  --port <port>   Server port (default: 3000)
  --help, -h      Show this help message

Examples:
  npx api2ai ./petstore.json ./my-server
  npx api2ai https://petstore3.swagger.io/api/v3/openapi.json ./petstore-mcp \\
    --name petstore-api --port 8080
`);
    process.exit(0);
  }

  const options = {
    specPath: args[0],
    outputFolder: './mcp-server',
    baseUrl: null,
    serverName: 'api-mcp-server',
    port: 3000,
  };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--base-url' && args[i + 1]) {
      options.baseUrl = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      options.serverName = args[++i];
    } else if (args[i] === '--port' && args[i + 1]) {
      options.port = parseInt(args[++i]);
    } else if (!args[i].startsWith('--')) {
      options.outputFolder = args[i];
    }
  }

  generateMcpServer(options.specPath, options.outputFolder, options).catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  });
}
