export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function assertString(
  value: unknown,
  message?: string,
): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(message)
  }
}
