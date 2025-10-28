import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Enable Turbopack (default in Next.js 16)
  turbopack: {},

  // Webpack configuration for handling CSV files (fallback for webpack mode)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.csv$/,
      loader: 'csv-loader',
      options: {
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
      }
    })
    return config
  }
}

export default nextConfig
