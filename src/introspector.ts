import { Kysely } from 'kysely'
import {
  DatabaseMetadata,
  EnumCollection,
  Introspector,
  TableMatcher,
  type ConnectOptions,
  type IntrospectOptions,
} from 'kysely-codegen'
import { KyselyPGlite } from './kysely-pglite.js'

export class KyselyPGliteIntrospector extends Introspector<any> {
  async connect(options: ConnectOptions): Promise<Kysely<any>> {
    const { dialect } = new KyselyPGlite()

    return new Kysely({ dialect })
  }

  protected async getTables(options: IntrospectOptions<any>) {
    let tables = await options.db.introspection.getTables()

    if (options.includePattern) {
      const tableMatcher = new TableMatcher(options.includePattern)
      tables = tables.filter(({ name, schema }) =>
        tableMatcher.match(schema, name),
      )
    }

    if (options.excludePattern) {
      const tableMatcher = new TableMatcher(options.excludePattern)
      tables = tables.filter(
        ({ name, schema }) => !tableMatcher.match(schema, name),
      )
    }

    return tables
  }

  async introspect(options: IntrospectOptions<any>): Promise<DatabaseMetadata> {
    const tables = await this.getTables(options)
    const enums = new EnumCollection()
    return new DatabaseMetadata(tables, enums)
  }
}
