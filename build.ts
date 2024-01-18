await Bun.build({
  entrypoints: ['./src/index.ts'],
  splitting: false,
  minify: false,
  target: 'bun',
  outdir: './lib',
})
