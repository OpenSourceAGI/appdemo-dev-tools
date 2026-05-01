import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Phone }   from 'lucide-react';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="inline-flex items-center gap-2">
        <Phone />
        Verify Phone 
      </span>
    ),
  },
};
