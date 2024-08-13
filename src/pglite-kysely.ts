import { PGlite, type PGliteOptions } from '@electric-sql/pglite'
import {
	Kysely,
	PostgresAdapter,
	PostgresIntrospector,
	PostgresQueryCompiler,
	type Dialect,
} from 'kysely'

import { PGliteDriver } from './pglite-driver'

export class PGliteKysely {
	#client: PGlite
	/**
	 * Create a new PGliteKysely instance.
	 * @param dataDir The directory to store the database files.
	 *                - A string with `idb://` prefix to use IndexedDB filesystem in the browser
	 *                - `memory://` to use in-memory filesystem
	 *                - A path to a local filesystem directory
	 * @param options `PGliteOptions` options
	 */
	constructor(dataDir?: string, opts?: PGliteOptions) {
		this.#client = new PGlite(dataDir, opts)
	}

	dialect: Dialect = {
		createAdapter: () => new PostgresAdapter(),

		createDriver: () => new PGliteDriver(this.#client),

		createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),

		createQueryCompiler: () => new PostgresQueryCompiler(),
	}
}
