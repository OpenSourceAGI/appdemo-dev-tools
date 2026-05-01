import React, { useState, useEffect } from 'react';

import {
  Github,
  BookOpen,
  GitBranch,
  Users,
} from 'lucide-react';


const custom = {
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

export default function () {

  return (
    <footer className="relative z-10 border-t border-gray-800/50 py-16 px-6 bg-gray-900/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between ">
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl">
              <img src={custom.urlLogo} alt="logo" className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{custom.name}</span>
          </div>
          <div className="flex items-center space-x-8">

            <a href={custom.urlDocs} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-105">
              <BookOpen className="w-5 h-5" />
              <span>Docs</span>
            </a>

            <a href={custom.urlSupport} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-105">
              <Users className="w-5 h-5" />
              <span>Discord</span>
            </a>
            <a href={custom.urlGithub} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-105">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <a href={custom.urlGithubChat} className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-105">
              <GitBranch className="w-5 h-5" />
              <span>Discussions</span>
            </a>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800/50 text-center">
          <p className="text-gray-400 mb-4" dangerouslySetInnerHTML={{ __html: custom.copyrightHTML }}>

          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>Made by <a href={custom.urlAuthor} className="text-blue-400 hover:text-blue-300 transition-all duration-300">{custom.author}</a> with ❤️ for the developer community</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
