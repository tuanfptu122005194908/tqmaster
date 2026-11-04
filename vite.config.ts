import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** In admin-app mode the HTML entry is admin-app.html; Capacitor expects index.html. */
function adminAppIndexRename(): Plugin {
  return {
    name: "admin-app-index-rename",
    apply: "build",
    enforce: "post",
    generateBundle(_opts, bundle) {
      const html = bundle["admin-app.html"];
      if (html) {
        html.fileName = "index.html";
        bundle["index.html"] = html;
        delete bundle["admin-app.html"];
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isAdminApp = mode === "admin-app";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), ...(isAdminApp ? [adminAppIndexRename()] : [])],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY),
    },
    ...(isAdminApp
      ? {
          publicDir: "public-app",
          build: {
            outDir: "dist-app",
            emptyOutDir: true,
            sourcemap: false,
            rollupOptions: { input: path.resolve(__dirname, "admin-app.html") },
          },
        }
      : {}),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
