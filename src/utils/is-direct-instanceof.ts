import type { Class } from 'type-fest'

export function assertDirectInstanceOf<T>(
  instance: unknown,
  class_: Class<T>,
): instance is T {
  if (instance === undefined || instance === null) {
    return false
  }

  return Object.getPrototypeOf(instance) === class_.prototype
}
