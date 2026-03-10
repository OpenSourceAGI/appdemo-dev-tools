/**
 * @file source.tsx
 * @description Fumadocs source loader configuration and page structure.
 */
import { docs } from 'fumadocs-mdx:collections/server'
import {
  type InferMetaType,
  type InferPageType,
  type LoaderPlugin,
  loader,
} from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { openapiPlugin } from 'fumadocs-openapi/server'

/**
 * Extracts the full text content of a documentation page formatted for LLM consumption.
 * @param page - A FumaDocs page object to extract text from.
 * @returns The page title, URL, and processed body text as a single string.
 */
export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}

export const source = loader({
  baseUrl: '/docs',
  plugins: [pageTreeCodeTitles(), lucideIconsPlugin(), openapiPlugin()],
  source: docs.toFumadocsSource(),
})

/**
 * Loader plugin that wraps function and component names in `<code>` tags
 * within the sidebar page tree (e.g. `myFunc()` or `<MyComponent />`).
 * @returns A FumaDocs LoaderPlugin that transforms file node names.
 */
function pageTreeCodeTitles(): LoaderPlugin {
  return {
    transformPageTree: {
      file(node) {
        if (
          typeof node.name === 'string' &&
          (node.name.endsWith('()') || node.name.match(/^<\w+ \/>$/))
        ) {
          return {
            ...node,
            name: <code className='text-[0.8125rem]'>{node.name}</code>,
          }
        }
        return node
      },
    },
  }
}

export type Page = InferPageType<typeof source>
export type Meta = InferMetaType<typeof source>
