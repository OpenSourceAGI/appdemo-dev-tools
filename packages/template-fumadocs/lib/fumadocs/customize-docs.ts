
/**
 * @file customize-docs.ts
 * @description Documentation configuration object and types.
 */
export const docsConfig: DocsConfig = {
  title: "Docs Template",
  description: "Docs Template for Fumadocs",
  github: "https://github.com/OpenSourceAGI/StarterDOCS",
  githubDocs: "https://github.com/OpenSourceAGI/StarterDOCS/blob/dev/docs",
  favicon: "/favicon.ico",
  apiDocsPath: "./public/qwksearch-openapi.yaml",
  topLinks: [
    {
      text: 'Docs',
      url: '/docs',
    },
    {
      text: 'GitHub',
      url: 'https://github.com/OpenSourceAGI/StarterDOCS',
      external: true,
    },
  ],
};


export interface DocsConfig {
  /** The title of the documentation site */
  title?: string;
  /** A short description of the project */
  description?: string;
  /** URL to the GitHub repository */
  github?: string;
  /** Base URL for document editing on GitHub */
  githubDocs?: string;
  /** Path to the favicon */
  favicon?: string;
  /** Path to the OpenAPI specification file */
  apiDocsPath?: string;
  /** Links to be displayed in the navigation bar */
  topLinks?: {
    text: string;
    url: string;
    external?: boolean;
  }[];
}

