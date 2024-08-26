#!/usr/bin/env node

import { isError } from '@sindresorhus/is'
import { cli } from 'cleye'
import { join } from 'path/posix'
import { group } from 'radash'
import { Codegen } from './codegen.js'
import { createKyselyPGlite } from './utils/create-kysely.js'
import { createMigrator } from './utils/migrator.js'

export const DEFAULT_OUT_FILE = join(
  process.cwd(),
  'node_modules',
  'kysely-pglite',
  'dist',
  'db.d.ts',
)

const argv = cli({
  name: 'kysely-pglite',

  parameters: ['<path>'],
  flags: {
    dataDir: {
      type: Boolean,
      description:
        'Path to the directory that stores the persisted Postgres database',
      alias: 'd',
    },
    camelCase: {
      type: Boolean,
      description: 'Use the Kysely CamelCasePlugin',
    },
    envFile: {
      type: String,
      description: 'Specify the path to an environment file to use',
    },
    excludePattern: {
      type: String,
      description: 'Exclude tables matching the specified glob pattern',
    },
    includePattern: {
      type: String,
      description: 'Only include tables matching the specified glob pattern',
    },
    logLevel: {
      type: String,
      description: 'Set the terminal log level',
      options: ['debug', 'info', 'warn', 'error', 'silent'],
      default: 'warn',
    },
    outFile: {
      type: String,
      description: 'Set the file build path',
      default: DEFAULT_OUT_FILE,
      alias: 'o',
    },
    print: {
      type: Boolean,
      description: 'Print the generated output to the terminal',
      alias: 'p',
    },
    runtimeEnums: {
      type: Boolean,
      description: 'Generate runtime enums instead of string unions',
    },
    typeOnlyImports: {
      type: Boolean,
      description: 'Generate TypeScript 3.8+ `import type` syntax',
      default: true,
    },
    verify: {
      type: Boolean,
      description: 'Verify that the generated types are up-to-date',
      default: false,
    },
  },
})

const { path } = argv._
const { dataDir, ...opts } = argv.flags

const { db, dialect } = await createKyselyPGlite(dataDir ? path : undefined)

const migrator = await createMigrator(db, path)

const resultSet = await migrator.migrateToLatest()

const { results = [], error } = resultSet

if (results.length) {
  const {
    Success = [],
    Error = [],
    NotExecuted = [],
  } = group(results, (r) => r.status)

  if (isError(error)) {
    const [failedMigration] = Error
    const { stack, ...err } = error
    console.error(
      `${failedMigration?.migrationName} failed. ${error.message}`,
      err,
    )
  }

  for (const result of NotExecuted) {
    console.warn(`${result.migrationName} was not executed`)
  }

  if (Success.length) {
    const codegen = new Codegen(dialect)
    await codegen.generate({ ...opts, db })
  }
}

if (error) {
  console.error(error)
}
