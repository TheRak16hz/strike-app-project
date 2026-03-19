import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'clean-logs',
      configureServer(server) {
        server.printUrls = () => {
          const port = server.config.server.port || 5173;
          console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   http://localhost:\x1b[1m${port}\x1b[0m/`);
          console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m http://192.168.0.135:\x1b[1m${port}\x1b[0m/`);
        };
      }
    }
  ],
  server: {
    host: true
  }
})
