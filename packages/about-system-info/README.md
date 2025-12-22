<p align="center">
    <img src="https://i.imgur.com/1kwKBTR.png">
</p>
<p align="center">
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/vtempest/server-shell-setup">
    <a href="https://github.com/vtempest/server-shell-setup/discussions">
    <img alt="GitHub Discussions"
        src="https://img.shields.io/github/discussions/vtempest/server-shell-setup">
    </a>
     <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request">
            <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
    </a>
    <a href="https://codespaces.new/vtempest/server-shell-setup">
    <img src="https://github.com/codespaces/badge.svg" width="150" height="20">
    </a>
</p>

## Node.js Shell System Info Metadata

```bash
bunx about-system
```
```bash
npx about-system
```


A cross-platform Node.js implementation of the system info script with enhanced features, caching, and full customization support.

[NPM](https://www.npmjs.com/package/about-system-info)

## Examples

![systeminfo_greeting](https://i.imgur.com/BX6YsaK.png)

`👤 deck 🏠 steamdeck 📁 90% 💾 2/14GB 🔝 6% cursor ⏱️  1d 7h 18m 🌎 174.194.193.230 📍 San Jose 🔗 http://230.sub-174-194-193.myvzw.com 👮 Verizon Business ⚡ SteamOS 📈 AMD Custom APU 0405 💻 Jupiter 🔧 6.11.11-valve12-1-neptune-611-g517a46b477e1 🐚 fish 🚀 npm pip docker nvim bun 📦 docker-node`

 `👤 u0_a365 🏠 localhost 📁 54% 💾 1/5GB 🔝 1% fish ⏱️ 4d 9h 19m 🌎 174.194.193.230 🌐 192.168.42.229 📍 San Jose 🔗 http://230.sub-174-194-193.myvzw.com 👮 Verizon Business ⚡ Android 13 📈 Kryo-4XX-Silver 💻 SM-G781U 🔧 4.19.113-27223811 🐚 nu 🚀 apt npm pip hx nvim`

### Features

- **Cross-Platform**: Works on any Linux, Windows PowerShell (most features), macOS, Android Termux
- **Smart Caching**: Configurable cache durations for different system info types
- **Customizable Output**: Control which info blocks to show and their order
- **Network Info**: Fetches IP, location, and ISP data from ipinfo.io
- **Emoji Support**: Beautiful emoji-enhanced output (can be disabled)
- **Settings Management**: Persistent configuration with JSON settings file
- **Shell Integration**: Easy installation as shell greeting
- **Performance Optimized**: Caches expensive operations like network requests

### Installation

#### Global Installation (Recommended)
```bash
npx about-system
```

### Quick Start

1. **Run the script**:
   ```bash
   about-system
   ```

2. **Install as shell greeting**:
   ```bash
   about-system --install
   ```

3. **Customize settings**:
   ```bash
   about-system --set display.show_emojis false
   about-system --set colors.user blue
   about-system --set display_order '["user","hostname","uptime"]'
   ```

### Available Info Blocks

| Block | Description | Example Output |
|-------|-------------|----------------|
| `user` | Current username | `👤 username` |
| `hostname` | System hostname | `🏠 hostname` |
| `ip` | Public IP address | `🌎 192.168.1.1` |
| `iplocal` | Local IP addresses | `🌐 192.168.1.100` |
| `city` | Location based on IP | `📍 San Francisco` |
| `domain` | Reverse DNS hostname | `🔗 http://example.com` |
| `isp` | Internet service provider | `👮 Verizon Business` |
| `os` | Operating system | `⚡ Ubuntu 22.04` |
| `cpu` | CPU information | `📈 Intel Core i7-8700K` |
| `gpu` | Graphics card | `🎮 NVIDIA GeForce RTX 3080` |
| `disk_used` | Disk usage percentage | `📁 75%` |
| `ram_used` | Memory usage | `💾 8/16GB` |
| `top_process` | Highest CPU process | `🔝 15% chrome` |
| `uptime` | System uptime | `⏱️ 2d 5h 30m` |
| `device` | Device model | `💻 MacBook Pro` |
| `kernel` | Kernel version | `🔧 5.15.0-56-generic` |
| `shell` | Current shell | `🐚 fish` |
| `pacman` | Available package managers | `🚀 apt npm pip docker` |
| `ports` | Open network ports | `🔌 80http 443https 22ssh` |
| `containers` | Running Docker containers | `📦 nginx redis postgres` |

### Configuration

The script uses a JSON settings file located at:
- **Linux/macOS**: `~/.config/systeminfo-settings.json`
- **Windows**: `%APPDATA%\systeminfo-settings.json`

#### Settings Commands

```bash
# Show current settings
about-system --settings-show

# Reset to defaults
about-system --settings-reset

# Set individual values
about-system --set display.show_emojis false
about-system --set colors.user blue
about-system --set cache.enabled true

# Clear cache
about-system --cache-clear
```

#### Example Settings

```json
{
  "version": "1.0.0",
  "display_order": [
    "user", "hostname", "disk_used", "ram_used", "uptime",
    "ip", "os", "cpu", "shell"
  ],
  "colors": {
    "user": "red",
    "hostname": "orange",
    "disk_used": "purple",
    "ram_used": "yellow",
    "uptime": "cyan",
    "ip": "green",
    "os": "blue",
    "cpu": "orange",
    "shell": "orange"
  },
  "display": {
    "show_emojis": true,
    "separator": " ",
    "max_width": 120
  },
  "cache": {
    "enabled": true
  },
  "network": {
    "timeout": 5000,
    "show_offline_message": true
  }
}
```

### Available Colors

- `red`, `orange`, `yellow`, `green`, `blue`, `cyan`, `purple`, `magenta`, `gray`, `lightblue`
- Use `multicolor` for ports to get a rainbow effect

### Platform-Specific Features

#### Windows
- Detects Windows-specific package managers (choco, winget, scoop)
- Uses `wmic` for system information
- Supports PowerShell and Command Prompt integration

#### Linux
- Detects Linux package managers (apt, yum, pacman, etc.)
- Reads from `/proc` and `/sys` filesystems
- Supports various shells (bash, zsh, fish, nushell)

#### macOS
- Detects macOS-specific tools
- Uses `system_profiler` for hardware info
- Supports zsh and bash integration

### Cache System

The script implements intelligent caching to improve performance:

- **IP Info**: 5 minutes (network requests are expensive)
- **System Info**: 24 hours (rarely changes)
- **Process Info**: 5 seconds (changes frequently)
- **Disk/RAM**: 1 minute (moderate change frequency)

### Shell Integration

The `--install` flag automatically configures the script as a shell greeting:

- **Bash**: Adds to `~/.bashrc`
- **Zsh**: Adds to `~/.zshrc`
- **Fish**: Adds to `~/.config/fish/config.fish`
- **NuShell**: Adds to `~/.config/nushell/config.nu`
- **PowerShell**: Provides instructions for profile setup

### Development

```bash
# Clone the repository
git clone https://github.com/vtempest/server-shell-setup.git
cd server-shell-setup

# Install dependencies
npm install

# Run the script
npm start

# Run with custom settings
npm start -- --set display.show_emojis false
```
