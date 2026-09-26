import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 30000, retries: 0,
  use: { baseURL: `http://127.0.0.1:4173${process.env.PORT_BASE || '/'}`, headless: true,
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort', url: `http://127.0.0.1:4173${process.env.PORT_BASE || '/'}`, reuseExistingServer: false },
});
