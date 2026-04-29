import type { APIDocsConfig } from "../docusaurus.config";

export default {
  name: "API Docs",
  domain: "https://example.com",
  typedocFolders: [
    {
      id: "functions",
      entryPoints: [
        "../src/**/*"
      ],
      tsconfig: "../tsconfig.json",
    },
  ],
  gitRepoDocsPath: "https://github.com/your-username/your-repo/tree/master/",
  sourceLinkTemplate: "https://github.com/your-username/your-repo/tree/master/{path}#L{line}",
  openAPISpecPath: false,
  openAPIDocsOutput: "./src/api",
  openAPIShowSchemas: false,
  showEditsOnGitHub: true,
  GOOGLE_ANALYTICS_ID: "x",
  usePathSlashDocs: true,
  tsconfig: "./tsconfig.json",
  readme: "../README.md",
  sanitizeComments: false,
  logoURL: "/",
  baseFolder: "./",
  logo: "/icon.png",
  favicon: "/icon.png",
  enableFasterBuildV4: false,
  enableReadmeAsHome: true,
  topbar: [
    {
      to: "/",
      label: "👋 Intro",
      position: "left",
    }
  ]
} satisfies APIDocsConfig;