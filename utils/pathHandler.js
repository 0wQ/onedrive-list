import { posix as pathPosix } from 'path'

const {
  base_dir = '/',
} = process.env

const basePath = pathPosix.resolve('/', base_dir)

export const wrapPath = (path, type = '/children') => {
  const isFolder = path.endsWith('/') || path === ''
  let wrapedPath = pathPosix.join(basePath, pathPosix.resolve('/', path))
  wrapedPath = wrapedPath.replace(/\/$/, '')
  if (wrapedPath === '') return `/root${type}`
  return `/root:${encodeURIComponent(wrapedPath)}${(type == '/children' && !isFolder) ? '' : `:${type}`}`
  // return `/root:${encodeURIComponent(wrapedPath)}:${type}`
}