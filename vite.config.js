import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        dreamfields: "src/dreamfields.html",
        askChristina: "src/ask-christina.html",
      },
    },
  },
});
