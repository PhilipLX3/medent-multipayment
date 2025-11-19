/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disabled for react-beautiful-dnd compatibility
  output: 'standalone',
  // Disable type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  // Configure Turbopack for Next.js 16
  turbopack: {
    resolveAlias: {
      '@': './',
      '@/shared': './src/shared',
      '@/applications/_services': './app/(applications)/_services',
      '@/applications/_components': './app/(applications)/_components',
      '@/applications/_types': './app/(applications)/_types',
      '@/contracts/_components': './app/(contracts)/_components',
      '@/contracts/_services': './app/(contracts)/_services',
      '@/contracts/_types': './app/(contracts)/_types',
      '@/projects/_components': './app/(projects)/_components',
      '@/projects/_services': './app/(projects)/_services',
      '@/projects/_types': './app/(projects)/_types',
      '@/auth/_components': './app/(auth)/_components',
    },
  },
  webpack: (config, { isServer }) => {
    // Add path aliases for webpack with absolute paths
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/applications/_services': path.resolve(__dirname, 'app/(applications)/_services'),
      '@/applications/_components': path.resolve(__dirname, 'app/(applications)/_components'),
      '@/applications/_types': path.resolve(__dirname, 'app/(applications)/_types'),
      '@/contracts/_components': path.resolve(__dirname, 'app/(contracts)/_components'),
      '@/contracts/_services': path.resolve(__dirname, 'app/(contracts)/_services'),
      '@/contracts/_types': path.resolve(__dirname, 'app/(contracts)/_types'),
      '@/projects/_components': path.resolve(__dirname, 'app/(projects)/_components'),
      '@/projects/_services': path.resolve(__dirname, 'app/(projects)/_services'),
      '@/projects/_types': path.resolve(__dirname, 'app/(projects)/_types'),
      '@/auth/_components': path.resolve(__dirname, 'app/(auth)/_components'),
    };
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      zlib: false,
    };
    
    // Handle Node.js built-in modules for browser
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:path': false,
        'node:fs': false,
        'node:crypto': false,
        'node:stream': false,
        'node:zlib': false,
      };
    }
    
    // Configure chunk splitting for better dynamic imports
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            kuromoji: {
              test: /[\\/]node_modules[\\/]@patdx[\\/]kuromoji/,
              name: 'kuromoji',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    // Copy Kuromoji dictionary files to public directory during build
    if (!isServer) {
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('CopyKuromojiDict', () => {
            const fs = require('fs');
            const path = require('path');
            
            const srcDir = path.join(__dirname, 'node_modules/@patdx/kuromoji/dict');
            const destDir = path.join(__dirname, 'public/kuromoji-dict');
            
            if (fs.existsSync(srcDir)) {
              if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
              }
              
              const files = fs.readdirSync(srcDir);
              files.forEach(file => {
                const srcFile = path.join(srcDir, file);
                const destFile = path.join(destDir, file);
                if (fs.statSync(srcFile).isFile()) {
                  fs.copyFileSync(srcFile, destFile);
                }
              });
              
              console.log('Kuromoji dictionary files copied to public directory');
            }
          });
        }
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;
