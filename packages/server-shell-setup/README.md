<p align="center">
    <img src="https://i.imgur.com/3qLFAvW.jpeg">
</p>
<p align="center"> 
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/vtempest/server-shell-setup">
    <a href="https://github.com/vtempest/server-shell-setup/discussions">
    <img alt="GitHub Discussions"
        src="https://img.shields.io/github/discussions/vtempest/server-shell-setup">
    </a>
    <a href="http://makeapullrequest.com">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
    </a>
    <a href="https://codespaces.new/vtempest/server-shell-setup">
    <img src="https://github.com/codespaces/badge.svg" width="150" height="20">
    </a>
</p>

## The Devil Is In The Defaults

> If you hold a unix shell up to your ear, can you hear the C?

Setup server shell with `fish`, `nvim`, `nu`, `bun`, `node`, `helix`, `starship prompt`, `git0`, `systeminfo`, `pacstall installer`,  `docker`,  and other dev tools. Fish aliases: `service_manager`, `killport`, and `search [query]`.

**System Support**: Arch, Ubuntu/Debian, Android Termux, macOS, Fedora, Alpine

## Install: Bash Script to Setup Shell

Launch Linux server instance, connect and on first time login you will need to run `sudo passwd` to set root password and  `sudo passwd $USER` to set non-root password. You will need sudo password when running this setup script:

**Install Interactive Menu** (short URL to `./install-shell.sh`):

```bash
wget -qO- tinyurl.com/shellsetup | bash
```

**Install all automated:**

```bash
 wget -qO- tinyurl.com/shellsetup | bash -s -- all
```

**Install specific apps only:**

```bash
 wget -qO- tinyurl.com/shellsetup | bash -s -- starship,docker,node
```

**Install Node with Volta** (no sudo permission issues)

```
span
```

## Example: System Info When Opening Shell

`👤 deck 🏠 steamdeck 📁 90% 💾 2/14GB 🔝 6% cursor ⏱️  1d 7h 18m 🌎 174.194.193.230 📍 San Jose 🔗 http://230.sub-174-194-193.myvzw.com 👮 Verizon Business ⚡ SteamOS 📈 AMD Custom APU 0405 💻 Jupiter 🔧 6.11.11-valve12-1-neptune-611-g517a46b477e1 🐚 fish 🚀 npm pip docker nvim bun🔌 57343stea46583stea27060stea40279stea27036stea8080stea 📦 docker-node`

 `👤 u0_a365 🏠 localhost 📁 54% 💾 1/5GB 🔝 1% fish ⏱️ 4d 9h 19m 🌎 174.194.193.230 🌐 192.168.42.229 📍 San Jose 🔗 http://230.sub-174-194-193.myvzw.com 👮 Verizon Business ⚡ Android 13 📈 Kryo-4XX-Silver 💻 SM-G781U 🔧 4.19.113-27223811 🐚 nu 🚀 apt npm pip hx nvim`

## Reference Docs: 🪄 Magic Spells for Open Sourcery

- [Cursor AI Editor](https://docs.cursor.com/welcome)
- [Cursor MCP Servers](https://cursor.directory)
- [VSCode Docs](https://code.visualstudio.com/docs)
- [VSCode Extensions](https://marketplace.visualstudio.com/search?target=VSCode&category=All%20categories&sortBy=Installs)
- [Fish Features Overview](https://medium.com/the-glitcher/fish-shell-3ec1a6cc6128)
- [Fish Playground](https://rootnroll.com/d/fish-shell/)
- [git0 Installer](https://git0.js.org/)
- [Bun.js Runtime Docs](https://bun.sh/docs)
- [Node.js Best Packages](https://github.com/sindresorhus/awesome-nodejs)
- [Volta Node Installer](https://docs.volta.sh/guide/)
- [pnpm Package Installer](https://pnpm.io/pnpm-cli)
- [Starship Prompt](https://starship.rs/guide/#%F0%9F%9A%80-installation)
- [Helix Editor](https://docs.helix-editor.com)
- [Neovim](https://github.com/neovim/neovim)
- [Neovim LazyVim Config](https://www.lazyvim.org/keymaps)
- [gh github cli](https://cli.github.com/manual/gh)
- [DevDocs.io](https://devdocs.io/)
- [Terminal Best Tools](https://github.com/k4m4/terminals-are-sexy)
