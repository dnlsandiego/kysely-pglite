import type { PGliteWithLive } from '@electric-sql/pglite/live'
import { Repeater } from '@repeaterjs/repeater'
import { assertString } from '@sindresorhus/is'
import type { ReferenceExpression } from 'kysely'
import { type SelectQueryBuilder } from 'kysely'
/**
 * Wrapper for PGlite's Live Queries extension
 * @example
 * const pglive = new KyselyLive(pglite)
 * const query = db
 *   .selectFrom('sales')
 *   .select(['id', 'price'])
 *   .orderBy((eb) => eb.fn('rand'))
 * const liveQuery = pglive.query(query)
 * 
 * for await (const data of liveQuery.subscribe) {
 *   const [sale] = data
 *   console.log(sale.id, sale.price)
}
 */
export class KyselyLive {
  private live: PGliteWithLive['live']

  constructor(pglite: PGliteWithLive) {
    this.live = pglite.live
  }

  query<DB, TB extends keyof DB, O>(builder: SelectQueryBuilder<DB, TB, O>) {
    const { sql, parameters } = builder.compile()

    return this.createLiveRepeater<O>((push) => {
      return this.live.query<O>(sql, [...parameters], (data) => push(data.rows))
    })
  }

  changes<DB, TB extends keyof DB, O>(
    builder: SelectQueryBuilder<DB, TB, O>,
    ref: ReferenceExpression<DB, TB>,
  ) {
    const { sql, parameters } = builder.compile()

    assertString(ref, '`changes` received invalid key')

    return this.createLiveRepeater<O>((push) => {
      return this.live.changes<O>(sql, [...parameters], ref, (data) =>
        push(data),
      )
    })
  }

  incrementalQuery<DB, TB extends keyof DB, O>(
    builder: SelectQueryBuilder<DB, TB, O>,
    ref: ReferenceExpression<DB, TB>,
  ) {
    const { sql, parameters } = builder.compile()

    assertString(ref, '`incrementalQuery` received invalid key')

    return this.createLiveRepeater<O>((push) => {
      return this.live.incrementalQuery<O>(sql, [...parameters], ref, (data) =>
        push(data.rows),
      )
    })
  }

  private createLiveRepeater<O>(
    liveMethod: (callback: (data: O[]) => void) => Promise<{
      refresh: () => Promise<void>
      unsubscribe: () => Promise<void>
    }>,
  ) {
    let refresh: () => Promise<void>
    let unsubscribe: () => Promise<void>

    const subscribe = new Repeater<O[]>(async (push, stop) => {
      const res = await liveMethod((data) => push(data))

      refresh = res.refresh
      unsubscribe = res.unsubscribe

      await stop

      res.unsubscribe()
    })

    return {
      subscribe,
      refresh: () => refresh?.(),
      unsubscribe: () => unsubscribe?.(),
    }
  }
}
