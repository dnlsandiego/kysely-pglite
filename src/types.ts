type ChangeInsert<T> = {
  __changed_columns__: string[]
  __op__: 'INSERT'
  __after__: number
} & T

type ChangeDelete<T> = {
  __changed_columns__: string[]
  __op__: 'DELETE'
  __after__: undefined
} & T

type ChangeUpdate<T> = {
  __changed_columns__: string[]
  __op__: 'UPDATE'
  __after__: number
} & T

export type Change<T> = ChangeInsert<T> | ChangeDelete<T> | ChangeUpdate<T>
