import { Kysely, Migrator } from 'kysely'
import { describe, expect, it } from 'vitest'
import { createMigrator, KyselyPGlite } from '../src'

describe('kysely migrations', async () => {
  const { dialect } = await KyselyPGlite.create()
  const db = new Kysely({ dialect })

  const migrator = await createMigrator(db, './tests/migrations')

  const getTableNames = async () => {
    const tables = await db.introspection.getTables()
    return tables.map((table) => table.name)
  }

  const getColumnNames = async (tableName: string) => {
    const tables = await db.introspection.getTables()
    const table = tables.find((table) => table.name === tableName)
    return table?.columns.map((column) => column.name)
  }

  it('should migrate the database', async () => {
    expect(await getTableNames()).toEqual([])

    await migrator.migrateToLatest()
    expect(await getTableNames()).toEqual(['groceries'])
    expect(await getColumnNames('groceries')).toEqual([
      'id',
      'name',
      'quantity',
    ])

    await migrator.migrateDown()
    expect(await getTableNames()).toEqual(['groceries'])
    expect(await getColumnNames('groceries')).toEqual(['id', 'name'])

    await migrator.migrateDown()
    expect(await getTableNames()).toEqual([])

    await migrator.migrateUp()
    expect(await getTableNames()).toEqual(['groceries'])
    expect(await getColumnNames('groceries')).toEqual(['id', 'name'])

    await migrator.migrateDown()
    expect(await getTableNames()).toEqual([])
  })
})
