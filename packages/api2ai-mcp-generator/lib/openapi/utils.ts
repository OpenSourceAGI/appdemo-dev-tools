import type {
  OpenAPISpec,
  PathItemObject,
  OperationObject,
  TagObject,
  SchemaObject,
  ReferenceObject,
} from './types';

/**
 * Deep clone an object using JSON serialization
 */
export function clone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (ex) {
    console.error('Clone error:', ex);
    return obj;
  }
}

/**
 * Filter out duplicate values from an array
 */
export function onlyUnique<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Sanitize path for use as HTML id
 */
export function sanitizePath(path: string): string {
  return path.replace(/[/{}]/g, '');
}

/**
 * Pre-process an OpenAPI definition to ensure all required properties exist
 */
export function preProcessDefinition(openapi: Partial<OpenAPISpec>): OpenAPISpec {
  const spec = openapi as OpenAPISpec;

  // Initialize tags external docs
  if (spec.tags) {
    for (const tag of spec.tags) {
      if (!tag.externalDocs) {
        tag.externalDocs = {};
      }
    }
  }

  // Initialize info
  if (!spec.info) {
    spec.info = { version: '1.0.0', title: 'Untitled' };
  }
  if (!spec.info.contact) {
    spec.info.contact = {};
  }
  if (!spec.info.license) {
    spec.info.license = {};
  }

  // Initialize external docs
  if (!spec.externalDocs) {
    spec.externalDocs = {};
  }

  // Initialize security
  if (!spec.security) {
    spec.security = [];
  }

  // Initialize servers
  if (!spec.servers) {
    spec.servers = [];
  }

  // Initialize paths
  if (!spec.paths) {
    spec.paths = {};
  }

  // Initialize components
  if (!spec.components) {
    spec.components = {};
  }
  if (!spec.components.links) {
    spec.components.links = {};
  }
  if (!spec.components.callbacks) {
    spec.components.callbacks = {};
  }
  if (!spec.components.schemas) {
    spec.components.schemas = {};
  }
  if (!spec.components.securitySchemes) {
    spec.components.securitySchemes = {};
  }

  // Process paths and operations
  for (const pathKey in spec.paths) {
    const path = spec.paths[pathKey];
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;

    for (const method of methods) {
      const op = path[method] as OperationObject | undefined;
      if (op) {
        if (!op.tags) op.tags = [];
        if (!op.parameters) op.parameters = [];
        if (!op.externalDocs) op.externalDocs = {};

        // Merge path-level parameters into operation
        if (path.parameters && path.parameters.length > 0) {
          for (const shared of path.parameters) {
            const seen = op.parameters.some(
              (child) => child && child.name === shared.name && child.in === shared.in
            );
            if (!seen) {
              op.parameters.push(shared);
            }
          }
        }
      }
    }
    // Remove path-level parameters after merging
    delete path.parameters;
  }

  // Ensure openapi version
  if (!spec.openapi) {
    spec.openapi = '3.0.3';
  }

  return spec;
}

/**
 * Post-process a path item to clean up empty properties
 */
function postProcessPathItem(pathItem: PathItemObject): PathItemObject {
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;

  for (const method of methods) {
    const op = pathItem[method] as OperationObject | undefined;
    if (op) {
      // Remove empty externalDocs
      if (op.externalDocs && !op.externalDocs.url) {
        delete op.externalDocs;
      }

      // Remove empty or deduplicate tags
      if (op.tags) {
        if (op.tags.length === 0) {
          delete op.tags;
        } else {
          op.tags = op.tags.filter(onlyUnique);
        }
      }

      // Process callbacks recursively
      if (op.callbacks) {
        for (const callbackKey in op.callbacks) {
          const callback = op.callbacks[callbackKey];
          for (const expKey in callback) {
            postProcessPathItem(callback[expKey]);
          }
        }
      }
    }
  }

  return pathItem;
}

/**
 * Post-process an OpenAPI definition to clean up empty properties before export
 */
