export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.ico","icons/android-chrome-192x192.png","icons/android-chrome-512x512.png","icons/apple-touch-icon.png","robots.txt","site.webmanifest"]),
	mimeTypes: {".png":"image/png",".txt":"text/plain",".webmanifest":"application/manifest+json"},
	_: {
		client: {start:"_app/immutable/entry/start.BAsoc2Yg.js",app:"_app/immutable/entry/app.Dmh7-F8R.js",imports:["_app/immutable/entry/start.BAsoc2Yg.js","_app/immutable/chunks/m3xksFWw.js","_app/immutable/chunks/D3bv2fF8.js","_app/immutable/chunks/81wmwbp2.js","_app/immutable/chunks/DhYEMCY-.js","_app/immutable/entry/app.Dmh7-F8R.js","_app/immutable/chunks/81wmwbp2.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/D3bv2fF8.js","_app/immutable/chunks/DhYEMCY-.js","_app/immutable/chunks/BdpAsMa4.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/legal/privacy",
				pattern: /^\/legal\/privacy\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/legal/terms",
				pattern: /^\/legal\/terms\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
