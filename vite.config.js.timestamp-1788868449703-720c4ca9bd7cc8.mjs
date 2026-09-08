// vite.config.js
import { defineConfig } from "file:///E:/%D8%B9%D8%A7%D9%85/yahia2/yahia2/node_modules/vite/dist/node/index.js";
import react from "file:///E:/%D8%B9%D8%A7%D9%85/yahia2/yahia2/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///E:/%D8%B9%D8%A7%D9%85/yahia2/yahia2/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png"],
      manifest: {
        name: "\u0633\u0648\u0642 \u0641\u0627\u0642\u0648\u0633",
        short_name: "\u0633\u0648\u0642 \u0641\u0627\u0642\u0648\u0633",
        description: "\u0643\u0644 \u0645\u062D\u0644\u0627\u062A \u0645\u062F\u064A\u0646\u062A\u0643 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F",
        theme_color: "#111827",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      }
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxcdTA2MzlcdTA2MjdcdTA2NDVcXFxceWFoaWEyXFxcXHlhaGlhMlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcXHUwNjM5XHUwNjI3XHUwNjQ1XFxcXHlhaGlhMlxcXFx5YWhpYTJcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6LyVEOCVCOSVEOCVBNyVEOSU4NS95YWhpYTIveWFoaWEyL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24ucG5nJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnXHUwNjMzXHUwNjQ4XHUwNjQyIFx1MDY0MVx1MDYyN1x1MDY0Mlx1MDY0OFx1MDYzMycsXG4gICAgICAgIHNob3J0X25hbWU6ICdcdTA2MzNcdTA2NDhcdTA2NDIgXHUwNjQxXHUwNjI3XHUwNjQyXHUwNjQ4XHUwNjMzJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdcdTA2NDNcdTA2NDQgXHUwNjQ1XHUwNjJEXHUwNjQ0XHUwNjI3XHUwNjJBIFx1MDY0NVx1MDYyRlx1MDY0QVx1MDY0Nlx1MDYyQVx1MDY0MyBcdTA2NDFcdTA2NEEgXHUwNjQ1XHUwNjQzXHUwNjI3XHUwNjQ2IFx1MDY0OFx1MDYyN1x1MDYyRFx1MDYyRicsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzExMTgyNycsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjZmZmZmZmJyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7IHNyYzogJy9mYXZpY29uLnBuZycsIHNpemVzOiAnMTkyeDE5MicsIHR5cGU6ICdpbWFnZS9wbmcnLCBwdXJwb3NlOiAnYW55JyB9LFxuICAgICAgICAgIHsgc3JjOiAnL2Zhdmljb24ucG5nJywgc2l6ZXM6ICc1MTJ4NTEyJywgdHlwZTogJ2ltYWdlL3BuZycsIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH0pXG4gIF1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUSxTQUFTLG9CQUFvQjtBQUNsUyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBRXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxhQUFhO0FBQUEsTUFDN0IsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsU0FBUztBQUFBLFFBQ1QsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFVBQ0wsRUFBRSxLQUFLLGdCQUFnQixPQUFPLFdBQVcsTUFBTSxhQUFhLFNBQVMsTUFBTTtBQUFBLFVBQzNFLEVBQUUsS0FBSyxnQkFBZ0IsT0FBTyxXQUFXLE1BQU0sYUFBYSxTQUFTLGVBQWU7QUFBQSxRQUN0RjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
