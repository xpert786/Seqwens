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
    // Ensure React is always available for react-pdf
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    rollupOptions: {
      // Ensure React is properly resolved for all chunks
      external: (id) => {
        // Don't externalize React - we want it bundled
        return false;
      },
      output: {
        // Ensure proper chunk dependencies and loading order
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Ensure chunks that depend on React wait for React to load
        manualChunks: (id) => {
          // Don't split React - keep it in the main bundle to ensure it's always available
          // This prevents "Cannot read properties of undefined" errors
          if (id.includes('node_modules')) {
            // Keep React, React-DOM, and React Router in the main index bundle (don't split them)
            // This ensures React is always loaded before any other code tries to use it
            // React Router must also be in the main bundle since it depends on React
            if (id.includes('/react/') || id.includes('/react-dom/') || 
                id.includes('react/index') || id.includes('react-dom/index') ||
                id.includes('/scheduler/') || id.includes('react-router')) {
              // Return undefined to keep React and React Router in the main bundle
              return undefined;
            }
            // Material-UI
            if (id.includes('@mui')) {
              return 'mui-vendor';
            }
            // Chart libraries
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
              return 'charts-vendor';
            }
            // PDF libraries - split into separate chunks to reduce size
            // Note: react-pdf has been removed, only pdfjs-dist remains (if used elsewhere)
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs-vendor';
            }
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'jspdf-vendor';
            }
            if (id.includes('pdf-lib')) {
              return 'pdf-lib-vendor';
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
            // Split DocumentManagement and related components
            if (id.includes('DocumentManagement') || id.includes('PdfViewer') || id.includes('FolderContents')) {
              return 'firm-documents';
            }
            if (id.includes('ESignatureManagement') || id.includes('ESignature')) {
              return 'firm-esignature';
            }
            if (id.includes('ClientManage') || id.includes('ClientDetails') || id.includes('ClientManagement')) {
              return 'firm-clients';
            }
            if (id.includes('StaffManagement') || id.includes('StaffDetails') || id.includes('Staff')) {
              return 'firm-staff';
            }
            if (id.includes('TaskManagement') || id.includes('TaskDetails') || id.includes('Tasks')) {
              return 'firm-tasks';
            }
            if (id.includes('Billing') || id.includes('Invoice')) {
              return 'firm-billing';
            }
            if (id.includes('Scheduling') || id.includes('calendar') || id.includes('Appointments')) {
              return 'firm-scheduling';
            }
            if (id.includes('Offices') || id.includes('Office')) {
              return 'firm-offices';
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
