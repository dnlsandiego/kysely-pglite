import { Migration } from 'kysely'
import { join } from 'path/posix'

export type MigrationMethod = keyof Migration

export const DEFAULT_OUT_FILE = join(
  process.cwd(),
  'node_modules',
  'kysely-pglite',
  'dist',
  'db.d.ts',
)

export const pgDataFiles = [
  'PG_VERSION',
  'base',
  'global',
  'pg_commit_ts',
  'pg_dynshmem',
  'pg_hba.conf',
  'pg_ident.conf',
  'pg_logical',
  'pg_multixact',
  'pg_notify',
  'pg_replslot',
  'pg_serial',
  'pg_snapshots',
  'pg_stat',
  'pg_stat_tmp',
  'pg_subtrans',
  'pg_tblspc',
  'pg_twophase',
  'pg_wal',
  'pg_xact',
  'postgresql.auto.conf',
  'postgresql.conf',
  'postmaster.pid',
]

export const migrationMethods: MigrationMethod[] = ['up', 'down']
