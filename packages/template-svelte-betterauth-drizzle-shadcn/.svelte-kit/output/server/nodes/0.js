

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false
};
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.D8gOR_4x.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/81wmwbp2.js","_app/immutable/chunks/DhYEMCY-.js"];
export const stylesheets = ["_app/immutable/assets/0.Bh53elC0.css"];
export const fonts = [];
