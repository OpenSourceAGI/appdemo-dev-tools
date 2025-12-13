import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-6">

          {/* Main Logo */}
          <div className="mb-4 w-fit mx-auto">
            <img width="350px" src="https://i.imgur.com/PE4kQWy.png" alt="Main Logo" />
          </div>

          {/* Install Command */}
          {/* <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-base mb-4 inline-block shadow-lg">
            npm i grab-url
          </div> */}
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">Project Status</h2>
          <div className="flex flex-wrap justify-center gap-2">

            <a href="https://github.com/vtempest/Svelte-Starter-DOCS/discussions">
              <img alt="GitHub Discussions"
                src="https://img.shields.io/github/discussions/vtempest/Svelte-Starter-DOCS" />
            </a>
            <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request">
              <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
            </a>
            <a href="https://codespaces.new/vtempest/Svelte-Starter-DOCS">
              <img src="https://github.com/codespaces/badge.svg" width="150" height="20" />
            </a>
          </div>
        </div>

        {/* Tool Rank Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">Tool Rank</h2>
          <div className="flex justify-center">
            <a
              href="./docs/comparisons/_tool_rank"
              className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
            >
              Dev Tool Comparison &rarr;
            </a>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs"
              className="group bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <div className="text-center">
                <div className="text-2xl mb-1">📑</div>
                <h3 className="text-lg font-semibold mb-1">Documentation</h3>
                <p className="text-blue-100 text-sm">Complete API reference and guides</p>
              </div>
            </Link>

            <a
              href="https://starterdocs.js.org/docs/guides/starter-docs#%EF%B8%8F-installation"
              className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <div className="text-center">
                <div className="text-2xl mb-1">🎯</div>
                <h3 className="text-lg font-semibold mb-1">Installation</h3>
                <p className="text-green-100 text-sm">Quick start guide</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
