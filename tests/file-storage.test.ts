import { describe, it } from 'vitest'
import { GroceriesDatabase } from './groceries-db'

describe.skip('file storage', { todo: true }, () => {
  const dataDir = './pgdata'
  const groceries = new GroceriesDatabase({ dataDir })

  it('should persist creating tables', async () => {
    const db = await groceries.createTables()
  })
})
