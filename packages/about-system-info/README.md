# About System Info

A TypeScript/Node.js library to display comprehensive system information with customizable output. Cross-platform support for Windows, macOS, and Linux with caching for optimal performance.

## Features

- 🚀 **Fast**: Intelligent caching system for quick repeated access
- 🎨 **Customizable**: Configure colors, emojis, and display order
- 🔌 **Two Modes**: Use as CLI tool or import as API
- 🌍 **Cross-platform**: Works on Linux, macOS, and Windows
- 📊 **Comprehensive**: 30+ system metrics including CPU, GPU, network, containers, and more
- 💾 **TypeScript**: Full type definitions included

## Installation

```bash
npm install about-system
```

```bash
npx about-system
```

```bash
bunx about-system
```

## Examples

![systeminfo_greeting](https://i.imgur.com/BX6YsaK.png)

`👤 deck 🏠 steamdeck 📁 90% 💾 2/14GB 🔝 6% cursor ⏱️  1d 7h 18m 🌎 174.194.193.230 📍 San Jose 🔗 http://230.sub-174-194-193.myvzw.com 👮 Verizon Business ⚡ SteamOS 📈 AMD Custom APU 0405 💻 Jupiter 🔧 6.11.11-valve12-1-neptune-611-g517a46b477e1 🐚 fish 🚀 npm pip docker nvim bun 📦 docker-node`

`👤 u0_a365 🏠 localhost 📁 54% 💾 1/5GB 🔝 1% fish ⏱️ 4d 9h 19m 🌎 174.194.193.230 🌐 192.168.42.229 📍 San Jose 🔗 http://230.sub-174-194-193.myvzw.com 👮 Verizon Business ⚡ Android 13 📈 Kryo-4XX-Silver 💻 SM-G781U 🔧 4.19.113-27223811 🐚 nu 🚀 apt npm pip hx nvim`

## CLI Usage

### Basic Usage

```bash
# Show all system information
about-system

# Show specific fields
about-system cpu,ram_used,disk_used

# Output as JSON
about-system --json

# Get help
about-system --help
```

### Installation as Shell Greeting

```bash
# Install as shell greeting (runs on terminal startup)
about-system --install
```

### Configuration

```bash
# View current settings
about-system --settings-show

# Reset settings to defaults
about-system --settings-reset

# Set specific configuration values
about-system --set display.show_emojis false
about-system --set colors.user blue

# Clear cache
about-system --refresh
```

## API Usage

### Basic Example

```typescript
import { getSystemInfo } from 'about-system';

// Get all system information as JSON
const info = await getSystemInfo();

console.log(info.user);        // Current username
console.log(info.hostname);    // Computer hostname
console.log(info.os);          // Operating system
console.log(info.cpu);         // CPU model
console.log(info.ram_used);    // RAM usage (e.g., "8/16GB")
console.log(info.disk_used);   // Disk usage (e.g., "45%")
```

### Using Individual Info Functions

You can import and use individual system info functions:

```typescript
import { infoFunctions } from 'about-system/api';

// Create a context with cache
const cache = {};
const context = { cache };

// Use individual functions
const cpu = infoFunctions.cpu(context);
const ram = infoFunctions.ram_used(context);
const uptime = infoFunctions.uptime();

// Build custom monitoring tools
async function getBasicInfo() {
  return {
    user: infoFunctions.user(),
    hostname: infoFunctions.hostname(),
    uptime: infoFunctions.uptime(),
  };
}
```

### Multiple Import Styles

```typescript
// Default import (complete API)
import { getSystemInfo } from 'about-system';

// Direct API import with individual functions
import { getSystemInfo, infoFunctions } from 'about-system/api';

// CLI functions
import { displaySystemInfo } from 'about-system/cli';

// Types only
import type { SystemInfo, Platform } from 'about-system/types';
```

### All Available Fields

See the [systeminfo-types.d.ts](src/systeminfo-types.d.ts) file for complete TypeScript definitions with detailed JSDoc comments.

```typescript
interface SystemInfo {
  // System Identity
  timestamp: string;          // ISO 8601 timestamp
  hostname: string;           // Computer hostname
  user: string;              // Current username
  platform: 'linux' | 'windows' | 'macos' | 'unknown';

  // Operating System
  os: string;                // OS name and version
  kernel: string;            // Kernel version
  shell: string;             // Shell program (Linux/Unix)

  // Hardware
  cpu: string;               // CPU model
  gpu: string;               // GPU model
  device: string;            // Device/computer model

  // Real-time Resources
  disk_used: string;         // Disk usage percentage
  ram_used: string;          // RAM usage (used/total GB)
  top_process: string;       // Top CPU-consuming process
  uptime: string;            // System uptime (Xd Yh Zm)

  // Network
  ip: string;                // Public IP address
  iplocal: string;           // Local IP address(es)
  city: string;              // Geographic location
  isp: string;               // Internet service provider

  // Linux-specific
  temperature: string;       // System temperature
  battery: string;           // Battery percentage
  load_average: string;      // System load
  services_running: string;  // Active services count

  // And 20+ more fields...
}
```

### Advanced Examples

See [examples/api-usage.js](examples/api-usage.js) for more examples.

```typescript
import { getSystemInfo } from 'about-system';

// Example: Monitor system resources
async function monitorResources() {
  const info = await getSystemInfo();

  return {
    cpu: info.cpu,
    ram: info.ram_used,
    disk: info.disk_used,
    temperature: info.temperature,
    topProcess: info.top_process
  };
}

// Example: Create custom dashboard
import { infoFunctions } from 'about-system/api';

async function getDashboardData(context) {
  return {
    hardware: {
      cpu: infoFunctions.cpu(context),
      gpu: infoFunctions.gpu(context),
      device: infoFunctions.device(context),
    },
    resources: {
      ram: infoFunctions.ram_used(context),
      disk: infoFunctions.disk_used(context),
      uptime: infoFunctions.uptime(),
    },
    network: {
      localIP: infoFunctions.iplocal(),
      publicIP: await infoFunctions.ip(context),
    }
  };
}
```

### Available Info Blocks

| Block         | Description                | Example Output               |
| ------------- | -------------------------- | ---------------------------- |
| `user`        | Current username           | `👤 username`                |
| `hostname`    | System hostname            | `🏠 hostname`                |
| `ip`          | Public IP address          | `🌎 192.168.1.1`             |
| `iplocal`     | Local IP addresses         | `🌐 192.168.1.100`           |
| `city`        | Location based on IP       | `📍 San Francisco`           |
| `domain`      | Reverse DNS hostname       | `🔗 http://example.com`      |
| `isp`         | Internet service provider  | `👮 Verizon Business`        |
| `os`          | Operating system           | `⚡ Ubuntu 22.04`            |
| `cpu`         | CPU information            | `📈 Intel Core i7-8700K`     |
| `gpu`         | Graphics card              | `🎮 NVIDIA GeForce RTX 3080` |
| `disk_used`   | Disk usage percentage      | `📁 75%`                     |
| `ram_used`    | Memory usage               | `💾 8/16GB`                  |
| `top_process` | Highest CPU process        | `🔝 15% chrome`              |
| `uptime`      | System uptime              | `⏱️ 2d 5h 30m`               |
| `device`      | Device model               | `💻 MacBook Pro`             |
| `kernel`      | Kernel version             | `🔧 5.15.0-56-generic`       |
| `shell`       | Current shell              | `🐚 fish`                    |
| `pacman`      | Available package managers | `🚀 apt npm pip docker`      |
| `ports`       | Open network ports         | `🔌 80http 443https 22ssh`   |
| `containers`  | Running Docker containers  | `📦 nginx redis postgres`    |

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
    "user",
    "hostname",
    "disk_used",
    "ram_used",
    "uptime",
    "ip",
    "os",
    "cpu",
    "shell"
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

## Documentation

### JSDoc Comments

All API functions include comprehensive JSDoc documentation:

```typescript
import { infoFunctions } from 'about-system/api';

// Hover over any function in your IDE to see:
// - Function description
// - Parameter details
// - Return type information
// - Usage examples
// - Platform-specific notes

infoFunctions.cpu(context);  // IDE shows full documentation
```

**Features:**
- ✅ Every function documented with JSDoc
- ✅ Parameter and return type descriptions
- ✅ Real-world usage examples
- ✅ Platform compatibility notes
- ✅ IDE autocomplete support

### TypeScript Support

Full TypeScript definitions with:
- Complete `SystemInfo` interface
- All 30+ field types documented
- Platform-specific type unions
- Exported helper types

```typescript
import type {
  SystemInfo,           // Main info object
  Platform,             // Platform type
  SystemInfoOptions,    // Config options
  InfoContext,          // Context for functions
} from 'about-system/types';
```

## Project Structure

```
about-system-info/
├── src/
│   ├── system-info-api.ts      # Core API with JSDoc (exported infoFunctions)
│   ├── about-system-cli.ts     # CLI interface
│   ├── index.ts                # Main entry point
│   └── systeminfo-types.d.ts   # TypeScript type definitions
├── dist/                       # Compiled JavaScript output (Vite build)
│   ├── index.js                # Main entry (0.19 KB)
│   ├── system-info-api.js      # Core API (21 KB)
│   ├── about-system-cli.js     # CLI (10 KB)
│   └── *.d.ts                  # Type definitions
├── examples/
│   └── api-usage.js           # Example API usage
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── package.json
└── README.md
```

## Development

```bash
# Clone the repository
git clone https://github.com/OpenSourceAGI/StarterDOCS.git
cd StarterDOCS/packages/about-system-info

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run CLI
npm start

# Watch mode for development
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

rights.institute/prosper

## Links

- [Repository](https://github.com/OpenSourceAGI/StarterDOCS/tree/master/packages/about-system-info)
- [Issues](https://github.com/OpenSourceAGI/StarterDOCS/issues)
