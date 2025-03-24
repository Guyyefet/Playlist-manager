import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			'$lib': './src/lib',
			'$lib/*': './src/lib/*',
			'$server': './src/lib/server',
			'$server/*': './src/lib/server/*',
			'$youtube': './src/lib/server/youtube',
			'$youtube/*': './src/lib/server/youtube/*',
			'$auth': './src/lib/server/auth',
			'$auth/*': './src/lib/server/auth/*',
			'$db': './src/lib/server/db',
			'$db/*': './src/lib/server/db/*'
		},
		env: {
			dir: './',
			publicPrefix: 'PUBLIC_'
		}
	}
};

export default config;
