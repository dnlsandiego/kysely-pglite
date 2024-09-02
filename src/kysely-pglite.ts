import { ensureDataDirExist } from '#utils/create-kysely.js'
import {
  PGlite,
  PGliteInterfaceExtensions,
  type PGliteOptions,
} from '@electric-sql/pglite'
import { isObject, isString } from '@sindresorhus/is'
import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type Dialect,
} from 'kysely'
import { PGliteDriver } from './pglite-driver.js'

export class KyselyPGlite<O extends PGliteOptions = PGliteOptions> {
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
  constructor(dataDirOrOptionsOrPGlite?: string | PGlite | O, opts?: O) {
    ensureDataDirExist(dataDirOrOptionsOrPGlite)

    let options: PGliteOptions = { ...opts }

    if (
      isObject(dataDirOrOptionsOrPGlite) &&
      dataDirOrOptionsOrPGlite instanceof PGlite
    ) {
      // @ts-expect-error
      this.client = dataDirOrOptionsOrPGlite
      return
    }

    if (isString(dataDirOrOptionsOrPGlite)) {
      options = {
        dataDir: dataDirOrOptionsOrPGlite,
        ...options,
      }
    } else {
      options = dataDirOrOptionsOrPGlite ?? {}
    }

    // @ts-expect-error
    this.client = new PGlite(options)
  }

  static async create<O extends PGliteOptions>(
    options?: O,
  ): Promise<KyselyPGlite<O>>

  static async create<O extends PGliteOptions>(
    dataDir?: string,
    options?: O,
  ): Promise<KyselyPGlite<O>>

  static async create<O extends PGliteOptions>(
    dataDirOrPGliteOptions?: string | O,
    options?: O,
  ): Promise<KyselyPGlite<O>> {
    const resolvedOpts: PGliteOptions = isString(dataDirOrPGliteOptions)
      ? {
          dataDir: dataDirOrPGliteOptions,
          ...(options ?? {}),
        }
      : (dataDirOrPGliteOptions ?? {})

    const pg = await PGlite.create(resolvedOpts)
    return new KyselyPGlite<O>(pg) as any
  }

  dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),

    createDriver: () => new PGliteDriver(this.client),

    createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),

    createQueryCompiler: () => new PostgresQueryCompiler(),
  }
}