export function postProcessDefinition(openapi: OpenAPISpec): OpenAPISpec {
  const def = clone(openapi);

  // Process all paths
  for (const pathKey in def.paths) {
    postProcessPathItem(def.paths[pathKey]);
  }

  // Clean up tags external docs
  if (def.tags) {
    for (const tag of def.tags) {
      if (tag.externalDocs && !tag.externalDocs.url) {
        delete tag.externalDocs;
      }
    }
  }

  // Clean up root external docs
  if (def.externalDocs && !def.externalDocs.url) {
    delete def.externalDocs;
  }

  // Clean up empty license
  if (def.info?.license && !def.info.license.name) {
    delete def.info.license;
  }

  // Clean up empty contact
  if (def.info?.contact) {
    const contact = def.info.contact;
    if (!contact.name && !contact.email && !contact.url) {
      delete def.info.contact;
    }
  }

  // Clean up empty arrays
  if (def.security?.length === 0) {
    delete def.security;
  }
  if (def.servers?.length === 0) {
    delete def.servers;
  }
  if (def.tags?.length === 0) {
    delete def.tags;
  }

  // Clean up empty components
  if (def.components) {
    if (Object.keys(def.components.schemas || {}).length === 0) {
      delete def.components.schemas;
    }
    if (Object.keys(def.components.securitySchemes || {}).length === 0) {
      delete def.components.securitySchemes;
    }
    if (Object.keys(def.components.links || {}).length === 0) {
      delete def.components.links;
    }
    if (Object.keys(def.components.callbacks || {}).length === 0) {
      delete def.components.callbacks;
    }
    if (Object.keys(def.components).length === 0) {
      delete def.components;
    }
  }

  return def;
}

/**
 * Resolve a JSON pointer reference
 */
export function resolveRef<T>(
  ref: string,
  root: OpenAPISpec
): T | undefined {
  try {
    const pointer = ref.startsWith('#') ? ref.substring(1) : ref;
    const parts = pointer.split('/').filter(Boolean);
    let current: unknown = root;

    for (const part of parts) {
      const decoded = decodeURIComponent(part.replace(/~1/g, '/').replace(/~0/g, '~'));
      if (current && typeof current === 'object' && decoded in current) {
        current = (current as Record<string, unknown>)[decoded];
      } else {
        return undefined;
      }
    }

    return current as T;
  } catch (error) {
    console.error('Error resolving $ref:', ref, error);
    return undefined;
  }
}

/**
 * Dereference an object by resolving all $ref properties
 */
export function deref<T extends object>(
  obj: T | ReferenceObject,
  defs: OpenAPISpec,
  shallow = false
): T {
  const result = clone(obj);
  const visited = new Set<string>();

  function process(current: unknown, path: string): unknown {
    if (!current || typeof current !== 'object') {
      return current;
    }

    if (Array.isArray(current)) {
      return current.map((item, index) => process(item, `${path}[${index}]`));
    }

    const record = current as Record<string, unknown>;

    if ('$ref' in record && typeof record.$ref === 'string') {
      const ref = record.$ref;
      if (visited.has(ref)) {
        return current; // Circular reference
      }
      visited.add(ref);

      const resolved = resolveRef<object>(ref, defs);
      if (resolved) {
        const derefed = shallow ? resolved : process(resolved, ref);
        // Merge resolved properties, excluding $ref
        const { $ref, ...rest } = record;
        return { ...(derefed as object), ...rest };
      }
    }

    const processed: Record<string, unknown> = {};
    for (const key in record) {
      processed[key] = process(record[key], `${path}/${key}`);
    }
    return processed;
  }

  return process(result, '#') as T;
}

/**
 * Create a default empty OpenAPI spec
 */
export function createEmptySpec(): OpenAPISpec {
  return preProcessDefinition({
    openapi: '3.0.3',
    info: {
      title: 'New API',
      version: '1.0.0',
      description: '',
    },
    paths: {},
  });
}

