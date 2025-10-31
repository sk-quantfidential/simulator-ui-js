import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Webpack configuration for handling CSV files
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
