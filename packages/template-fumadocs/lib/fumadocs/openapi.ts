/**
 * @file openapi.ts
 * @description Configuration for the OpenAPI documentation generator.
 */
import { createOpenAPI } from 'fumadocs-openapi/server';
import { docsConfig } from './customize-docs';

export const openapi = createOpenAPI({
    // the OpenAPI schema, you can also give it an external URL.
    input: [docsConfig.apiDocsPath].filter(Boolean) as string[],
});