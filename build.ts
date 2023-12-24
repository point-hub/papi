await Bun.build({
  entrypoints: ['./src/index.ts'],
  splitting: true,
  minify: true,
  target: 'bun',
  outdir: './lib',
})
