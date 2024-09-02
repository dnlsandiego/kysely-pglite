import { globby } from 'globby'
import { createJiti } from 'jiti'
import { Kysely, Migrator, type Migration } from 'kysely'
import { all, objectify } from 'radash'

const jiti = createJiti(import.meta.filename, {
  // prevent files from getting cached so the `watch` feature works.
  moduleCache: false,
})

export function createMigrator(db: Kysely<any>, migrationsPath: string) {
  return new Migrator({
    db,
    provider: {
      async getMigrations() {
        const files = await globby(migrationsPath, {
          expandDirectories: {
            files: ['*.ts', '*.js'],
          },

          ignore: ['**/types.ts'],
          objectMode: true,
          absolute: true,
        })

        const migrations = objectify(
          files,
          (f) => f.name,
          (f) => jiti.import(f.path),
        )

        // TODO: improve validating imported functions
        const modules = (await all(migrations)) as Record<string, Migration>
        return modules
      },
    },
  })
}
