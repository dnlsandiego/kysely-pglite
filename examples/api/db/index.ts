import { PGliteKysely } from '@dnlsandiego/kysely-pglite'
import { Kysely, Migrator } from 'kysely'
import { DB } from './types'

// This will use in-memory Postgres
const { dialect } = new PGliteKysely('', {
	debug: 3,
	relaxedDurability: true,
})

// Pass in a path to persist the data to disk
// const { dialect } = new PGlite("./path/to/pgdata");

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
