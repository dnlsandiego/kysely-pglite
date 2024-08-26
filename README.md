# kysely-pglite

[Kysely](https://github.com/kysely-org/kysely) dialect for [PGlite](https://github.com/electric-sql/pglite).

PGlite's [Live Queries](https://pglite.dev/docs/live-queries) extension can also be integrated with Kysely through a [AsyncIterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) based class (`KyselyLive`) to take advantage of Kysely's type-safe features. See examples:

## Usage

The examples below use the static async method `await KyselyPGlite.create()` to align with the preferred way to create a PGlite instance as stated in the [PGlite docs](https://pglite.dev/docs/api#main-constructor). But an instance can still be created using the `new KyselyPGlite()` constructor.

```typescript
import { Kysely } from 'kysely'
import { KyselyPGlite } from 'kysely-pglite'

// This will use in-memory Postgres
const { dialect } = await KyselyPGlite.create()

// For persisting the data to disk, pass in a path to a directory
// const { dialect } = await KyselyPGlite.create('./path/to/pgdata')

const db = new Kysely<DB>({ dialect })
```

`PGlite` options can be passed in as the second parameter. See [PGlite options](https://pglite.dev/docs/api#options) for more info.

```typescript
const { dialect } = await KyselyPGlite.create('./path/to/pgdata', {
  debug: 3,
  relaxedDurability: true,
})
```

### `KyselyLive` Usage

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

### Migrations

Kysely migrations work well with `PGlite`. See example setup below:

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

> [!WARNING]
> Applying migrations with `await` in the same file that runs your server could potentially impact its start-up time if there are a lot of migrations to run.

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

> [!WARNING]
> This dialect has not been tested on Deno yet.

## Todos

- Investigate possible ways to integrate [PGlite](https://github.com/electric-sql/pglite)'s [live query API](https://github.com/electric-sql/pglite/pull/104) with Kysely

- Verify browser usage. `kysely` and `pglite` both work in browser

- Verify works on Deno
