/**
 * Browser-compatible OpenAPI to MCP Server Generator
 *
 * Generates a complete MCP server as a file map that can be zipped and downloaded.
 */

import type { OpenAPISpec, OperationObject, SchemaObject } from './types';

export interface McpServerOptions {
  serverName?: string;
  port?: number;
  baseUrl?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

interface Tool {
  name: string;
  description: string;
  zodSchema: string;
  method: string;
  pathTemplate: string;
  executionParameters: Array<{ name: string; in: string }>;
  requestBodyContentType?: string;
  operationId: string;
  baseUrl?: string;
}

// Convert OpenAPI schema to Zod schema string
function schemaToZod(schema: SchemaObject | undefined, required = false): string {
  if (!schema) return 'z.unknown()';

  let zodStr: string;

  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        zodStr = `z.enum([${(schema.enum as string[]).map(e => `'${e}'`).join(', ')}])`;
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
      zodStr = `z.array(${schemaToZod(schema.items as SchemaObject, true)})`;
      break;

    case 'object':
      if (schema.properties) {
        const props = Object.entries(schema.properties)
          .map(([key, val]) => {
            const isReq = (schema.required as string[] | undefined)?.includes(key);
            const propZod = schemaToZod(val as SchemaObject, isReq);
            const desc = (val as SchemaObject).description
              ? `.describe('${(val as SchemaObject).description?.replace(/'/g, "\\'")}')`
              : '';
            return `    ${sanitizePropertyName(key)}: ${propZod}${desc}`;
          })
          .join(',\n');
        zodStr = `z.object({\n${props}\n  })`;
      } else if (schema.additionalProperties) {
        zodStr = `z.record(z.string(), ${schemaToZod(schema.additionalProperties as SchemaObject, true)})`;
      } else {
        zodStr = 'z.record(z.string(), z.unknown())';
      }
      break;

    default:
      if (schema.anyOf) {
        const options = (schema.anyOf as SchemaObject[]).map(s => schemaToZod(s, true)).join(', ');
        zodStr = `z.union([${options}])`;
      } else if (schema.oneOf) {
        const options = (schema.oneOf as SchemaObject[]).map(s => schemaToZod(s, true)).join(', ');
        zodStr = `z.union([${options}])`;
      } else {
        zodStr = 'z.unknown()';
      }
  }

  if (!required) {
    zodStr += '.optional()';
  }

  return zodStr;
}

function sanitizePropertyName(name: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name;
  }
  return `'${name}'`;
}

interface ParameterObject {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

function buildZodSchema(operation: OperationObject, pathParams: ParameterObject[]): string {
  const allParams = [...(pathParams || []), ...((operation.parameters || []) as ParameterObject[])];
  const properties: string[] = [];

  for (const param of allParams) {
    const schema = param.schema || { type: 'string' as const };
    const zodType = schemaToZod(schema as SchemaObject, param.required);
    const desc = param.description ? `.describe('${param.description.replace(/'/g, "\\'")}')` : '';
    properties.push(`    ${sanitizePropertyName(param.name)}: ${zodType}${desc}`);
  }

  if (operation.requestBody) {
    const content = (operation.requestBody as { content?: Record<string, { schema?: SchemaObject }> }).content;
    const mediaType = content?.['application/json'] || Object.values(content || {})[0];

    if (mediaType?.schema) {
      const zodType = schemaToZod(mediaType.schema, (operation.requestBody as { required?: boolean }).required);
      const desc = (operation.requestBody as { description?: string }).description
        ? `.describe('${(operation.requestBody as { description?: string }).description?.replace(/'/g, "\\'")}')`
        : `.describe('Request body')`;
      properties.push(`    requestBody: ${zodType}${desc}`);
    }
  }

  if (properties.length === 0) {
    return 'z.object({})';
  }

  return `z.object({\n${properties.join(',\n')}\n  })`;
}

export function extractTools(spec: OpenAPISpec, options: { baseUrl?: string } = {}): Tool[] {
  const tools: Tool[] = [];
  const { baseUrl: overrideBaseUrl } = options;

  let baseUrl = overrideBaseUrl;
  if (!baseUrl && spec.servers && spec.servers.length > 0) {
    baseUrl = spec.servers[0].url;
  }

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths || {})) {
    const pathParams = ((pathItem as { parameters?: ParameterObject[] }).parameters || []) as ParameterObject[];

    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const) {
      const operation = (pathItem as Record<string, OperationObject>)[method] as OperationObject | undefined;
      if (!operation) continue;

      const operationId = operation.operationId ||
        `${method}_${pathTemplate.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const name = operationId
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const description = operation.summary ||
        operation.description ||
        `${method.toUpperCase()} ${pathTemplate}`;

      const zodSchema = buildZodSchema(operation, pathParams);

      const allParams = [...pathParams, ...((operation.parameters || []) as ParameterObject[])];
      const executionParameters = allParams.map(p => ({
        name: p.name,
        in: p.in,
      }));

      let requestBodyContentType: string | undefined;
      if (operation.requestBody) {
        const content = (operation.requestBody as { content?: Record<string, unknown> }).content;
        if (content) {
          requestBodyContentType = Object.keys(content)[0];
        }
      }

      tools.push({
        name,
        description: description.substring(0, 1024),
        zodSchema,
        method,
        pathTemplate,
        executionParameters,
        requestBodyContentType,
        operationId,
        baseUrl,
      });
    }
  }

  return tools;
}

function generatePackageJson(serverName: string, tools: Tool[], port: number): string {
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

function generateEnvFile(baseUrl: string | undefined, port: number): string {
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

function generateEnvExampleFile(baseUrl: string | undefined, port: number): string {
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

function generateHttpClient(): string {
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

function generateToolsConfig(tools: Tool[]): string {
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

function generateServerIndex(serverName: string, tools: Tool[], baseUrl: string | undefined, port: number): string {
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

function generateReadme(serverName: string, tools: Tool[], baseUrl: string | undefined, port: number): string {
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

- **Generated**: ${new Date().toISOString()}
- **Framework**: [mcp-use](https://mcp-use.com)

## License

MIT
`;
}

/**
 * Generate MCP server files from an OpenAPI spec
 * Returns a map of file paths to file contents
 */
export function generateMcpServerFiles(
  spec: OpenAPISpec,
  options: McpServerOptions = {}
): GeneratedFile[] {
  const {
    serverName = 'openapi-mcp-server',
    port = 3000,
    baseUrl,
  } = options;

  const tools = extractTools(spec, { baseUrl });
  const effectiveBaseUrl = baseUrl || tools[0]?.baseUrl;

  const files: GeneratedFile[] = [
    {
      path: 'package.json',
      content: generatePackageJson(serverName, tools, port),
    },
    {
      path: '.env',
      content: generateEnvFile(effectiveBaseUrl, port),
    },
    {
      path: '.env.example',
      content: generateEnvExampleFile(effectiveBaseUrl, port),
    },
    {
      path: 'src/http-client.js',
      content: generateHttpClient(),
    },
    {
      path: 'src/tools-config.js',
      content: generateToolsConfig(tools),
    },
    {
      path: 'src/index.js',
      content: generateServerIndex(serverName, tools, effectiveBaseUrl, port),
    },
    {
      path: 'README.md',
      content: generateReadme(serverName, tools, effectiveBaseUrl, port),
    },
    {
      path: '.gitignore',
      content: 'node_modules/\n.env\n*.log\n',
    },
  ];

  return files;
}

/**
 * Get the count of tools that would be generated from a spec
 */
export function getToolCount(spec: OpenAPISpec): number {
  return extractTools(spec).length;
}
