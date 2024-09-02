# kysely-pglite

[Kysely](https://github.com/kysely-org/kysely) dialect for [PGlite](https://github.com/electric-sql/pglite) with a [CLI](#generating-types) to generate TypeScript types.

PGlite's [Live Queries](https://pglite.dev/docs/live-queries) extension can also be integrated with Kysely to take advantage of its type-safe features when writing queries to watch through a [AsyncIterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) based class [`KyselyLive`](#kyselylive-usage).

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

## Usage

The examples below mostly use the static async method `await KyselyPGlite.create()` to align with the [PGlite docs](https://pglite.dev/docs/api#main-constructor). But an instance can still be created using the `new KyselyPGlite()` constructor.

```typescript
import { Kysely } from 'kysely'
import { KyselyPGlite } from 'kysely-pglite'

// Use in-memory Postgres
const { dialect } = await KyselyPGlite.create()

// For persisting the data to disk, pass in a path to a directory
// const { dialect } = await KyselyPGlite.create('./path/to/pgdata')

const db = new Kysely<any>({ dialect })
```

`PGlite` options can be passed in, it has the same function signature as PGlite. See [PGlite options](https://pglite.dev/docs/api#options) for more info.

```typescript
const { dialect } = await KyselyPGlite.create('./path/to/pgdata', {
  debug: 3,
  relaxedDurability: true,
})
```

## Generating Types

`kysely-pglite` has a CLI to generate TypeScript types. It's a wrapper around [kysely-codegen](https://github.com/RobinBlomberg/kysely-codegen) to get around its requirement of a connection to a running database. So the CLI accepts most of `kysely-codegen`'s options just minus the connection specific settings.

The codegen needs a file/directory of Kysely migrations or a persisted PGlite database to generate the types.

Using Kysely migrations, the `kysely-pglite` CLI expects a path to either a file or directory of migration files that exports 2 async functions called `up` and `down` (same pattern as in the [Kysely docs](https://kysely.dev/docs/migrations#migration-files)). For example:

Let's say you have this project structure:

```
my-project/
├── .pgdata
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 1716743937856_create_user_table.ts
│   │   ├── db.ts
│   └── index.ts
├── package.json
```

```typescript
// src/db/migrations/1716743937856_create_user_table.ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('user')
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('name', 'text', (cb) => cb.notNull())
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('user').execute()
}
```

Run the codegen

```bash
npx kysely-pglite ./src/db/migrations --outFile ./src/db/schema.ts
```

Resulting structure

```
project-root/
├── .pgdata
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 1716743937856_create_user_table.ts
│   │   ├── db.ts
├── │   ├── schema.ts
│   └── index.ts
├── package.json
```

> [!TIP]
> The CLI is also aliased as `kpg` for easier typing. So the above could be `npx kpg ./src/db/migrations -o ./src/db/types.ts`

A persisted PGlite database can also be used to generate the types. `kysely-pglite` will automatically detect that the directory is a PGlite database and not migration files.

```bash
npx kysely-pglite ./path/to/pgdata
```

There's also a `--watch` option to make `kysely-pglite` watch the given `path` and re-generate the types whenever a change is detected.

```bash
npx kysely-pglite --watch ./src/db/migrations --outFile ./src/db/schema.ts
```

## `KyselyLive`

`KyselyLive` is a [AsyncIterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) based wrapper for using PGlite's live queries extension with Kysely's type-safe features. To quickly compare:

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
const { dialect, client } = new KyselyPGlite({ extensions: { live } })

const db = new Kysely<DB>({ dialect })

// Now create a `KyselyLive` instance.
const pglive = new KyselyLive(client)

// `KyselyLive`'s methods require a `SelectQueryBuilder` from your `db` to infer the type of the data your query subscription will emit.
const usersQuery = db.selectFrom('user').selectAll().orderBy('id asc')
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

#### In-Memory Usage

If you're using PGlite as an in-memory DB for a server for example, you'll most likely need to create its tables everytime the server starts up. Which means the migrations will also need to get applied on every server start up. `kysely-pglite` exports a `createMigrator` utility to create a [Kysely Migrator](https://kysely-org.github.io/kysely-apidoc/classes/Migrator.html) and provide it with your migrations when you run it. Example setup:

```
project-root/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 1716743937856_create_user_table.ts
│   │   ├── db.ts
├── │   ├── schema.ts
│   ├── index.ts
│   ├── server.ts
├── package.json
```

```typescript
// file: src/db/db.ts
import { Kysely, Migrator } from 'kysely'
import { KyselyPGlite, createMigrator } from 'kysely-pglite'

const { dialect } = await KyselyPGlite.create()
export const db = new Kysely({ dialect })

// The 2nd parameter should be a path to a directory of migration files. Relative to the root dir
export const migrator = createMigrator(db, './src/db/migrations')
```

```typescript
// file: src/server.ts
import { db, migrator } from './db/db.ts'
import express from 'express'

// Run migrations before starting up the server
await migrator.migrateToLatest()

const app = express()

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```
