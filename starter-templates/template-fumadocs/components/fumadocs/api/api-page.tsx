/**
 * @file api-page.tsx
 * @description API page component that generates dynamic documentation and code samples.
 */
// import { openapi } from '@/lib/fumadocs/openapi';
import { createAPIPage } from 'fumadocs-openapi/ui';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { docsConfig } from '@/lib/fumadocs/customize-docs';

export const openapi = createOpenAPI({
    // the OpenAPI schema, you can also give it an external URL.
    input: [docsConfig.apiDocsPath].filter(Boolean) as string[],
});


export const APIPage = createAPIPage(openapi, {
    generateCodeSamples(endpoint) {
        return [
            // {
            //     id: 'js',
            //     lang: 'js',
            //     label: 'JavaScript SDK',
            //     source: "console.log('hello')",
            // },
            // or to disable the default code samples
            // set `source: false`
            {
                id: 'curl',
                lang: 'bash',
                source: false,
            },
        ];
    },
});