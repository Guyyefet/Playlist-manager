// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '$lib/types';
import type { Token } from '$auth/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: User;
			token?: Token | null;
			cookies: import('@sveltejs/kit').Cookies;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
