import type { Generated } from 'kysely'

export interface User {
  id: Generated<number>
  name: string
  updatedAt: Generated<string>
  createdAt: Generated<string>
}

export interface DB {
  user: User
}
