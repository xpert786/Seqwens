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
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure proper chunk dependencies and loading order
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Keep React, React-DOM, React Router, and Stripe in the main bundle
          // This ensures core dependencies are always loaded before any other code tries to use them
          if (id.includes('node_modules')) {
            // Keep React, React Router, and Stripe in the main bundle
            // Stripe needs to be with React to avoid initialization order issues
            if (id.includes('/react/') || id.includes('/react-dom/') || 
                id.includes('react/index') || id.includes('react-dom/index') ||
                id.includes('/scheduler/') || id.includes('react-router') ||
                id.includes('@stripe')) {
              return undefined; // Keep in main bundle
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
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs-vendor';
            }
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'jspdf-vendor';
            }
            // Other large vendor libraries
            if (id.includes('axios') || id.includes('html2canvas')) {
              return 'utils-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
          
          // Split large source files
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
            if (id.includes('DocumentManagement') || id.includes('PdfViewer') || id.includes('FolderContents')) {
              return 'firm-documents';
            }
            if (id.includes('ESignatureManagement') || id.includes('ESignature')) {
              return 'firm-esignature';
            }
            if (id.includes('Billing') || id.includes('Invoice')) {
              return 'firm-billing';
            }
            if (id.includes('Staff')) {
              return 'firm-staff';
            }
            if (id.includes('ClientManagement') || id.includes('ClientManage')) {
              return 'firm-clients';
            }
            if (id.includes('TaskManagement') || id.includes('TaskDetails')) {
              return 'firm-tasks';
            }
            if (id.includes('Scheduling') || id.includes('calendar')) {
              return 'firm-scheduling';
            }
            if (id.includes('Offices')) {
              return 'firm-offices';
            }
            // Other FirmAdmin pages - keep routes together
            if (id.includes('FirmRoutes')) {
              return 'firm-routes';
            }
            // Other FirmAdmin components
            return 'firm-routes';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200, // Increase limit to 1.2MB
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    // Ensure proper source maps for debugging
    sourcemap: false, // Set to true for debugging, false for production
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
