import { Generated, Kysely } from 'kysely'
import { describe, it } from 'vitest'
import { PGliteKysely } from '../src'

type DB = {
	groceries: {
		id: Generated<number>
		name: string
	}
}

const createDb = async () => {
	// This will create a `pgdata` folder in the package's root dir during tests.
	const { dialect } = await PGliteKysely.create({ dataDir: './pgdata' })
	return new Kysely<DB>({ dialect })
}

// TODO: flesh out tests, mostly needing a cleanup step to delete the `pgdata` dir after each test
describe('file storage', { todo: true }, () => {
	it('should persist creating tables', async () => {
		const db = await createDb()
		await db.schema
			.createTable('groceries')
			.addColumn('id', 'serial', (cb) => cb.primaryKey())
			.addColumn('name', 'text', (cb) => cb.notNull())
			.execute()
	})
})
