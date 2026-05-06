<p align="center">
    <img src="https://i.imgur.com/5lsiepL.png" width="300" >
</p>

# react-native-app-buttons

React badge components for app store and platform download links. Badges ship as bundled assets — no CDN required.

## Install

```bash
npm install react-native-app-buttons
```

Import the bundled stylesheet if your project doesn't use Tailwind:

```ts
import "react-native-app-buttons/styles";
```

## Features

- **8 platforms** — iOS App Store, Google Play, Chrome Web Store, Mac App Store, Microsoft Store, Linux, Snap Store
- **`appId` prop** — pass your app identifier and the correct store URL is built automatically per platform
- **Native deep links** — when the user is on the matching OS the button uses the native store protocol (`itms-apps://`, `macappstore://`, `market://`, `ms-windows-store://`) so the store app opens directly
- **`autoHighlight`** — detects the user's OS via `navigator.userAgent` and applies a golden glow ring to the matching platform button
- **`highlight`** — manually force the golden glow on any button
- **`newTab`** — open in new tab (default) or same tab
- **`height`** — badge image height in px (default `56`)
- **Exported utilities** — `getOS()`, `OS` enum, `buildStoreUrl()`, `buildDeepLink()`, `platformMatchesOS()`

## Usage

```tsx
import { DownloadAppButton } from "react-native-app-buttons";

<DownloadAppButton platform="ios"              appId="6474268307"               autoHighlight />
<DownloadAppButton platform="android"          appId="com.example.app"          autoHighlight />
<DownloadAppButton platform="chrome-extension" appId="noecbaibfh..."            autoHighlight />
<DownloadAppButton platform="macos"            appId="6474268307"               autoHighlight />
<DownloadAppButton platform="windows"          appId="9NBLGGH4NNS1"             autoHighlight />
<DownloadAppButton platform="linux-snap"       appId="my-app"                   autoHighlight />
<DownloadAppButton platform="linux"            href="https://example.com/linux" autoHighlight />
```

Pass `href` instead of `appId` to use an explicit URL:

```tsx
<DownloadAppButton platform="ios" href="https://apps.apple.com/app/id6474268307" />
```

## Props

| Prop              | Type         | Default        | Notes                                          |
| ----------------- | ------------ | -------------- | ---------------------------------------------- |
| `platform`      | `Platform` | —             | Required                                       |
| `appId`         | `string`   | —             | Either `appId` or `href` required          |
| `href`          | `string`   | —             | Either `appId` or `href` required          |
| `autoHighlight` | `boolean`  | `false`      | Golden glow when OS matches platform           |
| `highlight`     | `boolean`  | —             | Force glow on/off; overrides `autoHighlight` |
| `newTab`        | `boolean`  | `true`       | `target="_blank"`                            |
| `height`        | `number`   | `56`         | Badge height in px                             |
| `className`     | `string`   | `""`         | Extra classes on `<a>`                       |
| `alt`           | `string`   | Platform label | Accessible alt text                            |

## Deep link schemes

| Platform | Native deep link                              | Web fallback                                            |
| -------- | --------------------------------------------- | ------------------------------------------------------- |
| iOS      | `itms-apps://itunes.apple.com/app/id{id}`   | `https://apps.apple.com/app/id{id}`                   |
| macOS    | `macappstore://itunes.apple.com/app/id{id}` | `https://apps.apple.com/app/id{id}`                   |
| Android  | `market://details?id={pkg}`                 | `https://play.google.com/store/apps/details?id={pkg}` |
| Windows  | `ms-windows-store://pdp/?productid={id}`    | `https://apps.microsoft.com/detail/{id}?rtc=1`        |
| Chrome   | —                                            | `https://chromewebstore.google.com/detail/{id}`       |
| Snap     | —                                            | `https://snapcraft.io/{name}`                         |

## Utilities

```ts
import { getOS, OS, platformMatchesOS, buildStoreUrl, buildDeepLink, resolveHref } from "react-native-app-buttons";

getOS()                                             // → OS.macOS | OS.Windows | OS.Linux | …
platformMatchesOS("macos", getOS())                 // → true on macOS
buildStoreUrl("android", "com.example.app")         // → "https://play.google.com/…"
buildDeepLink("android", "com.example.app")         // → "market://details?id=…"
resolveHref("android", "com.example.app", getOS()) // → deep link on Android, web elsewhere
```

## Dev

```bash
npm run dev        # demo at http://localhost:5173
        build      # library build → dist/
        typecheck
```
