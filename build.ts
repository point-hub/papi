import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  splitting: true,
  minify: true,
  target: 'bun',
  outdir: './lib',
  plugins: [dts()],
})
