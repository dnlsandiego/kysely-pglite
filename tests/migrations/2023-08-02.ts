import { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable('groceries')
    .addColumn('quantity', 'integer')
    .execute()
}
export async function down(db: Kysely<any>) {
  await db.schema.alterTable('groceries').dropColumn('quantity').execute()
}
