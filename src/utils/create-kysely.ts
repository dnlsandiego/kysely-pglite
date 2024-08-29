import type { PGliteOptions } from '@electric-sql/pglite'
import { isObject, isString } from '@sindresorhus/is'
import fs from 'fs-extra'
import { Kysely } from 'kysely'
import { KyselyPGlite } from '../kysely-pglite.js'

export function ensureDataDirExist(dataDir?: string | PGliteOptions) {
  let path
  if (isString(dataDir)) {
    path = dataDir
  }
  if (isObject(dataDir) && dataDir.dataDir) {
    path = dataDir.dataDir
  }
  if (path) {
    const fo = fs.ensureDir(path)
  }
}

export async function createKyselyPGlite(dataDir?: string) {
  const { dialect } = new KyselyPGlite({ dataDir })

  const db = new Kysely<any>({ dialect })

  return { db, dialect }
}
