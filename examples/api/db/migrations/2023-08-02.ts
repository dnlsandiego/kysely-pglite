import { Kysely, Migration, sql } from 'kysely'

export const Migration20230802: Migration = {
	async up(db: Kysely<any>) {
		await db.schema
			.alterTable('user')
			.addColumn('updatedAt', 'timestamp', (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.addColumn('createdAt', 'timestamp', (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.execute()
	},
	async down(db: Kysely<any>) {
		await db.schema
			.alterTable('user')
			.dropColumn('updatedAt')
			.dropColumn('createdAt')
			.execute()
	},
}
