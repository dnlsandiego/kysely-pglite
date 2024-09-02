import { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('groceries')
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('name', 'text', (cb) => cb.notNull())
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('groceries').execute()
}
