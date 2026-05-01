import React, { useState, useEffect } from 'react';
import Footer from './Footer';

import {
  Github,
  Download,
  Search,
  Zap,
  Terminal,
  Code,
  Star,
  GitBranch,
  Users,
  Activity,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Rocket,
  Shield,
  Globe,
  Cpu,
  Database,
  Cloud,
  Lock,
  Layers,
  FileCode,
  Package,
  Play,
  Settings,
  Workflow,
  GitMerge,
  Eye,
  Folder,
  Command,
  FolderOpen,
  Wrench,
  MonitorSpeaker,
  ExternalLink
} from 'lucide-react';

const custom = {
  installCommands: {
    bun: 'bun install -g git0',
    npm: 'npm install -g git0',
    npx: 'npx git0 react starter'
  }, coreFeatures: [
    {
      icon: Search,
      title: 'Search GitHub Repositories',
      description: 'Search repositories by name with intelligent fuzzy matching and instant results',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      example: 'git0 react starter'
    },
    {
      icon: Download,
      title: 'Direct Repository Download',
      description: 'Download from GitHub URLs or owner/repo shortcuts. Skip the manual git clone dance',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      example: 'git0 facebook/react'
    },
    {
      icon: Package,
      title: 'Git Release Package Manager',
      description: 'Instantly download latest release binaries for your system or all platforms',
      gradient: 'from-green-500 via-emerald-500 to-cyan-500',
      example: 'gg user/repo'
    },
    {
      icon: Zap,
      title: 'Automatic Dependency Installation',
      description: 'Smart detection and installation of dependencies for multiple project types',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      example: 'Auto-detects package.json, requirements.txt, Cargo.toml'
    },
    {
      icon: Code,
      title: 'Smart IDE Integration',
      description: 'Automatically opens projects in Cursor, Windsurf, VS Code, or your preferred editor',
      gradient: 'from-indigo-500 via-purple-500 to-blue-500',
      example: 'Opens in cursor, windsurf, code, nvim'
    },
    {
      icon: Shield,
      title: 'Conflict Resolution',
      description: 'Handles directory naming conflicts automatically with smart numbering',
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      example: 'react → react-2 → react-3'
    }
  ], projectTypes: [
    {
      name: 'Node.js',
      file: 'package.json',
      install: 'bun install (fallback to npm)',
      color: 'text-green-400',
      icon: Package
    },
    {
      name: 'Docker',
      file: 'Dockerfile, docker-compose.yml',
      install: 'docker-compose up -d',
      color: 'text-blue-400',
      icon: Layers
    },
    {
      name: 'Python',
      file: 'requirements.txt, setup.py',
      install: 'Virtual env + pip install',
      color: 'text-yellow-400',
      icon: FileCode
    },
    {
      name: 'Rust',
      file: 'Cargo.toml',
      install: 'cargo build',
      color: 'text-orange-400',
      icon: Settings
    },
    {
      name: 'Go',
      file: 'go.mod',
      install: 'go mod tidy',
      color: 'text-cyan-400',
      icon: Play
    }
  ], supportedIDEs: [
    { name: 'Cursor', command: 'cursor', color: 'text-blue-400' },
    { name: 'Windsurf', command: 'windsurf', color: 'text-purple-400' },
    { name: 'VS Code', command: 'code', color: 'text-blue-300' },
    { name: 'Code Server', command: 'code-server', color: 'text-green-400' },
    { name: 'Neovim', command: 'nvim', color: 'text-orange-400' }
  ], featuresList: [
    { title: 'Search Repositories', command: 'git0 react starter', desc: 'Find repositories by name with fuzzy matching' },
    { title: 'Direct Download', command: 'gg facebook/react', desc: 'Download using owner/repo shorthand' },
    { title: 'From GitHub URL', command: 'git0 https://github.com/user/repo', desc: 'Download from any GitHub URL' }
  ], workflowSteps: [
    { step: '1', title: 'Repository Downloaded', desc: 'To your current directory', icon: Download },
    { step: '2', title: 'Project Type Detected', desc: 'Automatically identified', icon: Search },
    { step: '3', title: 'Dependencies Installed', desc: 'Based on project type', icon: Package },
    { step: '4', title: 'IDE Launched', desc: 'Opens in preferred editor', icon: Code },
    { step: '5', title: 'Dev Server Started', desc: 'For Node.js projects', icon: Play }
  ],
  urlDocs: "https://git0.js.org/functions",
  urlSupport: "https://discord.gg/SJdBqBz3tV",
  urlGithub: "https://github.com/vtempest/git0",
  urlGithubChat: "https://github.com/vtempest/git0/discussions",
  urlLogo: "https://i.imgur.com/857meew.png",
  name: "git0",
  urlAuthor: "https://github.com/vtempest",
  author: "vtempest",
  copyrightHTML: `&copy; 2025 Get git0. <a href="https://github.com/vtempest/git0">Star this on GitHub</a> so it can grow!`
}

