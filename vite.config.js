import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/seqwens-frontend', // Base path for the application
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'jspdf',
      'jspdf-autotable',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js'
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Don't split React - keep it in the main bundle to ensure it's always available
          // This prevents "Cannot read properties of undefined" errors
          if (id.includes('node_modules')) {
            // Keep React and React-DOM in the main index bundle (don't split them)
            // This ensures React is always loaded before any other code tries to use it
            if (id.includes('/react/') || id.includes('/react-dom/') || 
                id.includes('react/index') || id.includes('react-dom/index') ||
                id.includes('/scheduler/')) {
              // Return undefined to keep React in the main bundle
              return undefined;
            }
            // React Router - can be split since it depends on React being available
            if (id.includes('react-router')) {
              return 'react-router-vendor';
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
          
          // Split large source files
          // Split apiUtils into its own chunk since it's very large
          if (id.includes('apiUtils.jsx')) {
            return 'api-utils';
          }
          
          // Split route files into separate chunks
          if (id.includes('TaxRoutes') || id.includes('Taxpreparer')) {
            return 'tax-routes';
          }
          if (id.includes('SuperRoutes') || id.includes('SuperAdmin')) {
            return 'super-routes';
          }
          
          // Split FirmAdmin into smaller chunks
          if (id.includes('FirmAdmin')) {
            // Split large pages into separate chunks
            if (id.includes('OverviewFirm') || id.includes('OverView')) {
              return 'firm-overview';
            }
            if (id.includes('SubscriptionManagement') || id.includes('Subscription')) {
              return 'firm-subscription';
            }
            if (id.includes('Workflow') || id.includes('Workflow-temp')) {
              return 'firm-workflow';
            }
            if (id.includes('Analytics')) {
              return 'firm-analytics';
            }
            // Don't split DocumentManagement - keep it with firm-routes to avoid circular dependency issues
            // if (id.includes('DocumentManagement') || id.includes('Document')) {
            //   return 'firm-documents';
            // }
            if (id.includes('Billing') || id.includes('Invoice')) {
              return 'firm-billing';
            }
            // Other FirmAdmin pages
            return 'firm-routes';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200, // Increase limit to 1.2MB for warnings (route chunks are acceptable at this size)
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
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
