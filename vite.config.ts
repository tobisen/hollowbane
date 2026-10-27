import { defineConfig } from "vite";
import { warriorProductionAssets } from "./scripts/warrior-production-assets";
export default defineConfig({
  base: "/hollowbane/",
  plugins: [warriorProductionAssets()],
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
