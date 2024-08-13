import { Kysely, Migration } from 'kysely'

export const Migration20230801: Migration = {
	async up(db: Kysely<any>) {
		await db.schema
			.createTable('groceries')
			.addColumn('id', 'serial', (cb) => cb.primaryKey())
			.addColumn('name', 'text', (cb) => cb.notNull())
			.execute()
	},
	async down(db: Kysely<any>) {
		await db.schema.dropTable('groceries').execute()
	},
}
