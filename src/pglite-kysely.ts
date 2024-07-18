import { PGlite, type PGliteOptions } from "@electric-sql/pglite";
import {
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type Dialect,
} from "kysely";

import { PGliteDriver } from "./pglite-driver";

export class PGliteKysely {
  #client: PGlite;

  constructor(dataDir?: string, opts?: PGliteOptions) {
    this.#client = new PGlite(dataDir, opts);
  }

  dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),

    createDriver: () => new PGliteDriver(this.#client),

    createIntrospector: (db: Kysely<any>) => new PostgresIntrospector(db),

    createQueryCompiler: () => new PostgresQueryCompiler(),
  };
}
