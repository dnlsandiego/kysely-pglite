import type { Dialect } from 'kysely'
import {
  Generator,
  Logger,
  PostgresAdapter,
  type GenerateOptions,
} from 'kysely-codegen'
import { KyselyPGliteIntrospector } from './introspector.js'

export class Codegen {
  logger = new Logger()

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

      logger: this.logger,
    })
  }
}
