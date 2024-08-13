import type { Generated } from 'kysely'

export interface User {
	id: Generated<number>
	name: string
	updatedAt: string
	createdAt: string
}

export interface DB {
	user: User
}
