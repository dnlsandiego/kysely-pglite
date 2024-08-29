import type { Dialect } from 'kysely'
import {
  Generator,
  PostgresAdapter,
  type GenerateOptions,
} from 'kysely-codegen'
import { KyselyPGliteIntrospector } from './introspector.js'

export class Codegen {
  constructor(public dialect: Dialect) {}

  async generate(opts: Omit<GenerateOptions, 'dialect'>) {
    const generator = new Generator()

    return await generator.generate({
      ...opts,
      dialect: {
        adapter: new PostgresAdapter(),
        introspector: new KyselyPGliteIntrospector(),
        createKyselyDialect: async () => {
          return this.dialect
        },
      },
    })
  }
}
