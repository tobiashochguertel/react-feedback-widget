/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  // Allow importing from parent directory (the library)
  transpilePackages: ['react-visual-feedback'],
}

module.exports = nextConfig
