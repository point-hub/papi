export { ConsoleKernel } from './console'
export { Server as BaseServer } from './server'

export const stubDir = import.meta.path.replace('/index.ts', '/../stub').replace('/index.js', '/../stub')
