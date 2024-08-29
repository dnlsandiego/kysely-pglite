const originalLog = console.log
const originalWarn = console.warn

// Patching console.log and console.warn because of noisy logs from @electic/pglite
// https://github.com/electric-sql/pglite/issues/256
export function applyLogsPatch() {
  console.log = function (args) {
    if (
      typeof args === 'string' &&
      args.includes('Running in main thread, faking onCustomMessage')
    ) {
      return
    }
    originalLog(args)
  }

  console.warn = function (args) {
    if (typeof args === 'string' && args.includes('prerun(C-node)')) {
      return
    }
    originalWarn(args)
  }
}