/**
 * Create a default operation
 */
export function createDefaultOperation(): OperationObject {
  return {
    summary: '',
    description: '',
    operationId: '',
    parameters: [],
    responses: {
      '200': {
        description: 'Successful response',
      },
    },
    tags: [],
    externalDocs: {},
  };
}

/**
 * Create a default parameter
 */
export function createDefaultParameter() {
  return {
    name: 'newParam',
    in: 'query' as const,
    required: false,
    schema: {
      type: 'string' as const,
    },
  };
}

/**
 * Create a default response
 */
export function createDefaultResponse() {
  return {
    description: 'Response description',
  };
}

/**
 * Create a default request body
 */
export function createDefaultRequestBody() {
  return {
    required: false,
    content: {
      'application/json': {
        schema: {},
      },
    },
  };
}

/**
 * Create a default server
 */
export function createDefaultServer() {
  return {
    url: 'https://api.example.com',
    description: '',
  };
}

/**
 * Create a default tag
 */
export function createDefaultTag(): TagObject {
  return {
    name: 'newTag',
    description: '',
    externalDocs: {},
  };
}

/**
 * Create a default security scheme
 */
export function createDefaultSecurityScheme() {
  return {
    type: 'apiKey' as const,
    name: 'api_key',
    in: 'query' as const,
  };
}

/**
 * Convert OpenAPI spec to YAML string
 */
