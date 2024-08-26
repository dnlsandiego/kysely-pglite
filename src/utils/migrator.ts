import { globby } from 'globby'
import { createJiti } from 'jiti'
import { Kysely, Migrator } from 'kysely'
import { all, objectify } from 'radash'

const jiti = createJiti(import.meta.filename)

export async function createMigrator(db: Kysely<any>, migrationsPath: string) {
  const files = await globby(migrationsPath, {
    expandDirectories: {
      files: ['*.ts', '*.js'],
    },
    ignore: ['**/types.ts'],
    gitignore: true,
    objectMode: true,
    absolute: true,
  })

  if (!files.length) {
    console.warn(`No migration files found in ${migrationsPath}`)
  }

  const migrations = objectify(
    files,
    (f) => f.name,
    (f) =>
      jiti
        .import(f.path)
        .then((res) => {
          // @ts-expect-error
          return res.default
        })
        .catch(console.error),
  )

  const modules = await all(migrations)

  return new Migrator({
    db,
    provider: {
      async getMigrations() {
        return modules
      },
    },
  })
}
