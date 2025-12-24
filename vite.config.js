import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/seqwens-frontend', // Base path for the application
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', '@stripe/stripe-js', '@stripe/react-stripe-js'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            // React and React-DOM
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Material-UI
            if (id.includes('@mui')) {
              return 'mui-vendor';
            }
            // Chart libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'charts-vendor';
            }
            // PDF libraries
            if (id.includes('jspdf') || id.includes('pdfjs-dist') || id.includes('react-pdf') || id.includes('pdf-lib')) {
              return 'pdf-vendor';
            }
            // Stripe
            if (id.includes('@stripe')) {
              return 'stripe-vendor';
            }
            // Other large vendor libraries
            if (id.includes('axios') || id.includes('html2canvas')) {
              return 'utils-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB for warnings
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://168.231.121.7/seqwens',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep /api in the path
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            console.log('Target URL:', proxyReq.path);
            // Handle OPTIONS preflight requests
            if (req.method === 'OPTIONS') {
              proxyReq.method = req.method;
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            // Handle CORS headers for OPTIONS requests
            if (req.method === 'OPTIONS') {
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
              proxyRes.headers['Access-Control-Max-Age'] = '86400';
            }
          });
        },
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      },
      '/seqwens/media': {
        target: 'http://168.231.121.7',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep /seqwens/media in the path
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('media proxy error', err);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for media files
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
          });
        }
      }
    }
  }
})
