import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import type * as Plugin from "@docusaurus/types/src/plugin";
import type * as OpenApiPlugin from "docusaurus-plugin-openapi-docs";
import { type ApiPageMetadata } from "docusaurus-plugin-openapi-docs/lib/types";
import { type MediaTypeObject } from "docusaurus-plugin-openapi-docs/lib/openapi/types";
//OpenAPI integration
import { createAuthorization } from "docusaurus-plugin-openapi-docs/lib/markdown/createAuthorization";
import { createCallbacks } from "docusaurus-plugin-openapi-docs/lib/markdown/createCallbacks";
import { createDeprecationNotice } from "docusaurus-plugin-openapi-docs/lib/markdown/createDeprecationNotice";
import { createDescription } from "docusaurus-plugin-openapi-docs/lib/markdown/createDescription";
import { createHeading } from "docusaurus-plugin-openapi-docs/lib/markdown/createHeading";
import { createMethodEndpoint } from "docusaurus-plugin-openapi-docs/lib/markdown/createMethodEndpoint";
import { createParamsDetails } from "docusaurus-plugin-openapi-docs/lib/markdown/createParamsDetails";
import { createRequestBodyDetails } from "docusaurus-plugin-openapi-docs/lib/markdown/createRequestBodyDetails";
import { createRequestHeader } from "docusaurus-plugin-openapi-docs/lib/markdown/createRequestHeader";
import { createStatusCodes } from "docusaurus-plugin-openapi-docs/lib/markdown/createStatusCodes";
import { createVendorExtensions } from "docusaurus-plugin-openapi-docs/lib/markdown/createVendorExtensions";
import { render } from "docusaurus-plugin-openapi-docs/lib/markdown/utils";
import customizeDocs from "./config/customize-docs";
import fs from "fs";

/**
 * Generate docs from JSDoc comments in files, OpenAPI.yml spec for 
 * routes, search index of everything, custom pages, sidebar & theme.
 * 
 * Files: openapi-docs.yaml, docs-theme.css, plugin-openapi.mustache, 
 *  plugin-typedoc.js, sidebars.ts, docusaurus.config.ts, typedoc.json, tsconfig.json
 * 
 * *Install dependencies*:
 * bun install -D @docusaurus/core @docusaurus/faster @docusaurus/plugin-google-gtag
 *  @docusaurus/preset-classic docusaurus-lunr-search docusaurus-plugin-openapi-docs 
 * docusaurus-plugin-typedoc docusaurus-theme-openapi-docs prism-react-renderer react
 *  react-dom clsx typedoc typedoc-plugin-markdown typescript
 * https://github.com/vtempest/ai-research-agent/blob/master/docs/api.mustache
 * *Add to package.json*:
 * "docs": "docusaurus serve --dir web-app/static/docs",
 * "docs:build": "NODE_NO_WARNINGS=1 docusaurus clean-api-docs  all --all-versions ;
 *  NODE_NO_WARNINGS=1 docusaurus  gen-api-docs all  --all-versions ;
 *  rm -rf web-app/static/docs;  DOCUSAURUS_IGNORE_SSG_WARNINGS=true docusaurus 
 *  build --out-dir web-app/static/docs",
 * 
 * For homepage Add to docs/functions/index.md
 * 
    ---
    sidebar_position: 1
    sidebar_label:  Introduction
    title:  Introduction    
    slug: /
    ---

 * @see
 * [Docusaurus Docs](https://docusaurus.io/docs)
 * [Typedoc Docs](https://typedoc.org/documents/)
 * [Typedoc Plugin Docs](https://typedoc-plugin-markdown.org/docs/options)
 * [OpenAPI Plugin Docs](https://docusaurus-openapi.tryingpan.dev)
 * @returns {Promise<Config>}
 * @author [vtempest](https://github.com/vtempest/)
 */
