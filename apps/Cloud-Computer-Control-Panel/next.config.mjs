/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@aws-sdk/client-ec2', '@aws-sdk/credential-providers', 'ssh2', 'node-forge'],
  turbopack: {},
}

export default nextConfig