export async function toYaml(spec: OpenAPISpec): Promise<string> {
  const yaml = await import('js-yaml');
  return yaml.dump(postProcessDefinition(spec), {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}

/**
 * Convert OpenAPI spec to JSON string
 */
export function toJson(spec: OpenAPISpec): string {
  return JSON.stringify(postProcessDefinition(spec), null, 2);
}

/**
 * Parse YAML or JSON string to OpenAPI spec
 */
export async function parseSpec(input: string): Promise<OpenAPISpec> {
  let spec: OpenAPISpec;

  try {
    // Try JSON first
    spec = JSON.parse(input);
  } catch {
    // Try YAML
    const yaml = await import('js-yaml');
    spec = yaml.load(input) as OpenAPISpec;
  }

  return preProcessDefinition(spec);
}

/**
 * Validate that a spec is OpenAPI 3.x
 */
export function isValidOpenAPI3(spec: unknown): spec is OpenAPISpec {
  if (!spec || typeof spec !== 'object') return false;
  const s = spec as Record<string, unknown>;
  return typeof s.openapi === 'string' && s.openapi.startsWith('3.');
}

/**
 * Check if a spec is Swagger 2.0
 */
export function isSwagger2(spec: unknown): boolean {
  if (!spec || typeof spec !== 'object') return false;
  const s = spec as Record<string, unknown>;
  return s.swagger === '2.0';
}

/**
 * Convert Swagger 2.0 to OpenAPI 3.0
 */
export function convertSwagger2ToOpenAPI3(swagger: Record<string, unknown>): OpenAPISpec {
  const info = swagger.info as Record<string, unknown> || {};
  const paths = swagger.paths as Record<string, Record<string, unknown>> || {};
  const definitions = swagger.definitions as Record<string, unknown> || {};
  const securityDefinitions = swagger.securityDefinitions as Record<string, unknown> || {};
  const basePath = (swagger.basePath as string) || '';
  const host = swagger.host as string;
  const schemes = (swagger.schemes as string[]) || ['https'];

  // Convert servers
  const servers: Array<{ url: string; description?: string }> = [];
  if (host) {
    const scheme = schemes[0] || 'https';
    servers.push({
      url: `${scheme}://${host}${basePath}`,
      description: 'Default server',
    });
  }

  // Convert paths
  const convertedPaths: Record<string, PathItemObject> = {};

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    const convertedPathItem: PathItemObject = {};

    for (const [method, operation] of Object.entries(pathItem)) {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        const op = operation as Record<string, unknown>;
        const parameters = (op.parameters as Array<Record<string, unknown>>) || [];

        // Separate body parameters from others
        const bodyParams = parameters.filter(p => p.in === 'body');
        const otherParams = parameters.filter(p => p.in !== 'body' && p.in !== 'formData');
        const formDataParams = parameters.filter(p => p.in === 'formData');

        // Convert parameters
        const convertedParams = otherParams.map(p => ({
          name: p.name as string,
          in: p.in as 'query' | 'header' | 'path' | 'cookie',
          description: p.description as string | undefined,
          required: p.required as boolean | undefined,
          schema: p.type ? {
            type: p.type as SchemaObject['type'],
            format: p.format as string | undefined,
            enum: p.enum as unknown[] | undefined,
          } : undefined,
        }));

        // Convert request body
        let requestBody = undefined;
        if (bodyParams.length > 0) {
          const bodyParam = bodyParams[0];
          const schema = bodyParam.schema as Record<string, unknown> || {};
          requestBody = {
            description: bodyParam.description as string | undefined,
            required: bodyParam.required as boolean | undefined,
            content: {
              'application/json': {
                schema: convertSchema(schema),
              },
            },
          };
        } else if (formDataParams.length > 0) {
          const consumes = (op.consumes as string[]) || ['application/x-www-form-urlencoded'];
          const contentType = consumes.includes('multipart/form-data')
            ? 'multipart/form-data'
            : 'application/x-www-form-urlencoded';

          const properties: Record<string, SchemaObject> = {};
          const required: string[] = [];

          for (const param of formDataParams) {
            properties[param.name as string] = {
              type: param.type as SchemaObject['type'],
              format: param.format as string | undefined,
              description: param.description as string | undefined,
            };
            if (param.required) {
              required.push(param.name as string);
            }
          }

          requestBody = {
            content: {
              [contentType]: {
                schema: {
                  type: 'object' as const,
                  properties,
                  required: required.length > 0 ? required : undefined,
                },
              },
            },
          };
        }

        // Convert responses
        const responses = (op.responses as Record<string, Record<string, unknown>>) || {};
        const convertedResponses: Record<string, { description: string; content?: Record<string, { schema?: SchemaObject }> }> = {};

        for (const [statusCode, response] of Object.entries(responses)) {
          const content: Record<string, { schema?: SchemaObject }> = {};
          if (response.schema) {
            const produces = (op.produces as string[]) || ['application/json'];
            content[produces[0]] = {
              schema: convertSchema(response.schema as Record<string, unknown>),
            };
          }

          convertedResponses[statusCode] = {
            description: (response.description as string) || 'Response',
            ...(Object.keys(content).length > 0 ? { content } : {}),
          };
        }

        (convertedPathItem as Record<string, OperationObject>)[method] = {
          summary: op.summary as string | undefined,
          description: op.description as string | undefined,
          operationId: op.operationId as string | undefined,
          tags: op.tags as string[] | undefined,
          deprecated: op.deprecated as boolean | undefined,
          parameters: convertedParams.length > 0 ? convertedParams : undefined,
          requestBody,
          responses: convertedResponses,
          security: op.security as Array<Record<string, string[]>> | undefined,
        } as OperationObject;
      }
    }

    convertedPaths[pathKey] = convertedPathItem;
  }

  // Convert security schemes
  const securitySchemes: Record<string, unknown> = {};
  for (const [name, scheme] of Object.entries(securityDefinitions)) {
    const s = scheme as Record<string, unknown>;
    if (s.type === 'basic') {
      securitySchemes[name] = {
        type: 'http',
        scheme: 'basic',
        description: s.description,
      };
    } else if (s.type === 'apiKey') {
      securitySchemes[name] = {
        type: 'apiKey',
        name: s.name,
        in: s.in,
        description: s.description,
      };
    } else if (s.type === 'oauth2') {
      const flows: Record<string, unknown> = {};
      if (s.flow === 'implicit') {
        flows.implicit = {
          authorizationUrl: s.authorizationUrl,
          scopes: s.scopes || {},
        };
      } else if (s.flow === 'password') {
        flows.password = {
          tokenUrl: s.tokenUrl,
          scopes: s.scopes || {},
        };
      } else if (s.flow === 'application') {
        flows.clientCredentials = {
          tokenUrl: s.tokenUrl,
          scopes: s.scopes || {},
        };
      } else if (s.flow === 'accessCode') {
        flows.authorizationCode = {
          authorizationUrl: s.authorizationUrl,
          tokenUrl: s.tokenUrl,
          scopes: s.scopes || {},
        };
      }
      securitySchemes[name] = {
        type: 'oauth2',
        description: s.description,
        flows,
      };
    }
  }

  // Convert schemas
  const schemas: Record<string, SchemaObject> = {};
  for (const [name, schema] of Object.entries(definitions)) {
    schemas[name] = convertSchema(schema as Record<string, unknown>);
  }

  return preProcessDefinition({
    openapi: '3.0.3',
    info: {
      title: (info.title as string) || 'Converted API',
      version: (info.version as string) || '1.0.0',
      description: info.description as string | undefined,
      termsOfService: info.termsOfService as string | undefined,
      contact: info.contact as { name?: string; url?: string; email?: string } | undefined,
      license: info.license as { name?: string; url?: string } | undefined,
    },
    servers: servers.length > 0 ? servers : undefined,
    paths: convertedPaths,
    components: {
      schemas: Object.keys(schemas).length > 0 ? schemas : undefined,
      securitySchemes: Object.keys(securitySchemes).length > 0 ? securitySchemes : undefined,
    },
    tags: swagger.tags as TagObject[] | undefined,
    externalDocs: swagger.externalDocs as { description?: string; url?: string } | undefined,
    security: swagger.security as Array<Record<string, string[]>> | undefined,
  });
}