function App() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('bun');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Check if Tailwind CDN is already attached
    const script = document.createElement('script');
    script.id = 'tailwind-cdn';
    script.src = "https://cdn.tailwindcss.com";
    script.async = true;
    script.onload = () => setIsLoaded(true); // Only called when Tailwind is actually loaded
    document.head.appendChild(script);

  }, []);

  const copyToClipboard = (text: string, command: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };


  return isLoaded && (<div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
    {/* Enhanced Animated Background */}
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30">
      {/* Floating Orbs */}
      <div className="absolute inset-0">
        <div
          className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: `${20 + mousePosition.x * 0.02}%`,
            top: `${10 + mousePosition.y * 0.01}%`,
            transform: 'translate3d(0, 0, 0)',
          }}
        ></div>
        <div
          className="absolute w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"
          style={{
            right: `${15 + mousePosition.x * -0.015}%`,
            bottom: `${20 + mousePosition.y * -0.01}%`,
            transform: 'translate3d(0, 0, 0)',
          }}
        ></div>
        <div
          className="absolute w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-2000"
          style={{
            left: `${60 + mousePosition.x * 0.01}%`,
            top: `${60 + mousePosition.y * 0.005}%`,
            transform: 'translate3d(0, 0, 0)',
          }}
        ></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(56,189,248,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.15),transparent_50%)]"></div>
    </div>

    {/* Navigation */}
    <nav className="relative z-50 flex items-center justify-between p-6 backdrop-blur-xl bg-gray-900/70 border-b border-gray-700/50">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-500/25 transform hover:scale-110 transition-all duration-300">
          <img src={custom.urlLogo} alt="logo" className="w-10 h-10" />
        </div>
        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {custom.name}
        </span>
      </div>
      <div className="flex items-center space-x-8">
        <a href="#features" className="hover:text-blue-400 transition-all duration-300 hover:scale-105">Features</a>
        <a href="#installation" className="hover:text-blue-400 transition-all duration-300 hover:scale-105">Install</a>
        <a href="#workflow" className="hover:text-blue-400 transition-all duration-300 hover:scale-105">How It Works</a>
        <a href={custom.urlGithub} className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 px-6 py-3 rounded-xl hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 transition-all duration-300 shadow-2xl shadow-blue-500/25 hover:scale-105 hover:shadow-blue-500/40">
          <Github className="w-5 h-5" />
          <span className="font-semibold">GitHub</span>
        </a>
      </div>
    </nav>

    {/* Hero Section */}
    <section className="relative z-10 pt-6 pb-10 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <div className="">
          <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-500/30 rounded-full px-6 py-3 mb-8 shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-500">
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            <span className="text-blue-300 font-medium">Download Git Repo on Step Zero</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          {/* position as grid next to each other */}
          <div className="grid grid-cols-2 gap-4">
            <img src="https://i.imgur.com/Io3ukRC.gif" alt="Git Preview" className="w-full" />


            <img src="https://i.imgur.com/6l9esbL.png" alt="Git Preview" className="w-full" />
          </div>

          <p className="text-2xl md:text-3xl mt-4 text-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
            CLI tool to search GitHub repositories, download source & releases, and instantly set up projects with
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-semibold"> automatic dependency installation and editor opening</span>
          </p>
        </div>

        {/* Installation Section */}
        <div id="installation">
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-800/50 backdrop-blur-xl rounded-2xl p-2 border border-gray-700/50 shadow-2xl">
              {Object.keys(custom.installCommands).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${activeTab === tab
                      ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-medium">Installation Command</span>
                <button
                  onClick={() => copyToClipboard(custom.installCommands[activeTab as keyof typeof custom.installCommands], activeTab)}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-all duration-300 bg-blue-500/10 px-4 py-2 rounded-lg hover:bg-blue-500/20"
                >
                  {copiedCommand === activeTab ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span className="font-medium">{copiedCommand === activeTab ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <code className="text-xl text-green-400 font-mono bg-gray-900/50 p-4 rounded-lg block">
                {custom.installCommands[activeTab as keyof typeof custom.installCommands]}
              </code>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="">
          <div className="max-w-6xl mx-auto bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-10 shadow-2xl">
            <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Usage Examples
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {custom.featuresList.map((item, index) => (
                <div key={index} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                  <div className="text-blue-400 font-bold text-lg mb-2">{item.title}</div>
                  <code className="text-green-400 text-lg font-mono block mb-3 bg-gray-900/50 p-3 rounded">{item.command}</code>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Core Features Section */}
    <section id="features" className="relative z-10  px-6">
      <div className="max-w-7xl mx-auto">

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 ">
          {custom.coreFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:bg-gray-800/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-2xl`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed mb-4">{feature.description}</p>
              <code className="text-sm text-green-400 bg-gray-900/50 px-3 py-1 rounded font-mono">{feature.example}</code>

              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Supported Project Types */}
    <section className="relative z-10  px-6 mt-4 ">
      <div className="max-w-7xl mx-auto">
        <div className="text-center ">
          <h2 className="text-6xl h-full md:text-5xl font-bold mb-6 bg-gradient-to-r pb-4 from-green-400 to-blue-400 bg-clip-text text-transparent">
            Supported Project Types
          </h2>
        </div>

        <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-6 mt-4 ">
          {custom.projectTypes.map((type, index) => (
            <div key={index} className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <type.icon className={`w-8 h-8 ${type.color}`} />
                  <div>
                    <h3 className={`text-lg font-bold ${type.color}`}>{type.name}</h3>
                    <p className="text-gray-400 text-sm">Detection: {type.file}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-300 font-medium">Installation</p>
                  <code className="text-green-400 text-sm">{type.install}</code>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </section>

    {/* Workflow Section */}
    <section id="workflow" className="relative z-10 mt-6 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 mt-10 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            The Proper Protocol to Download Git Repo
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Skip the manual "git clone, cd, install" dance.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 mt-6">
          {custom.workflowSteps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900">
                  {step.step}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 mb-8 text-center">
          <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-gray-300 mb-4">
              <strong className="text-blue-400">Conflict Resolution:</strong> If a directory with the same name exists,
              git0 automatically appends a number
            </p>
            <code className="text-green-400 bg-gray-900/50 px-4 py-2 rounded">
              react-app → react-app-2 → react-app-3
            </code>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <Footer />
  </div>
  )
}
export default App;