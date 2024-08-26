import { Kysely } from 'kysely'
import { KyselyPGlite } from '../kysely-pglite.js'

export async function createKyselyPGlite(dataDir?: string) {
  const { dialect } = new KyselyPGlite({ dataDir })

  const db = new Kysely<any>({ dialect })

  return { db, dialect }
}
