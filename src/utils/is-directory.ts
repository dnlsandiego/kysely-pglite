import { lstat } from 'fs/promises'

export async function isDirectory(path: string) {
  const stat = await lstat(path)

  return stat.isDirectory()
}
