import pluginVue from 'eslint-plugin-vue'
import js from "@eslint/js";
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      // override/add rules settings here, such as:
      // 'vue/no-unused-vars': 'error'
    }
  },
  {
    ignores: [
      'deviceHandlers/',
      "smartApps/",
      "babel.config.cjs",
    ]
  },
]