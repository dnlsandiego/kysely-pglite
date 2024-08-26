import type { PGliteOptions } from '@electric-sql/pglite'
import { Kysely, type Generated } from 'kysely'
import { KyselyPGlite } from '../src/kysely-pglite.js'

export type DB = {
  groceries: {
    id: Generated<number>
    name: string
  }
}

export class GroceriesDatabase {
  db: Kysely<DB>

  constructor(opts?: PGliteOptions) {
    const { dialect } = new KyselyPGlite(opts)

    this.db = new Kysely<DB>({ dialect })
  }

  async createTables() {
    await this.db.schema
      .createTable('groceries')
      .addColumn('id', 'serial', (cb) => cb.primaryKey())
      .addColumn('name', 'text', (cb) => cb.notNull())
      .execute()
  }
}