export default async function createConfig(options: any = {}) {
  const {
    name = "App",
    domain = "https://example.org",
    baseFolder = "./",
    typedocFolders = [],
    showEditsOnGitHub = true,
    GOOGLE_ANALYTICS_ID = undefined,
    compileForSubdomain = !!process.env.DOCS_ON_SUBDOMAIN,
    tsconfig = "./tsconfig.json",
    readme = "../readme.md",
    sanitizeComments = false,
    favicon = undefined,
    logo = undefined,
    logoURL = "/",
    topbar = [],
    enableFasterBuildV4 = false,
    enableReadmeAsHome = true,
  } = { ...customizeDocs, ...options };


  // make sure src folder exists
  if (!fs.existsSync(baseFolder + "src")) {
    fs.mkdirSync(baseFolder + "src");
  }

  //copy readme into ./src
  if (fs.existsSync(readme) && enableReadmeAsHome) {


    var index_frontmatter = '---\nid: index\ntitle: Overview\n' +
      'sidebar_position: 1\ndisplayed_sidebar: '
      + 'default' + '\n---\n\n'

    var readmeContent = fs.readFileSync(readme, "utf8")
    fs.writeFileSync(baseFolder + "src/index.md",
      index_frontmatter + readmeContent);
  }

  //prepend to index


  // foldersWithFunctions - should also add to tsconfig.json include:[]
  // compileForSubdomain is used to generate at domain.com/docs 
  // but on github pages workflow, it outputs to
  // subdomain like docprojects.user.github.io
  // sanitizeComments helps avoid errors in markdown like <> {} etc
  return {
    future: enableFasterBuildV4 ? {
      v4: {
        removeLegacyPostBuildHeadAttribute: true, // REQUIRED for ssgWorkerThreads
      },
      experimental_faster: true,
    } : undefined,
    title: name + " Docs",
    url: domain,
    baseUrl: compileForSubdomain ? "/" : "/docs/",
    onBrokenLinks: "ignore",
    onBrokenMarkdownLinks: "ignore",
    favicon,
    projectName: name.replaceAll(" ", "-"),
    presets: [
      [
        "classic",
        {
          docs: {
            path: "src",
            routeBasePath: "/",
            sidebarPath: "./config/sidebars.ts",
          },
          blog: false,
          theme: {
            customCss: baseFolder + "config/docs-theme.css",
          },
          gtag: {
            trackingID: GOOGLE_ANALYTICS_ID,
            anonymizeIP: false,
          },
        } satisfies Preset.Options,
      ],
    ],

    plugins: [


      require.resolve("docusaurus-lunr-search"),

      ...(typedocFolders.map(({ id, entryPoints }) => [
        "docusaurus-plugin-typedoc",
        {
          id,
          entryPoints,
          exclude: [
            "**/node_modules/**/*",
            "pages/**/*"
          ],
          tsconfig,
          out: baseFolder + "src/" + id,
          readme,
          disableSources: !showEditsOnGitHub,
          sidebar: { pretty: true },
          textContentMappings: {
            "title.indexPage": name + " API",
            "title.memberPage": "{name}",
          },
          parametersFormat: "htmlTable",
          indexFormat: "list",
          expandParameters: true,
          interfacePropertiesFormat: "htmlTable",
          propertyMembersFormat: "htmlTable",
          enumMembersFormat: "htmlTable",
          typeDeclarationFormat: "htmlTable",
          typeDeclarationVisibility: "compact",
          sanitizeComments,
          useHTMLEncodedBrackets: true,
          hideBreadcrumbs: false,
          hideGroupHeadings: true,
          hidePageHeader: true,
          hidePageTitle: true,
          outputFileStrategy: "modules",
          useCodeBlocks: true,
        },
      ]))
    ],

    themeConfig: {
      src: {
        sidebar: {
          hideable: true,
        },
      },
      navbar: {
        title: name + " Docs",
        logo: {
          alt: "logo",
          src: logo,
          href: logoURL || "/",
        },
        items: topbar
      },

      languageTabs: [
        {
          highlight: "javascript",
          language: "nodejs",
          logoClass: "nodejs",
        },
        {
          highlight: "javascript",
          language: "javascript",
          logoClass: "javascript",
        },
        {
          highlight: "python",
          language: "python",
          logoClass: "python",
        },
        {
          highlight: "bash",
          language: "curl",
          logoClass: "curl",
        },
        {
          highlight: "powershell",
          language: "powershell",
          logoClass: "powershell",
        },

        {
          highlight: "rust",
          language: "rust",
          logoClass: "rust",
        },
        {
          highlight: "c",
          language: "c",
          logoClass: "c",
        },
        {
          highlight: "swift",
          language: "swift",
          logoClass: "swift",
        },
        {
          highlight: "kotlin",
          language: "kotlin",
          logoClass: "kotlin",
        },
        {
          highlight: "java",
          language: "java",
          logoClass: "java",
        },
        {
          highlight: "php",
          language: "php",
          logoClass: "php",
        },
      ],
    } satisfies Preset.ThemeConfig,

    themes: [
      "docusaurus-theme-openapi-docs"
    ],
    stylesheets: [
      {
        href: "https://use.fontawesome.com/releases/v5.11.0/css/all.css",
        type: "text/css",
      },
    ],
  } satisfies Config;
}


function createServersTable(servers: any = []) {
  if (typeof servers === 'object' && servers && servers.length) {
    return `| URL | Description |
| ---- | ----- |
${servers
        .map((server) => {
          return `| ${server.url} | ${server.description} | `.replace("\n", "<br/>");
        })
        .join("\n")}
    `;
  }
}

export function createApiPageMD({
  title,
  api: {
    deprecated,
    "x-deprecated-description": deprecatedDescription,
    description,
    method,
    path,
    extensions,
    parameters,
    requestBody,
    responses,
    callbacks,
    servers, // destructure servers here
  },
  infoPath,
  frontMatter,
}: ApiPageMetadata) {
  return render([
    `import MethodEndpoint from "@theme/ApiExplorer/MethodEndpoint";\n`,
    `import ParamsDetails from "@theme/ParamsDetails";\n`,
    `import RequestSchema from "@theme/RequestSchema";\n`,
    `import StatusCodes from "@theme/StatusCodes";\n`,
    `import OperationTabs from "@theme/OperationTabs";\n`,
    `import TabItem from "@theme/TabItem";\n`,
    `import Heading from "@theme/Heading";\n\n`,
    createHeading(title),
    createMethodEndpoint(method, path),
    // createServersTable(servers),
    infoPath && createAuthorization(infoPath),
    frontMatter.show_extensions
      ? createVendorExtensions(extensions)
      : undefined,
    createDeprecationNotice({ deprecated, description: deprecatedDescription }),
    createDescription(description),
    requestBody || parameters ? createRequestHeader("Request") : undefined,
    createParamsDetails({ parameters }),
    createRequestBodyDetails({
      title: "Body",
      body: requestBody,
    } as RequestBodyProps),
    createStatusCodes({ responses }),
    createCallbacks({ callbacks }),
  ]);
}
interface RequestBodyProps {
  title: string;
  body: {
    content?: {
      [key: string]: MediaTypeObject;
    };
    description?: string;
    required?: boolean;
  };
}
