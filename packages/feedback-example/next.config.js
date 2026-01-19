/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  // Allow importing from parent directory (the library)
  transpilePackages: ['react-visual-feedback'],
  // Skip type checking during build (types are checked separately with tsc)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Output standalone for Docker deployment
  output: 'standalone',
}

module.exports = nextConfig
