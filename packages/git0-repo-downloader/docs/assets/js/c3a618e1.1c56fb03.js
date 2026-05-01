"use strict";
(self.webpackChunkcreate_apidocs = self.webpackChunkcreate_apidocs || []).push([
  [893],
  {
    4035: (e, s, t) => {
      (t.r(s),
        t.d(s, {
          assets: () => d,
          contentTitle: () => l,
          default: () => h,
          frontMatter: () => o,
          metadata: () => n,
          toc: () => c,
        }));
      const n = JSON.parse(
        '{"id":"functions/index","title":"index","description":"CLI tool to search GitHub repositories, download source & releases for your system, and instantly set up, then install dependencies and open code editor.","source":"@site/src/functions/index.md","sourceDirName":"functions","slug":"/functions/","permalink":"/functions/","draft":false,"unlisted":false,"tags":[],"version":"current","frontMatter":{},"sidebar":"default","previous":{"title":"github-api","permalink":"/functions/github-api"},"next":{"title":"modules","permalink":"/functions/modules"}}',
      );
      var i = t(4848),
        r = t(8453);
      const o = {},
        l = "Git0: Download Git Repo on Step Zero",
        d = {},
        c = [
          { value: "\ud83d\ude80 Installation", id: "-installation", level: 2 },
          { value: "\u2728 Features", id: "-features", level: 2 },
          { value: "\ud83c\udfaf Usage", id: "-usage", level: 2 },
          {
            value: "Supported Project Types",
            id: "supported-project-types",
            level: 3,
          },
          { value: "Supported IDEs", id: "supported-ides", level: 3 },
          {
            value: "\ud83d\udd27 Configuration",
            id: "-configuration",
            level: 2,
          },
          {
            value: "What Happens After Download",
            id: "what-happens-after-download",
            level: 3,
          },
          {
            value: "GitHub Token (Optional)",
            id: "github-token-optional",
            level: 3,
          },
        ];
      function a(e) {
        const s = {
          a: "a",
          code: "code",
          h1: "h1",
          h2: "h2",
          h3: "h3",
          header: "header",
          img: "img",
          li: "li",
          ol: "ol",
          p: "p",
          pre: "pre",
          strong: "strong",
          table: "table",
          tbody: "tbody",
          td: "td",
          th: "th",
          thead: "thead",
          tr: "tr",
          ul: "ul",
          ...(0, r.R)(),
          ...e.components,
        };
        return (0, i.jsxs)(i.Fragment, {
          children: [
            (0, i.jsx)("p", {
              align: "center",
              children: (0, i.jsx)("img", {
                src: "https://i.imgur.com/RLXLAzY.png",
              }),
            }),
            "\n",
            (0, i.jsxs)("p", {
              align: "center",
              children: [
                (0, i.jsx)("a", {
                  href: "https://discord.gg/SJdBqBz3tV",
                  children: (0, i.jsx)("img", {
                    src: "https://img.shields.io/discord/1110227955554209923.svg?label=Chat&logo=Discord&colorB=7289da&style=flat",
                  }),
                }),
                (0, i.jsx)("a", {
                  href: "https://github.com/vtempest/git0/discussions",
                  children: (0, i.jsx)("img", {
                    alt: "GitHub Stars",
                    src: "https://img.shields.io/github/stars/vtempest/git0",
                  }),
                }),
                (0, i.jsx)("a", {
                  href: "https://github.com/vtempest/git0/discussions",
                  children: (0, i.jsx)("img", {
                    alt: "GitHub Discussions",
                    src: "https://img.shields.io/github/discussions/vtempest/git0",
                  }),
                }),
                (0, i.jsx)("a", {
                  href: "https://github.com/vtempest/git0/pulse",
                  alt: "Activity",
                  children: (0, i.jsx)("img", {
                    src: "https://img.shields.io/github/commit-activity/m/vtempest/git0",
                  }),
                }),
                (0, i.jsx)("img", {
                  src: "https://img.shields.io/github/last-commit/vtempest/git0.svg",
                  alt: "GitHub last commit",
                }),
                (0, i.jsx)("img", {
                  src: "https://img.shields.io/badge/PRs-welcome-brightgreen.svg",
                }),
                (0, i.jsx)("a", {
                  href: "https://codespaces.new/vtempest/git0",
                  children: (0, i.jsx)("img", {
                    src: "https://github.com/codespaces/badge.svg",
                    width: "150",
                    height: "20",
                  }),
                }),
              ],
            }),
            "\n",
            (0, i.jsx)(s.header, {
              children: (0, i.jsx)(s.h1, {
                id: "git0-download-git-repo-on-step-zero",
                children: "Git0: Download Git Repo on Step Zero",
              }),
            }),
            "\n",
            (0, i.jsx)(s.p, {
              children:
                "CLI tool to search GitHub repositories, download source & releases for your system, and instantly set up, then install dependencies and open code editor.",
            }),
            "\n",
            (0, i.jsx)(s.h2, {
              id: "-installation",
              children: "\ud83d\ude80 Installation",
            }),
            "\n",
            (0, i.jsx)(s.pre, {
              children: (0, i.jsx)(s.code, {
                className: "language-bash",
                children: "npm install -g git0\n",
              }),
            }),
            "\n",
            (0, i.jsx)(s.pre, {
              children: (0, i.jsx)(s.code, {
                className: "language-bash",
                children: "bun install -g git0\n",
              }),
            }),
            "\n",
            (0, i.jsxs)(s.p, {
              children: [
                (0, i.jsx)(s.img, {
                  src: "https://i.imgur.com/Io3ukRC.gif",
                  alt: "livepreview",
                }),
                "\n",
                (0, i.jsx)(s.img, {
                  src: "https://i.imgur.com/K22NiBq.png",
                  alt: "preview",
                }),
              ],
            }),
            "\n",
            (0, i.jsx)(s.h2, { id: "-features", children: "\u2728 Features" }),
            "\n",
            (0, i.jsxs)(s.ul, {
              children: [
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Search GitHub repositories",
                    }),
                    " by name with fuzzy matching",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Download repositories" }),
                    " directly from GitHub URLs or owner/repo shortcuts. Skip the manual git clone, cd, install dance",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Get Releases" }),
                    " instantly download latest release for your system or all systems",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Automatic dependency installation",
                    }),
                    " and installation for multiple project types",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Smart IDE integration" }),
                    " - automatically opens projects in your preferred editor",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Cross-platform support",
                    }),
                    " - works on Windows, macOS, and Linux",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Conflict resolution" }),
                    " - handles directory naming conflicts automatically",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Faster than git" }),
                    " - skips ",
                    (0, i.jsx)(s.code, { children: ".git" }),
                    " history and uncompresses while downloading",
                  ],
                }),
                "\n",
              ],
            }),
            "\n",
            (0, i.jsx)(s.h2, { id: "-usage", children: "\ud83c\udfaf Usage" }),
            "\n",
            (0, i.jsx)(s.pre, {
              children: (0, i.jsx)(s.code, {
                className: "language-bash",
                children:
                  "\n# Direct download from GitHub URL\n## g and git0 both work\ng https://github.com/facebook/react\n\n# Search for repositories by name\ng react starter\n\n# Download using owner/repo shorthand\ngit0 facebook/react\n\n# Use git0 without installing, (only node needed)\n# (copy this line into your project's readme to help others setup)\nnpx git0 facebook/react\n",
              }),
            }),
            "\n",
            (0, i.jsx)(s.h3, {
              id: "supported-project-types",
              children: "Supported Project Types",
            }),
            "\n",
            (0, i.jsx)(s.p, {
              children:
                "git0 automatically detects and sets up the following project types:",
            }),
            "\n",
            (0, i.jsxs)(s.table, {
              children: [
                (0, i.jsx)(s.thead, {
                  children: (0, i.jsxs)(s.tr, {
                    children: [
                      (0, i.jsx)(s.th, { children: "Project Type" }),
                      (0, i.jsx)(s.th, { children: "Detection" }),
                      (0, i.jsx)(s.th, { children: "Installation" }),
                    ],
                  }),
                }),
                (0, i.jsxs)(s.tbody, {
                  children: [
                    (0, i.jsxs)(s.tr, {
                      children: [
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.strong, {
                            children: "Node.js",
                          }),
                        }),
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.code, {
                            children: "package.json",
                          }),
                        }),
                        (0, i.jsxs)(s.td, {
                          children: [
                            (0, i.jsx)(s.code, { children: "bun install" }),
                            " (fallback to ",
                            (0, i.jsx)(s.code, { children: "npm install" }),
                            ")",
                          ],
                        }),
                      ],
                    }),
                    (0, i.jsxs)(s.tr, {
                      children: [
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.strong, {
                            children: "Docker",
                          }),
                        }),
                        (0, i.jsxs)(s.td, {
                          children: [
                            (0, i.jsx)(s.code, { children: "Dockerfile" }),
                            ", ",
                            (0, i.jsx)(s.code, {
                              children: "docker-compose.yml",
                            }),
                          ],
                        }),
                        (0, i.jsxs)(s.td, {
                          children: [
                            (0, i.jsx)(s.code, {
                              children: "docker-compose up -d",
                            }),
                            " or ",
                            (0, i.jsx)(s.code, { children: "docker build" }),
                          ],
                        }),
                      ],
                    }),
                    (0, i.jsxs)(s.tr, {
                      children: [
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.strong, {
                            children: "Python",
                          }),
                        }),
                        (0, i.jsxs)(s.td, {
                          children: [
                            (0, i.jsx)(s.code, {
                              children: "requirements.txt",
                            }),
                            ", ",
                            (0, i.jsx)(s.code, { children: "setup.py" }),
                          ],
                        }),
                        (0, i.jsx)(s.td, {
                          children: "Virtual environment + pip install",
                        }),
                      ],
                    }),
                    (0, i.jsxs)(s.tr, {
                      children: [
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.strong, { children: "Rust" }),
                        }),
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.code, {
                            children: "Cargo.toml",
                          }),
                        }),
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.code, {
                            children: "cargo build",
                          }),
                        }),
                      ],
                    }),
                    (0, i.jsxs)(s.tr, {
                      children: [
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.strong, { children: "Go" }),
                        }),
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.code, { children: "go.mod" }),
                        }),
                        (0, i.jsx)(s.td, {
                          children: (0, i.jsx)(s.code, {
                            children: "go mod tidy",
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            "\n",
            (0, i.jsx)(s.h3, {
              id: "supported-ides",
              children: "Supported IDEs",
            }),
            "\n",
            (0, i.jsx)(s.p, {
              children:
                "git0 automatically detects and opens projects in your preferred IDE:",
            }),
            "\n",
            (0, i.jsxs)(s.ul, {
              children: [
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Cursor" }),
                    " (",
                    (0, i.jsx)(s.code, { children: "cursor" }),
                    ")",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Windsurf" }),
                    " (",
                    (0, i.jsx)(s.code, { children: "windsurf" }),
                    ")",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "VS Code" }),
                    " (",
                    (0, i.jsx)(s.code, { children: "code" }),
                    ")",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Code Server" }),
                    " (",
                    (0, i.jsx)(s.code, { children: "code-server" }),
                    ")",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Neovim" }),
                    " (",
                    (0, i.jsx)(s.code, { children: "nvim" }),
                    ")",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "Webstorm" }),
                    " (",
                    (0, i.jsx)(s.code, { children: "webstorm" }),
                    ")",
                  ],
                }),
                "\n",
              ],
            }),
            "\n",
            (0, i.jsx)(s.h2, {
              id: "-configuration",
              children: "\ud83d\udd27 Configuration",
            }),
            "\n",
            (0, i.jsx)(s.h3, {
              id: "what-happens-after-download",
              children: "What Happens After Download",
            }),
            "\n",
            (0, i.jsxs)(s.ol, {
              children: [
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Repository is downloaded",
                    }),
                    " to your current directory",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Project type is detected",
                    }),
                    " automatically",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Dependencies are installed",
                    }),
                    " based on project type",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, { children: "IDE is launched" }),
                    " automatically (if available)",
                  ],
                }),
                "\n",
                (0, i.jsxs)(s.li, {
                  children: [
                    (0, i.jsx)(s.strong, {
                      children: "Development server starts",
                    }),
                    " (for Node.js projects)",
                  ],
                }),
                "\n",
              ],
            }),
            "\n",
            (0, i.jsxs)(s.p, {
              children: [
                "If a directory with the same name exists, git0 automatically appends a number (e.g., ",
                (0, i.jsx)(s.code, { children: "react-2" }),
                ", ",
                (0, i.jsx)(s.code, { children: "react-3" }),
                ").",
              ],
            }),
            "\n",
            (0, i.jsx)(s.h3, {
              id: "github-token-optional",
              children: "GitHub Token (Optional)",
            }),
            "\n",
            (0, i.jsxs)(s.p, {
              children: [
                "For higher API rate limits, set ",
                (0, i.jsx)(s.a, {
                  href: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token",
                  children: "your GitHub token",
                }),
                ":",
              ],
            }),
            "\n",
            (0, i.jsx)(s.pre, {
              children: (0, i.jsx)(s.code, {
                className: "language-bash",
                children: "export GITHUB_TOKEN=your_github_token_here\n",
              }),
            }),
            "\n",
            (0, i.jsx)(s.p, {
              children:
                "Without a token, you're limited to 60 requests per hour. With a token, you get 5,000 requests per hour.",
            }),
          ],
        });
      }
      function h(e = {}) {
        const { wrapper: s } = { ...(0, r.R)(), ...e.components };
        return s
          ? (0, i.jsx)(s, { ...e, children: (0, i.jsx)(a, { ...e }) })
          : a(e);
      }
    },
    8453: (e, s, t) => {
      t.d(s, { R: () => o, x: () => l });
      var n = t(6540);
      const i = {},
        r = n.createContext(i);
      function o(e) {
        const s = n.useContext(r);
        return n.useMemo(
          function () {
            return "function" == typeof e ? e(s) : { ...s, ...e };
          },
          [s, e],
        );
      }
      function l(e) {
        let s;
        return (
          (s = e.disableParentContext
            ? "function" == typeof e.components
              ? e.components(i)
              : e.components || i
            : o(e.components)),
          n.createElement(r.Provider, { value: s }, e.children)
        );
      }
    },
  },
]);
