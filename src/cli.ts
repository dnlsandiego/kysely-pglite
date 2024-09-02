import { Codegen } from '#codegen.js'
import { DEFAULT_OUT_FILE, pgDataFiles } from '#constants.js'
import { applyLogsPatch } from '#utils/apply-logs-patch.js'
import { createKyselyPGlite } from '#utils/create-kysely.js'
import { createMigrator } from '#utils/create-migrator.js'
import { getDatabaseErrorInfo } from '#utils/get-database-error-info.js'
import { Args, Command, Flags } from '@oclif/core'
import { isError } from '@sindresorhus/is'
import chokidar from 'chokidar'
import consola from 'consola'
import { colorize } from 'consola/utils'
import { lstatSync } from 'fs'
import fs from 'fs-extra'
import { group } from 'radash'

// Patching console.log and console.warn because of noisy logs from @electic/pglite
// https://github.com/electric-sql/pglite/issues/256
applyLogsPatch()

export default class CodegenCommand extends Command {
  static override args = {
    path: Args.string({
      required: true,
      parse: async (path) => {
        const stat = lstatSync(path, { throwIfNoEntry: false })
        if (!stat?.isDirectory() && !stat?.isFile()) {
          throw new Error(
            `${path} is an invalid path. It doesn't resolve to a file or directory`,
          )
        }
        return path
      },
      description:
        'The path to a file/directory of Kysely migrations or a persisted PGlite database',
    }),
  }

  static override description =
    'Generate TypeScript types based on Kysely migrations or a persisted PGlite database'

  static override examples = [
    '<%= config.bin %> <%= command.id %> ./src/db/migrations --out-file ./src/db/types.ts',
    '<%= config.bin %> <%= command.id %> ./src/db/migrations-file.ts',
    '<%= config.bin %> <%= command.id %> ./pgdata',
    '<%= config.bin %> <%= command.id %> --watch ./src/db/migrations',
  ]

  static override flags = {
    watch: Flags.boolean({
      char: 'w',
      default: false,
      description:
        'Watches the given path and generates types whenever a change is detected',
    }),
    outFile: Flags.string({
      char: 'o',
      aliases: ['out-file'],
      description: 'Path to persist the generated types',
      default: DEFAULT_OUT_FILE,
    }),
    camelCase: Flags.boolean({
      aliases: ['camel-case'],
      description: 'Use the Kysely CamelCasePlugin',
    }),
    envFile: Flags.directory({
      aliases: ['env-file'],
      description: 'The path to an environment file to use',
    }),
    excludePattern: Flags.string({
      aliases: ['exclude-pattern'],
      description: 'Exclude tables matching the specified glob pattern',
    }),
    includePattern: Flags.string({
      aliases: ['include-pattern'],
      description: 'Only include tables matching the specified glob pattern',
    }),
    logLevel: Flags.string({
      aliases: ['log-level'],
      description: 'Set the terminal log level',
      options: ['debug', 'info', 'warn', 'error', 'silent'],
    }),
    print: Flags.boolean({
      description: 'Print the generated output to the terminal',
      char: 'p',
    }),
    runtimeEnums: Flags.boolean({
      aliases: ['runtime-enums'],
      description: 'Generate runtime enums instead of string unions',
    }),
    typeOnlyImports: Flags.boolean({
      aliases: ['type-only-imports'],
      description: 'Generate TypeScript 3.8+ `import type` syntax',
      default: true,
    }),
    verify: Flags.boolean({
      description: 'Verify that the generated types are up-to-date',
      default: false,
    }),
    noDomain: Flags.boolean({
      aliases: ['no-domain'],
      description: 'Skip generating types for PostgreSQL domains',
      default: false,
    }),
  }

  private async isDataDir(path: string) {
    const stat = lstatSync(path)
    if (!stat.isDirectory()) {
      return false
    }
    const files = await fs.readdir(path, {
      encoding: 'utf-8',
      withFileTypes: true,
    })
    return files.some((f) => pgDataFiles.includes(f.name))
  }

  private async runCodegen() {
    const {
      args,
      flags: { watch, ...flags },
    } = await this.parse(CodegenCommand)
    const isDataDir = await this.isDataDir(args.path)
    const { db, dialect } = await createKyselyPGlite(
      isDataDir ? args.path : undefined,
    )
    const codegen = new Codegen(dialect)
    const migrator = await createMigrator(db, args.path)

    if (isDataDir) {
      await codegen.generate({ ...flags, db })
    } else {
      const { results = [], error } = await migrator.migrateToLatest()
      const { Success = [], Error = [] } = group(results, (r) => r.status)

      if (Success.length) {
        await codegen.generate({ ...flags, db })
      }

      if (isError(error)) {
        const [migration] = Error
        const { message, hint } = getDatabaseErrorInfo(error)
        this.error(`${message} in ${migration.migrationName}`, {
          suggestions: hint ? [hint] : [],
        })
      }
    }

    return db
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CodegenCommand)

    consola.start('Introspecting database...')

    const db = await this.runCodegen()
    const tables = await db.introspection.getTables()
    consola.success(
      `Introspected ${tables.length} tables. Generated types in ${colorize('underline', flags.outFile)}`,
    )

    if (flags.watch) {
      // https://oclif.io/docs/commands/#avoiding-timeouts
      return new Promise(() => {
        consola.start(
          `Watching changes in ${colorize('underline', args.path)}...`,
        )
        const watcher = chokidar.watch(args.path, {
          ignored: /(^|[\/\\])\../, // ignore dotfiles
          ignoreInitial: true,
        })

        const watcherFn = async (event: string, path: string) => {
          await this.runCodegen()
          consola.info(
            `${event} File: ${colorize('underline', path)}. Types updated`,
          )
        }

        watcher
          .on('add', async (path) =>
            watcherFn(colorize('blueBright', '[added]'), path),
          )
          .on('change', async (path) =>
            watcherFn(colorize('cyan', '[changed]'), path),
          )
          .on('unlink', async (path) =>
            watcherFn(colorize('magenta', '[deleted]'), path),
          )
      })
    }
  }
}
