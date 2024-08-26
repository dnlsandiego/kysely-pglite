#!/usr/bin/env node

import type { PGliteOptions } from '@electric-sql/pglite'
import { cli } from 'cleye'
import { createJiti } from 'jiti'
import { Kysely } from 'kysely'
import { DEFAULT_OUT_FILE } from 'kysely-codegen'
import { Codegen } from './codegen.js'
import { KyselyPGlite } from './kysely-pglite.js'
import { isDirectory } from './utils/is-directory.js'

const jiti = createJiti(import.meta.filename, {})

const argv = cli({
  name: 'kysely-pglite',

  parameters: ['<database>'],

  flags: {
    camelCase: {
      type: Boolean,
      description: 'Use the Kysely CamelCasePlugin',
    },
    dialect: {
      type: String,
      description: 'Set the SQL dialect',
      options: ['postgres', 'mysql', 'sqlite', 'mssql', 'libsql', 'bun-sqlite'],
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
    },
    print: {
      type: Boolean,
      description: 'Print the generated output to the terminal',
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

const [database] = argv._

async function getDatabase(database: string) {
  const isDir = await isDirectory(database)
  const opts: PGliteOptions = { dataDir: isDir ? database : undefined }
  const { dialect } = await KyselyPGlite.create(opts)

  if (isDir) {
    return { db: new Kysely<any>({ dialect }), dialect }
  }
  // @ts-expect-error
  const { db } = await jiti.import(database, {})

  return { db: db as Kysely<any>, dialect }
}

const { db, dialect } = await getDatabase(database)

const codegen = new Codegen(dialect)

await codegen.generate({
  db,
  outFile: argv.flags.outFile,
})
