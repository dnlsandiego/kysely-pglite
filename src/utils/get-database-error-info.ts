export interface NoticeOrError {
  message: string | undefined
  severity: string | undefined
  code: string | undefined
  detail: string | undefined
  hint: string | undefined
  position: string | undefined
  internalPosition: string | undefined
  internalQuery: string | undefined
  where: string | undefined
  schema: string | undefined
  table: string | undefined
  column: string | undefined
  dataType: string | undefined
  constraint: string | undefined
  file: string | undefined
  line: string | undefined
  routine: string | undefined
}

const databaseError: NoticeOrError = {
  message: undefined,
  severity: undefined,
  code: undefined,
  detail: undefined,
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: undefined,
  line: undefined,
  routine: undefined,
}

export function getDatabaseErrorInfo(error: Error): NoticeOrError {
  const err = { ...databaseError }
  const message = error.message
  for (const key of Object.keys(databaseError)) {
    if (key in databaseError && key in error) {
      // @ts-expect-error
      err[key] = error[key]
    }
  }

  return err
}
