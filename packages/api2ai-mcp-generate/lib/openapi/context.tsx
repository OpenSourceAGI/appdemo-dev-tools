'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  OpenAPISpec,
  PathItemObject,
  OperationObject,
  ParameterObject,
  ResponseObject,
  RequestBodyObject,
  ServerObject,
  TagObject,
  SecuritySchemeObject,
  SchemaObject,
  HttpMethod,
} from './types';
import {
  clone,
  preProcessDefinition,
  createEmptySpec,
  createDefaultOperation,
  createDefaultParameter,
  createDefaultResponse,
  createDefaultRequestBody,
  createDefaultServer,
  createDefaultTag,
  createDefaultSecurityScheme,
} from './utils';
import { petstoreSpec } from './demo-specs';

// Storage key
const STORAGE_KEY = 'openapi3';

// Action types
type Action =
  | { type: 'SET_SPEC'; payload: OpenAPISpec }
  | { type: 'SAVE_SNAPSHOT' }
  | { type: 'UNDO' }
  | { type: 'UPDATE_INFO'; payload: Partial<OpenAPISpec['info']> }
  | { type: 'UPDATE_EXTERNAL_DOCS'; payload: Partial<OpenAPISpec['externalDocs']> }
  | { type: 'ADD_SERVER' }
  | { type: 'UPDATE_SERVER'; payload: { index: number; server: ServerObject } }
  | { type: 'REMOVE_SERVER'; payload: number }
  | { type: 'ADD_SERVER_VARIABLE'; payload: { serverIndex: number; name: string } }
  | { type: 'UPDATE_SERVER_VARIABLE'; payload: { serverIndex: number; oldName: string; newName: string; variable: NonNullable<ServerObject['variables']>[string] } }
  | { type: 'REMOVE_SERVER_VARIABLE'; payload: { serverIndex: number; name: string } }
  | { type: 'ADD_TAG' }
  | { type: 'UPDATE_TAG'; payload: { index: number; tag: TagObject } }
  | { type: 'REMOVE_TAG'; payload: number }
  | { type: 'ADD_PATH' }
  | { type: 'RENAME_PATH'; payload: { oldPath: string; newPath: string } }
  | { type: 'UPDATE_PATH'; payload: { path: string; pathItem: Partial<PathItemObject> } }
  | { type: 'REMOVE_PATH'; payload: string }
  | { type: 'DUPLICATE_PATH'; payload: string }
  | { type: 'ADD_OPERATION'; payload: { path: string; method: HttpMethod } }
  | { type: 'UPDATE_OPERATION'; payload: { path: string; method: HttpMethod; operation: Partial<OperationObject> } }
  | { type: 'REMOVE_OPERATION'; payload: { path: string; method: HttpMethod } }
  | { type: 'RENAME_OPERATION'; payload: { path: string; oldMethod: HttpMethod; newMethod: HttpMethod } }
  | { type: 'ADD_PARAMETER'; payload: { path: string; method: HttpMethod } }
  | { type: 'UPDATE_PARAMETER'; payload: { path: string; method: HttpMethod; index: number; parameter: ParameterObject } }
  | { type: 'REMOVE_PARAMETER'; payload: { path: string; method: HttpMethod; index: number } }
  | { type: 'ADD_RESPONSE'; payload: { path: string; method: HttpMethod; statusCode: string } }
  | { type: 'UPDATE_RESPONSE'; payload: { path: string; method: HttpMethod; statusCode: string; response: ResponseObject } }
  | { type: 'REMOVE_RESPONSE'; payload: { path: string; method: HttpMethod; statusCode: string } }
  | { type: 'RENAME_RESPONSE'; payload: { path: string; method: HttpMethod; oldStatus: string; newStatus: string } }
  | { type: 'ADD_REQUEST_BODY'; payload: { path: string; method: HttpMethod } }
  | { type: 'UPDATE_REQUEST_BODY'; payload: { path: string; method: HttpMethod; requestBody: RequestBodyObject } }
  | { type: 'REMOVE_REQUEST_BODY'; payload: { path: string; method: HttpMethod } }
  | { type: 'ADD_MEDIA_TYPE'; payload: { path: string; method: HttpMethod; target: 'requestBody' | 'response'; statusCode?: string; mediaType: string } }
  | { type: 'REMOVE_MEDIA_TYPE'; payload: { path: string; method: HttpMethod; target: 'requestBody' | 'response'; statusCode?: string; mediaType: string } }
  | { type: 'ADD_SECURITY_SCHEME' }
  | { type: 'UPDATE_SECURITY_SCHEME'; payload: { name: string; scheme: SecuritySchemeObject } }
  | { type: 'REMOVE_SECURITY_SCHEME'; payload: string }
  | { type: 'RENAME_SECURITY_SCHEME'; payload: { oldName: string; newName: string } }
  | { type: 'ADD_SCHEMA' }
  | { type: 'UPDATE_SCHEMA'; payload: { name: string; schema: SchemaObject } }
  | { type: 'REMOVE_SCHEMA'; payload: string }
  | { type: 'RENAME_SCHEMA'; payload: { oldName: string; newName: string } }
  | { type: 'DUPLICATE_SCHEMA'; payload: string }
  | { type: 'TOGGLE_GLOBAL_SECURITY'; payload: { schemeName: string; enabled: boolean } }
  | { type: 'REMOVE_ALL_PATHS' }
  | { type: 'RESET_SPEC' }
  | { type: 'LOAD_DEMO' };