/**
 * Helper to convert Swagger 2.0 schema to OpenAPI 3.0 schema
 */
function convertSchema(schema: Record<string, unknown>): SchemaObject {
  if (!schema) return {};

  // Convert $ref from #/definitions/* to #/components/schemas/*
  if (schema.$ref && typeof schema.$ref === 'string') {
    return {
      $ref: schema.$ref.replace('#/definitions/', '#/components/schemas/'),
    } as SchemaObject;
  }

  const result: SchemaObject = {
    type: schema.type as SchemaObject['type'],
    format: schema.format as string | undefined,
    title: schema.title as string | undefined,
    description: schema.description as string | undefined,
    default: schema.default,
    enum: schema.enum as unknown[] | undefined,
    minimum: schema.minimum as number | undefined,
    maximum: schema.maximum as number | undefined,
    minLength: schema.minLength as number | undefined,
    maxLength: schema.maxLength as number | undefined,
    pattern: schema.pattern as string | undefined,
    minItems: schema.minItems as number | undefined,
    maxItems: schema.maxItems as number | undefined,
    uniqueItems: schema.uniqueItems as boolean | undefined,
    required: schema.required as string[] | undefined,
  };

  // Convert items
  if (schema.items) {
    result.items = convertSchema(schema.items as Record<string, unknown>);
  }

  // Convert properties
  if (schema.properties) {
    result.properties = {};
    for (const [propName, propSchema] of Object.entries(schema.properties as Record<string, unknown>)) {
      result.properties[propName] = convertSchema(propSchema as Record<string, unknown>);
    }
  }

  // Convert additionalProperties
  if (schema.additionalProperties !== undefined) {
    if (typeof schema.additionalProperties === 'boolean') {
      result.additionalProperties = schema.additionalProperties;
    } else if (schema.additionalProperties) {
      result.additionalProperties = convertSchema(schema.additionalProperties as Record<string, unknown>);
    }
  }

  return result;
}

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
