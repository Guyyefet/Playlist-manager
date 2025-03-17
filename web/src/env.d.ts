/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface PrivateEnv {
    ENCRYPTION_KEY: string;
    ENCRYPTION_IV: string;
  }
}
