import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [],
  vite: { plugins: [tailwindcss()] },
  server: { host: true, port: Number(process.env.PORT) || 4321 },
});
