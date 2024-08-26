import {
  PGlite,
  PGliteInterfaceExtensions,
  type PGliteOptions,
} from '@electric-sql/pglite'

import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type Dialect,
} from 'kysely'

import { PGliteDriver } from './pglite-driver.js'

export class KyselyPGlite<O extends PGliteOptions> {
  client!: PGlite & PGliteInterfaceExtensions<O['extensions']>
  /**
   * Create a new KyselyPGlite instance.
   * @param dataDir The directory to store the database files.
   *                - A string with `idb://` prefix to use IndexedDB filesystem in the browser
   *                - `memory://` to use in-memory filesystem
   *                - A path to a local filesystem directory
   * @param options `PGliteOptions` options
   */

  constructor(dataDir?: string, opts?: O)
  constructor(options?: O)
  constructor(client?: PGlite)
  constructor(dataDirOrClient?: string | PGlite | O, opts?: O) {
    if (typeof dataDirOrClient === 'string') {
      // @ts-expect-error
      this.client = new PGlite(dataDirOrClient, opts)
    } else if (typeof dataDirOrClient === 'object') {
      if (dataDirOrClient instanceof PGlite) {
        // @ts-expect-error
        this.client = dataDirOrClient
      } else {
        // @ts-expect-error
        this.client = new PGlite(dataDirOrClient)
      }
    } else {
      // @ts-expect-error
      this.client = new PGlite()
    }
  }

  static async create<O extends PGliteOptions>(
    dataDir?: string,
    options?: PGliteOptions,
  ): Promise<KyselyPGlite<O>>
  static async create<O extends PGliteOptions>(
    options?: PGliteOptions,
  ): Promise<KyselyPGlite<O>>
  static async create(
    dataDirOrPGliteOptions: string | PGliteOptions = {},
    options: PGliteOptions = {},
  ) {
    let opts = options

    if (typeof dataDirOrPGliteOptions === 'string') {
      opts.dataDir = dataDirOrPGliteOptions
    } else {
      opts = { ...options, ...dataDirOrPGliteOptions }
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