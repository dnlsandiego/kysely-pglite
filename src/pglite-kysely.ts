import { PGlite, type PGliteOptions } from '@electric-sql/pglite'

import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type Dialect,
} from 'kysely'

import { PGliteDriver } from './pglite-driver'

export class KyselyPGlite {
  client: PGlite
  /**
   * Create a new KyselyPGlite instance.
   * @param dataDir The directory to store the database files.
   *                - A string with `idb://` prefix to use IndexedDB filesystem in the browser
   *                - `memory://` to use in-memory filesystem
   *                - A path to a local filesystem directory
   * @param options `PGliteOptions` options
   */
  constructor(client: PGlite) {
    this.client = client
  }

  static async create(opts?: PGliteOptions): Promise<KyselyPGlite>
  static async create(
    dataDir?: string,
    opts?: PGliteOptions,
  ): Promise<KyselyPGlite>
  static async create(
    arg1?: string | PGliteOptions,
    arg2?: PGliteOptions,
  ): Promise<KyselyPGlite> {
    let opts: PGliteOptions = {}
    if (typeof arg1 === 'string') {
      opts.dataDir = arg1
      if (typeof arg2 === 'object') {
        opts = { ...opts, ...arg2 }
      }
    }
    if (typeof arg1 === 'object') {
      opts = arg1
    }
    const pglite = await PGlite.create(opts)
    return new KyselyPGlite(pglite)
  }

  dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),

    createDriver: () => new PGliteDriver(this.client),

    createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),

    createQueryCompiler: () => new PostgresQueryCompiler(),
  }
}
