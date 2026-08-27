import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      // ESM only. A UMD build would need a `THREE` global, but three has not
      // shipped a UMD bundle since r160, so that artifact could never run.
      formats: ['es'],
      fileName: 'react-three-lite'
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library.
      // Use regexes so subpath imports such as `three/webgpu` and `three/tsl`
      // are externalized too. A plain 'three' string only matches the exact
      // specifier, which would bundle a second copy of three and break class
      // identity checks (e.g. LightsNode failing to recognize light instances).
      external: [/^react($|\/)/, /^react-dom($|\/)/, /^three($|\/)/, /^three-stdlib($|\/)/]
    }
  },
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      // Tests are part of the source tree so they get typechecked, but they must
      // never leak into the published type declarations.
      exclude: ['src/__tests__/**']
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
