// Cloudflare Pages build configuration
export default {
  build: {
    command: 'npm run build:static',
    output: 'dist/public',
    environment: {
      NODE_VERSION: '18'
    }
  },
  functions: {
    // Disable server-side functions for static deployment
    enabled: false
  },
  redirects: [
    {
      from: '/api/*',
      to: '/404.html',
      status: 404
    }
  ],
  headers: [
    {
      for: '/*',
      values: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  ]
};