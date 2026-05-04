import "../styles.css";
import { BADGE_IMAGES, PLATFORM_LABELS } from "../assets";
import { getOS, platformMatchesOS } from "../os";
import { resolveHref } from "../store-urls";
import type { DownloadButtonProps } from "../types";

export function DownloadAppButton({
  platform,
  href,
  appId,
  newTab = true,
  height = 56,
  className = "",
  alt,
  autoHighlight = false,
  highlight,
}: DownloadButtonProps) {
  const currentOS = getOS();
  const resolvedHref = href ?? (appId ? resolveHref(platform, appId, currentOS) : "#");

  const src = BADGE_IMAGES[platform];
  const label = alt ?? PLATFORM_LABELS[platform];

  const isHighlighted =
    highlight !== undefined
      ? highlight
      : autoHighlight && platformMatchesOS(platform, currentOS);

  return (
    <a
      href={resolvedHref}
      target={newTab ? "_blank" : "_self"}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={[
        "inline-block rounded transition-all duration-200",
        "hover:scale-105",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
        isHighlighted
          ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent shadow-[0_0_18px_4px_rgba(250,204,21,0.55)]"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={src}
        alt={label}
        style={{ height }}
        className="block"
        draggable={false}
      />
    </a>
  );
}
