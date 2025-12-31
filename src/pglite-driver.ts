import { PGlite } from '@electric-sql/pglite'
import {
  CompiledQuery,
  type DatabaseConnection,
  type QueryResult,
  type TransactionSettings,
} from 'kysely'

export class PGliteDriver {
  #client: PGlite

  constructor(client: PGlite) {
    this.#client = client
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new PGliteConnection(this.#client)
  }

  async beginTransaction(
    connection: DatabaseConnection,
    _settings: TransactionSettings,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('BEGIN'))
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('COMMIT'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('ROLLBACK'))
  }

  async destroy(): Promise<void> {
    await this.#client.close()
  }

  async init(): Promise<void> {}
  async releaseConnection(_connection: DatabaseConnection): Promise<void> {}
}

class PGliteConnection implements DatabaseConnection {
  #client: PGlite

  constructor(client: PGlite) {
    this.#client = client
  }

  async executeQuery<R>(
    compiledQuery: CompiledQuery<any>,
  ): Promise<QueryResult<R>> {
    const res = await this.#client.query<R>(compiledQuery.sql, [
      ...compiledQuery.parameters,
    ])

    return {
      numAffectedRows: BigInt(res.affectedRows ?? 0),
      rows: res.rows,
    }
  }

  async *streamQuery(): AsyncGenerator<never, void, unknown> {
    throw new Error('PGlite does not support streaming.')
  }
}
