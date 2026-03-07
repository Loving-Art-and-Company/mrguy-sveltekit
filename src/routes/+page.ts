// Keep the homepage server-rendered so the canonical-host redirect in hooks.server.ts
// runs before the browser starts requesting app assets.
export const prerender = false;
