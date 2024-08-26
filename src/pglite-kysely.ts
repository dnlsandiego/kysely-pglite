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

import { PGliteDriver } from './pglite-driver'

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
  constructor(client?: PGlite)
  constructor(dataDir?: string, opts?: O)
  constructor(dataDirOrClient?: string | PGlite, opts?: O) {
    if (typeof dataDirOrClient === 'string') {
      // @ts-expect-error
      this.client = new PGlite(dataDirOrClient, opts)
    } else if (dataDirOrClient) {
      // @ts-expect-error
      this.client = dataDirOrClient
    } else {
      // @ts-expect-error
      this.client = new PGlite()
    }
  }
  //static create<O extends PGliteOptions>(options?: O): Promise<PGlite & PGliteInterfaceExtensions<O['extensions']>>;
  static async create<O extends PGliteOptions>(
    opts?: O,
  ): Promise<KyselyPGlite<O>>
  static async create<O extends PGliteOptions>(
    dataDir?: string,
    opts?: O,
  ): Promise<KyselyPGlite<O>>
  static async create<O extends PGliteOptions>(
    arg1?: string | O,
    arg2?: O,
  ): Promise<KyselyPGlite<O>> {
    // @ts-expect-error
    let opts: O = {}
    if (typeof arg1 === 'string') {
      opts.dataDir = arg1
      if (typeof arg2 === 'object') {
        opts = { ...opts, ...arg2 }
      }
    }
    if (typeof arg1 === 'object') {
      opts = arg1
    }
    const pglite = await PGlite.create<O>(opts)
    return new KyselyPGlite<O>(pglite)
  }

  dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),

    createDriver: () => new PGliteDriver(this.client),

    createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),

    createQueryCompiler: () => new PostgresQueryCompiler(),
  }
}
