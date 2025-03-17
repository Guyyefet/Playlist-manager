// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Token } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: Token;
			cookies: import('@sveltejs/kit').Cookies;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
