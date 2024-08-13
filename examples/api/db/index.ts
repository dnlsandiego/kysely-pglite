import { Kysely, Migrator } from 'kysely'
import { KyselyPGlite } from 'kysely-pglite'
import { DB } from './types'

const { dialect } = await KyselyPGlite.create()

export const db = new Kysely<DB>({ dialect })

export const migrator = new Migrator({
	db,
	provider: {
		async getMigrations() {
			const { migrations } = await import('./migrations/')
			return migrations
		},
	},
})
