import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: [...configDefaults.exclude, 'e2e/*'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
		},
		setupFiles: ['./tests/setup.ts'],
	},
	server: {
		port: 5173,
		strictPort: true
	}
});
