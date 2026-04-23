import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        dreamfields: "src/dreamfields.html",
        askChristina: "src/ask-christina.html",
        semanticdrift: "src/semantic-drift.html",
        mirror: "src/mirror.html",
        lostintranslation: "src/lost-in-translation.html",
        readbetweenthelines: "read-between-the-lines.html"
      },
    },
  },
});
