module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/packages/docs-template-fuma/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/4b4be__pnpm_4e587c5e._.js",
  "chunks/[root-of-the-server]__3e49f513._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/packages/docs-template-fuma/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];