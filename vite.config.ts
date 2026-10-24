import { defineConfig } from "vite";
export default defineConfig({
  base: "/hollowbane/",
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        index: "index.html",
        "character-storage": "src/rendering/character-storage.ts",
      },
      preserveEntrySignatures: "strict",
    },
  },
});
