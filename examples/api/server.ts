import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { Insertable } from 'kysely'
import { db, migrator } from './db'
import type { User } from './db/types'

await migrator.migrateToLatest()

const app = new Hono()

app.get('/user', async (c) => {
	const users = await db.selectFrom('user').selectAll().execute()
	return c.json({ users })
})

app.get('/user/:id', async (c) => {
	const id = c.req.param('id')
	const user = await db
		.selectFrom('user')
		.where('id', '=', parseInt(id))
		.selectAll()
		.executeTakeFirst()

	return c.json({ user })
})

app.post('/user', async (c) => {
	const values = (await c.req.json()) as Insertable<User>
	const user = await db
		.insertInto('user')
		.values(values)
		.returningAll()
		.executeTakeFirst()

	return c.json({ user })
})

app.put('/user', async (c) => {
	const values = (await c.req.json()) as Insertable<User>
	const user = await db
		.updateTable('user')
		.set({ ...values, updatedAt: new Date().toISOString() })
		.returningAll()
		.executeTakeFirst()

	return c.json({ user })
})

serve(app, (info) => {
	console.log(`Listening on http://${info.address}:${info.port}`)
})
