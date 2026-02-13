import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": [
            "react",
            "react-dom",
            "react-router",
            "@refinedev/react-router",
          ],

          "vendor-antd-refine-lib": [
            "antd",
            "@ant-design/icons",
            "@ant-design/v5-patch-for-react-19",
            "@refinedev/core",
            "@refinedev/antd",
          ],
          "vendor-editor": ["@uiw/react-md-editor"],
          "vendor-charts": ["recharts"],
          "vendor-utils": ["dayjs", "i18next", "react-i18next", "zustand"],
        },
      },
    },
    // 调高警告阈值 (可选，仅仅是为了不报黄字)
    chunkSizeWarningLimit: 2000,
  },
});
