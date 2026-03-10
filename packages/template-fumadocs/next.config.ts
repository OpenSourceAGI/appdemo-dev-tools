import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';


const withMDX = createMDX({
  // mdxOptions: {
  //   remarkImageOptions: {
  //     onError: "ignore", // or "hide"
  //   },
  // },
});



export const config: NextConfig = {
  // output: 'export',
  // distDir: './dist',
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',  
        destination: '/llms.mdx/docs/:path*',
      },
    ];
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
    ],
    unoptimized: true,
  },
};
export default withMDX(config as any);