interface State {
  spec: OpenAPISpec;
  snapshot: OpenAPISpec | null;
}

// Reducer
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SPEC':
      return { ...state, spec: preProcessDefinition(action.payload) };

    case 'SAVE_SNAPSHOT':
      return { ...state, snapshot: clone(state.spec) };

    case 'UNDO':
      if (state.snapshot) {
        return { ...state, spec: state.snapshot };
      }
      return state;

    case 'UPDATE_INFO':
      return {
        ...state,
        spec: {
          ...state.spec,
          info: { ...state.spec.info, ...action.payload },
        },
      };

    case 'UPDATE_EXTERNAL_DOCS':
      return {
        ...state,
        spec: {
          ...state.spec,
          externalDocs: { ...state.spec.externalDocs, ...action.payload },
        },
      };

    case 'ADD_SERVER':
      return {
        ...state,
        spec: {
          ...state.spec,
          servers: [...(state.spec.servers || []), createDefaultServer()],
        },
      };

    case 'UPDATE_SERVER': {
      const servers = [...(state.spec.servers || [])];
      servers[action.payload.index] = action.payload.server;
      return { ...state, spec: { ...state.spec, servers } };
    }

    case 'REMOVE_SERVER': {
      const servers = state.spec.servers?.filter((_, i) => i !== action.payload) || [];
      return { ...state, spec: { ...state.spec, servers } };
    }

    case 'ADD_SERVER_VARIABLE': {
      const servers = [...(state.spec.servers || [])];
      const server = { ...servers[action.payload.serverIndex] };
      server.variables = {
        ...server.variables,
        [action.payload.name]: { default: 'change-me', description: '' },
      };
      servers[action.payload.serverIndex] = server;
      return { ...state, spec: { ...state.spec, servers } };
    }

    case 'UPDATE_SERVER_VARIABLE': {
      const servers = [...(state.spec.servers || [])];
      const server = { ...servers[action.payload.serverIndex] };
      const variables = { ...server.variables };
      if (action.payload.oldName !== action.payload.newName) {
        delete variables[action.payload.oldName];
      }
      variables[action.payload.newName] = action.payload.variable;
      server.variables = variables;
      servers[action.payload.serverIndex] = server;
      return { ...state, spec: { ...state.spec, servers } };
    }

    case 'REMOVE_SERVER_VARIABLE': {
      const servers = [...(state.spec.servers || [])];
      const server = { ...servers[action.payload.serverIndex] };
      const variables = { ...server.variables };
      delete variables[action.payload.name];
      server.variables = Object.keys(variables).length > 0 ? variables : undefined;
      servers[action.payload.serverIndex] = server;
      return { ...state, spec: { ...state.spec, servers } };
    }

    case 'ADD_TAG':
      return {
        ...state,
        spec: {
          ...state.spec,
          tags: [...(state.spec.tags || []), createDefaultTag()],
        },
      };

    case 'UPDATE_TAG': {
      const tags = [...(state.spec.tags || [])];
      tags[action.payload.index] = action.payload.tag;
      return { ...state, spec: { ...state.spec, tags } };
    }

    case 'REMOVE_TAG': {
      const tags = state.spec.tags?.filter((_, i) => i !== action.payload) || [];
      return { ...state, spec: { ...state.spec, tags } };
    }

    case 'ADD_PATH': {
      const newPath = '/newPath';
      if (state.spec.paths[newPath]) return state;
      return {
        ...state,
        spec: {
          ...state.spec,
          paths: { ...state.spec.paths, [newPath]: {} },
        },
      };
    }

    case 'RENAME_PATH': {
      const { oldPath, newPath } = action.payload;
      if (oldPath === newPath) return state;
      const paths = { ...state.spec.paths };
      paths[newPath] = paths[oldPath];
      delete paths[oldPath];
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'UPDATE_PATH': {
      const paths = { ...state.spec.paths };
      paths[action.payload.path] = {
        ...paths[action.payload.path],
        ...action.payload.pathItem,
      };
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'REMOVE_PATH': {
      const paths = { ...state.spec.paths };
      delete paths[action.payload];
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'DUPLICATE_PATH': {
      const paths = { ...state.spec.paths };
      const newPath = '/newPath';
      if (paths[newPath]) return state;
      paths[newPath] = clone(paths[action.payload]);
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'ADD_OPERATION': {
      const { path, method } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      if (pathItem[method]) return state;
      pathItem[method] = createDefaultOperation();
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'UPDATE_OPERATION': {
      const { path, method, operation } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      pathItem[method] = { ...pathItem[method], ...operation } as OperationObject;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'REMOVE_OPERATION': {
      const { path, method } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      delete pathItem[method];
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'RENAME_OPERATION': {
      const { path, oldMethod, newMethod } = action.payload;
      if (oldMethod === newMethod) return state;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };

      // Swap if new method exists
      if (pathItem[newMethod]) {
        const temp = pathItem[newMethod];
        pathItem[newMethod] = pathItem[oldMethod];
        pathItem[oldMethod] = temp;
      } else {
        pathItem[newMethod] = pathItem[oldMethod];
        delete pathItem[oldMethod];
      }
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'ADD_PARAMETER': {
      const { path, method } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      operation.parameters = [...(operation.parameters || []), createDefaultParameter()];
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'UPDATE_PARAMETER': {
      const { path, method, index, parameter } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      const parameters = [...(operation.parameters || [])];
      parameters[index] = parameter;
      operation.parameters = parameters;
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'REMOVE_PARAMETER': {
      const { path, method, index } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      operation.parameters = operation.parameters?.filter((_, i) => i !== index) || [];
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'ADD_RESPONSE': {
      const { path, method, statusCode } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      operation.responses = {
        ...operation.responses,
        [statusCode]: createDefaultResponse(),
      };
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'UPDATE_RESPONSE': {
      const { path, method, statusCode, response } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      operation.responses = {
        ...operation.responses,
        [statusCode]: response,
      };
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'REMOVE_RESPONSE': {
      const { path, method, statusCode } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      const responses = { ...operation.responses };
      delete responses[statusCode];
      // Ensure at least one response exists
      if (Object.keys(responses).length === 0) {
        responses['default'] = { description: 'Default response' };
      }
      operation.responses = responses;
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'RENAME_RESPONSE': {
      const { path, method, oldStatus, newStatus } = action.payload;
      if (oldStatus === newStatus) return state;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      const responses = { ...operation.responses };
      responses[newStatus] = responses[oldStatus];
      delete responses[oldStatus];
      operation.responses = responses;
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'ADD_REQUEST_BODY': {
      const { path, method } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      operation.requestBody = createDefaultRequestBody();
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'UPDATE_REQUEST_BODY': {
      const { path, method, requestBody } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      operation.requestBody = requestBody;
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'REMOVE_REQUEST_BODY': {
      const { path, method } = action.payload;
      const paths = { ...state.spec.paths };
      const pathItem = { ...paths[path] };
      const operation = { ...pathItem[method] } as OperationObject;
      delete operation.requestBody;
      pathItem[method] = operation;
      paths[path] = pathItem;
      return { ...state, spec: { ...state.spec, paths } };
    }

    case 'ADD_SECURITY_SCHEME': {
      const schemes = state.spec.components?.securitySchemes || {};
      let name = 'newSecurityScheme';
      let counter = 1;
      while (schemes[name]) {
        name = `newSecurityScheme${counter++}`;
      }
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            securitySchemes: {
              ...schemes,
              [name]: createDefaultSecurityScheme(),
            },
          },
        },
      };
    }

    case 'UPDATE_SECURITY_SCHEME': {
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            securitySchemes: {
              ...state.spec.components?.securitySchemes,
              [action.payload.name]: action.payload.scheme,
            },
          },
        },
      };
    }

    case 'REMOVE_SECURITY_SCHEME': {
      const schemes = { ...state.spec.components?.securitySchemes };
      delete schemes[action.payload];

      // Also remove from global security
      const security = state.spec.security?.filter(
        (req) => !(action.payload in req)
      );

      return {
        ...state,
        spec: {
          ...state.spec,
          security,
          components: {
            ...state.spec.components,
            securitySchemes: schemes,
          },
        },
      };
    }

    case 'RENAME_SECURITY_SCHEME': {
      const { oldName, newName } = action.payload;
      if (oldName === newName) return state;
      const schemes = { ...state.spec.components?.securitySchemes };
      schemes[newName] = schemes[oldName];
      delete schemes[oldName];

      // Update global security references
      const security = state.spec.security?.map((req) => {
        if (oldName in req) {
          const newReq = { ...req };
          newReq[newName] = newReq[oldName];
          delete newReq[oldName];
          return newReq;
        }
        return req;
      });

      return {
        ...state,
        spec: {
          ...state.spec,
          security,
          components: {
            ...state.spec.components,
            securitySchemes: schemes,
          },
        },
      };
    }

    case 'TOGGLE_GLOBAL_SECURITY': {
      const { schemeName, enabled } = action.payload;
      let security = [...(state.spec.security || [])];

      if (enabled) {
        // Add scheme to global security
        const scheme = state.spec.components?.securitySchemes?.[schemeName];
        const scopes: string[] = [];

        // Collect scopes for oauth2
        if (scheme?.type === 'oauth2' && scheme.flows) {
          for (const flow of Object.values(scheme.flows)) {
            if (flow?.scopes) {
              scopes.push(...Object.keys(flow.scopes));
            }
          }
        }

        security.push({ [schemeName]: scopes });
      } else {
        // Remove scheme from global security
        security = security.filter((req) => !(schemeName in req));
      }

      return { ...state, spec: { ...state.spec, security } };
    }

    case 'ADD_SCHEMA': {
      const schemas = state.spec.components?.schemas || {};
      let name = 'NewSchema';
      let counter = 1;
      while (schemas[name]) {
        name = `NewSchema${counter++}`;
      }
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            schemas: {
              ...schemas,
              [name]: { type: 'object' },
            },
          },
        },
      };
    }

    case 'UPDATE_SCHEMA': {
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            schemas: {
              ...state.spec.components?.schemas,
              [action.payload.name]: action.payload.schema,
            },
          },
        },
      };
    }

    case 'REMOVE_SCHEMA': {
      const schemas = { ...state.spec.components?.schemas };
      delete schemas[action.payload];
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            schemas,
          },
        },
      };
    }

    case 'RENAME_SCHEMA': {
      const { oldName, newName } = action.payload;
      if (oldName === newName) return state;
      const schemas = { ...state.spec.components?.schemas };
      schemas[newName] = schemas[oldName];
      delete schemas[oldName];
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            schemas,
          },
        },
      };
    }

    case 'DUPLICATE_SCHEMA': {
      const schemas = state.spec.components?.schemas || {};
      let name = 'NewSchema';
      let counter = 1;
      while (schemas[name]) {
        name = `NewSchema${counter++}`;
      }
      return {
        ...state,
        spec: {
          ...state.spec,
          components: {
            ...state.spec.components,
            schemas: {
              ...schemas,
              [name]: clone(schemas[action.payload]),
            },
          },
        },
      };
    }

    case 'REMOVE_ALL_PATHS':
      return {
        ...state,
        spec: {
          ...state.spec,
          paths: {},
        },
      };

    case 'RESET_SPEC':
      return {
        ...state,
        spec: createEmptySpec(),
      };

    case 'LOAD_DEMO':
      return {
        ...state,
        spec: preProcessDefinition(clone(petstoreSpec)),
      };

    default:
      return state;
  }
}

// Context types
interface OpenAPIContextType {
  spec: OpenAPISpec;
  dispatch: React.Dispatch<Action>;
  save: () => void;
  undo: () => void;
}

const OpenAPIContext = createContext<OpenAPIContextType | null>(null);

// Provider component
export function OpenAPIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    spec: preProcessDefinition(clone(petstoreSpec)),
    snapshot: null,
  });

  // Save to localStorage
  const save = useCallback(() => {
    dispatch({ type: 'SAVE_SNAPSHOT' });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.spec));
    }
  }, [state.spec]);

  // Undo to last saved state
  const undo = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          dispatch({ type: 'SET_SPEC', payload: JSON.parse(stored) });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  return (
    <OpenAPIContext.Provider value={{ spec: state.spec, dispatch, save, undo }}>
      {children}
    </OpenAPIContext.Provider>
  );
}

// Hook to use the context
export function useOpenAPI() {
  const context = useContext(OpenAPIContext);
  if (!context) {
    throw new Error('useOpenAPI must be used within an OpenAPIProvider');
  }
  return context;
}
