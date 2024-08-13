# kysely-pglite

[Kysely](https://github.com/kysely-org/kysely) dialect for [pglite](https://github.com/electric-sql/pglite).

## Usage

```typescript
import { PGliteKysely } from 'kysely-pglite'

// This will use in-memory Postgres
const { dialect } = new PGliteKysely()

// Pass in a path to persist the data to disk
// const { dialect } = new PGlite("./path/to/pgdata");

const db = new Kysely<DB>({ dialect })
```

## Installation

#### PNPM

```bash
pnpm add kysely-pglite kysely
```

#### NPM

```bash
npm install kysely-pglite kysely
```

#### Yarn

```bash
yarn add kysely-pglite kysely
```

> [!WARNING]
> This dialect has not been tested on Deno yet.

## Todos

- Investigate possible ways to integrate [pglite](https://github.com/electric-sql/pglite)'s [live query API](https://github.com/electric-sql/pglite/pull/104) with Kysely

- Flesh out tests for disk storage
