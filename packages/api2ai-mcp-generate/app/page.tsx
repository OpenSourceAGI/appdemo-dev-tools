"use client";

import React, { useState } from "react";
import {
  Rocket,
  Search,
  Radio,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  Copy,
  Bot,
  Github,
  FileJson,
  PlayCircle,
  LayoutDashboard,
  Wand2,
  Code2,
  Zap,
  FileCode,
} from "lucide-react";

import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github-dark.css';

import {
  VideoModal,
  VideoModalContent,
  VideoModalDescription,
  VideoModalTitle,
  VideoModalTrigger,
  VideoModalVideo,
  VideoPlayButton,
  VideoPlayer,
  VideoPreview,
} from "@/components/ui/video-modal";

hljs.registerLanguage('bash', bash);

const features = [
  { icon: Rocket, title: "mcp-use Framework", desc: "Highly useful, convenient, popular, production-ready" },
  { icon: Search, title: "Built-in Inspector", desc: "Test at /inspector" },
  { icon: Radio, title: "Multiple Transports", desc: "HTTP, SSE support" },
  { icon: Lock, title: "Auth Support", desc: "Tokens & API keys" },
  { icon: Sparkles, title: "Zod Schemas", desc: "Type-safe validation" },
  { icon: Layers, title: "Production Ready", desc: "Docker & K8s ready" },
];

const quickStartCode = `# Generate from OpenAPI spec
npx api2ai \\
  https://petstore3.swagger.io/api/v3/openapi.json \\
  ./petstore-mcp --name petstore-api

cd petstore-mcp && npm install && npm start`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <span className="text-xs text-gray-500 font-mono">bash</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm bg-gray-900">
        <code ref={codeRef} className="text-gray-100 font-mono leading-relaxed whitespace-pre language-bash">{code}</code>
      </pre>
    </div>
  );
}

export default function API2AICompact() {
  return (
    <section className="py-16 px-6" id="api2ai">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">
                  API<span className="text-violet-500">2</span>AI
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                OpenAPI → MCP Server Generator
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate production-ready MCP servers with built-in inspector, multiple transports, and ChatGPT Apps SDK support.
              </p>
            </div>

            {/* Code Block */}
            <div className="mb-8">
              <CodeBlock code={quickStartCode} />
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {features.map((f, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors">
                  <f.icon className="w-4 h-4 text-violet-500 mb-1.5" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/vtempest/GRAB-URL/tree/master/api2ai/example-petstore"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                <Github className="w-4 h-4" />
                View Example
              </a>
              <a
                href="https://npmjs.org/package/api2ai"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                <FileJson className="w-4 h-4" />
                NPM Package
              </a>
            </div>
          </div>

          {/* Right Image - Video Modal */}
          <div className="flex justify-center lg:justify-end">
            <VideoModal>
              <VideoModalTrigger asChild>
                <div className="relative cursor-pointer group">
                  <h1 className="text-3xl md:text-4xl text-center font-bold mb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent animate-gradient">
                    Play Video Intro
                  </h1>
                  <img
                    src="https://i.imgur.com/TTJBLxo.png"
                    alt="API2AI Preview"
                    className="max-w-full h-auto rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all group-hover:shadow-3xl group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                      <PlayCircle className="w-6 h-6 text-violet-500" />
                      <span className="text-sm font-medium">Watch Demo</span>
                    </div>
                  </div>
                </div>
              </VideoModalTrigger>
              <VideoModalContent>
                <VideoModalDescription>
                  See how to generate a production-ready MCP server from any OpenAPI spec
                </VideoModalDescription>
                <VideoModalVideo>
                  <VideoPlayer>
                    <VideoPreview>
                      <img
                        src="https://i.imgur.com/TTJBLxo.png"
                        alt="Video preview"
                        className="w-full h-full object-cover"
                      />
                    </VideoPreview>
                    <VideoPlayButton>
                      <button className="absolute inset-0 m-auto flex size-32 items-center justify-center rounded-full border border-white border-white/10 bg-white/50 transition duration-300 hover:bg-white/75">
                        <PlayCircle className="size-20 stroke-1 text-white" />
                      </button>
                    </VideoPlayButton>
                    <video
                      className="size-full"
                      src="https://i.imgur.com/5wsY7Wm.mp4"
                      controls
                      autoPlay
                      loop
                    />
                  </VideoPlayer>
                </VideoModalVideo>
              </VideoModalContent>
            </VideoModal>
          </div>
        </div>

        {/* OpenAPI Designer Section */}
        <div className="mt-20 pt-20 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">
                OpenAPI <span className="text-violet-500">Designer</span>
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Visual OpenAPI Specification Builder
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Design, build, and validate OpenAPI 3.x specifications with our intuitive visual editor.
              Perfect for creating API documentation and generating MCP servers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/30 w-fit mb-4">
                <Code2 className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Visual Editor</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Build OpenAPI specs visually with a user-friendly interface. No need to write YAML or JSON by hand.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 w-fit mb-4">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Real-time Validation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Validate your API specifications in real-time as you build. Catch errors before deployment.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 w-fit mb-4">
                <FileCode className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Export & Generate</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export to YAML/JSON and generate MCP servers instantly with the API2AI CLI tool.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Wand2 className="w-5 h-5" />
              Launch Designer
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/docs"
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
