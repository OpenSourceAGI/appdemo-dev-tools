export default {
    name: "git0",
    domain: "https://git0.js.org",
    typedocFolders: [
      {
        id: "functions",
        entryPoints: [
          "../src/**/*"
        ], // also remember to set in ../tsconfig.json {entryPoints:[...]}
      },
    ],
    showEditsOnGitHub: true,
    GOOGLE_ANALYTICS_ID: "G-E5TZ32BZD",
    compileForSubdomain: true, // !!process?.env?.DOCS_ON_SUBDOMAIN,
    tsconfig: "./tsconfig.json",
    readme: "../readme.md",
    sanitizeComments: false,
    logoURL: "/",
    baseFolder: "./",
    logo: "https://i.imgur.com/857meew.png",
    favicon: "https://i.imgur.com/857meew.png",
    enableFasterBuildV4: false,
    enableReadmeAsHome: false,
    topbar: [
      // {
      //   to: "/functions",
      //   label: "👋 Intro",
      //   position: "left",
      // }
  ] 
}
