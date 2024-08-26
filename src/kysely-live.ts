import type { PGliteWithLive } from '@electric-sql/pglite/live'
import { Repeater } from '@repeaterjs/repeater'
import { assertString } from '@sindresorhus/is'
import type { ReferenceExpression } from 'kysely'
import { type SelectQueryBuilder } from 'kysely'
/**
 * Wrapper for PGlite's Live Queries extension
 */
export class KyselyLive {
  private live: PGliteWithLive['live']

  constructor(public pglite: PGliteWithLive) {
    this.live = pglite.live
  }

  query<DB, TB extends keyof DB, O>(builder: SelectQueryBuilder<DB, TB, O>) {
    const { sql, parameters } = builder.compile()

    return this.createLiveRepeater<O>(async (push) => {
      return await this.live.query<O>(sql, [...parameters], (data) =>
        push(data.rows),
      )
    })
  }

  changes<DB, TB extends keyof DB, O>(
    builder: SelectQueryBuilder<DB, TB, O>,
    ref: ReferenceExpression<DB, TB>,
  ) {
    const { sql, parameters } = builder.compile()

    assertString(ref, '`changes` received invalid key')

    type Change = ReturnType<typeof this.live.changes>

    return this.createLiveRepeater<O>(async (push) => {
      return await this.live.changes<O>(sql, [...parameters], ref, (data) =>
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

    return this.createLiveRepeater<O>(async (push) => {
      return await this.live.incrementalQuery<O>(
        sql,
        [...parameters],
        ref,
        (data) => push(data.rows),
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

      // Store the refresh and unsubscribe functions for external access
      refresh = res.refresh
      unsubscribe = res.unsubscribe

      // Handle the stop signal to clean up the live query subscription
      stop.then(() => {
        res.unsubscribe() // Ensure that we unsubscribe when the Repeater stops
      })

      return () => {
        res.unsubscribe() // Ensure cleanup if Repeater completes or errors
      }
    })

    return {
      subscribe,
      refresh: () => refresh?.(),
      unsubscribe: () => unsubscribe?.(),
    }
  }
}
