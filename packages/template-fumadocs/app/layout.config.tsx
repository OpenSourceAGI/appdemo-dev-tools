/**
 * @file layout.config.tsx
 * @description Configuration for the documentation layout, including navigation and links.
 */
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { docsConfig } from '@/lib/fumadocs/customize-docs';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="inline-flex items-center gap-2">
        {docsConfig.favicon ? <img src={docsConfig.favicon} alt="Logo" /> : <div className="w-6 h-6 bg-primary rounded-full" />}
        {docsConfig.title}
      </span>
    ),
  },
  links: docsConfig.topLinks ?? [],
};
