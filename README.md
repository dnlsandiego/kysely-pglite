# kysely-pglite

[Kysely](https://github.com/kysely-org/kysely) dialect for [PGlite](https://github.com/electric-sql/pglite) with a [CLI](#generating-types) to generate TypeScript types.

Kysely specific wrapper over PGlite's [Live Queries](https://pglite.dev/docs/live-queries) extension to take advantage of Kysely's type-safe features.

## Installation

[`@electric-sql/pglite`](https://github.com/electric-sql/pglite) needs to be installed as well.

#### PNPM

```bash
pnpm add @electric-sql/pglite kysely-pglite
```

#### NPM

```bash
npm install @electric-sql/pglite kysely-pglite
```

#### Yarn

```bash
yarn add @electric-sql/pglite kysely-pglite
```

PGlite's [Live Queries](https://pglite.dev/docs/live-queries) extension can also be integrated with Kysely through a [AsyncIterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) based class (`KyselyLive`) to take advantage of Kysely's type-safe features. See examples:

## Usage

The examples below mostly use the static async method `await KyselyPGlite.create()` to align with the [PGlite docs](https://pglite.dev/docs/api#main-constructor). But an instance can still be created using the `new KyselyPGlite()` constructor.

```typescript
import { Kysely } from 'kysely'
import { KyselyPGlite } from 'kysely-pglite'

// Use in-memory Postgres
const { dialect } = await KyselyPGlite.create()

// For persisting the data to disk, pass in a path to a directory
// const { dialect } = await KyselyPGlite.create('./path/to/pgdata')

const db = new Kysely<DB>({ dialect })
```

`PGlite` options can be passed in, it has the same function signature as PGlite. See [PGlite options](https://pglite.dev/docs/api#options) for more info.

```typescript
const { dialect } = await KyselyPGlite.create('./path/to/pgdata', {
  debug: 3,
  relaxedDurability: true,
})
```

## Generating Types

`kysely-pglite` provides a CLI to generate TypeScript types. It's a wrapper around [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) to get around its requirement of a connection to a running database. So the CLI accepts most of `kysely-codegen`'s options just minus the connection specific settings.

Without a running database to connect to, the codegen needs a `path` to a file/directory of Kysely migrations or to a persisted PGlite database.

Using Kysely migrations, the `kysely-pglite` CLI expects a path to either a file or directory of migration files that exports 2 async functions called `up` and `down` (same pattern as in the [Kysely docs](https://kysely.dev/docs/migrations#migration-files)). For example:

```typescript
// src/db/migrations/2024-05-04-create-user.ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('user')
    .ifNotExists()
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('name', 'text', (cb) => cb.notNull())
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('user').execute()
}
```

```bash
npx kysely-pglite ./src/db/migrations --out-file ./src/db/types.ts
```

> [!TIP]
> The CLI is also aliased as `kpg` for easier typing.

A persisted PGlite's database can also be used to generate the types. `kysely-pglite` will automatically detect that the directory is a PGlite database and not migration files.

```bash
npx kysely-pglite ./path/to/pgdata
```

There's also a `--watch` option to make `kysely-pglite` watch the given `path` and automatically re-generate the types whenever a change is detected.

```bash
npx kysely-pglite --watch ./src/db/migrations --out-file ./src/db/types.ts
```

You can also import the `Codegen` class directly to have more flexibilty:

```typescript
import { Codegen } from 'kysely-pglite'

const { dialect } = new KyselyPGlite()

const codegen = new Codegen(dialect)

// See `kysely-pglite help` for more options
const types = await codegen.generate({
  // Your Kysely DB
  db,
  outFile: './path/to/output.ts',
})

console.log(types) // stringified types
```

## `KyselyLive` Usage

`KyselyLive` is a [AsyncIterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) class for using PGlite's live queries extension with Kysely's type-safe features when defining queries watch. To quickly compare:

```typescript
const ret = pg.live.query(
  'SELECT id, price FROM sales ORDER BY rand;',
  [],
  (res) => {
    // res is the same as a standard query result object
  },
)

const pglive = new KyselyLive(pglite)
const query = db
  .selectFrom('sales')
  .select(['id', 'price'])
  .orderBy((eb) => eb.fn('rand'))

for await (const data of pglive.query(query).subscribe) {
  const [sale] = data
  console.log(sale.id, sale.price)
}
```

A little more fleshed out example:

```typescript
import { live } from '@electric-sql/pglite/live'
import { KyselyPGlite, KyselyLive } from 'kysely-pglite'

interface User {
  id: Generated<number>
  name: string
}

interface DB {
  user: User
}

// Include the `live` extension when creating a KyselyPGlite instance. `client` here is the PGlite instance that the Dialect is using.
const { dialect, client } = await KyselyPGlite.create({ extensions: { live } })

const db = new Kysely<DB>({ dialect })

// Now create a `KyselyLive` instance.
const pglive = new KyselyLive(client)

// `KyselyLive`'s methods require a `SelectQueryBuilder` from your `db` to infer the type of the data your query subscription will emit.
const usersQuery = db.selectFrom('user').selectAll()
const liveQuery = pglive.query(usersQuery)

// subscribe to `user` table changes. `data` will be typed as `User[]`
for await (const data of liveQuery.subscribe) {
  const [user] = data
  console.log(user.id, user.name)
}

// To `unsubscribe` from the query:
liveQuery.unsubscribe()

// To manually refresh the query:
liveQuery.refresh()
```

## Migrations

Kysely migrations work well with `PGlite`. This example setup is mostly relevant when using in-memory storage as you'll probably need to create tables during server startup.

```typescript
// file: migrations/2025-08-01-create-user-table.ts
import { Kysely, Migration } from 'kysely'

export const Migration20230801: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .createTable('user')
      .ifNotExists()
      .addColumn('id', 'serial', (cb) => cb.primaryKey())
      .addColumn('name', 'text', (cb) => cb.notNull())
      .execute()
  },
  async down(db: Kysely<any>) {
    await db.schema.dropTable('user').execute()
  },
}
```

```typescript
// file: migrations/2025-08-02-update-user-table.ts
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
```

```typescript
// file: migrations/index.ts
import { Migration } from 'kysely'
import { Migration20250801 } from './2025-08-01-create-user-table.js'
import { Migration20250802 } from './2025-08-02-update-user-table.js'

export const migrations: Record<string, Migration> = {
  '2025-08-02': Migration20250802,
  '2025-08-01': Migration20250801,
}
```

```typescript
// file: db.ts
import { Kysely, Migrator } from 'kysely'
import { KyselyPGlite } from 'kysely-pglite'

const { dialect } = await KyselyPGlite.create()
export const db = new Kysely({ dialect })

export const migrator = new Migrator({
  db,
  provider: {
    async getMigrations() {
      const { migrations } = await import('./migrations/')
      return migrations
    },
  },
})
```

```typescript
// file: server.ts
import { db, migrator } from './db'
import express from 'express'

// Run migrations before starting up the server
await migrator.migrateToLatest()

const app = express()

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```
