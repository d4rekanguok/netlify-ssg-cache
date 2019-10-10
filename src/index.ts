import fs from 'fs-extra'
import path from 'path'
import execa from 'execa'
import report from 'yurnalist'

import { SSG_CACHE_DIR } from './constants'

async function readFileCount(targetPath: string): Promise<number> {
  if (!fs.existsSync(targetPath)) {
    err(`${targetPath} doesn't exists.`)
  }

  const files = await fs.readdir(targetPath)
  const countP = files.map<Promise<number>>(async file => {
    const filePath = path.join(targetPath, file)
    const stats = await fs.statSync(filePath)
    if (stats.isDirectory()) {
      const count = await readFileCount(filePath)
      return count
    }
    if (stats.isFile()) {
      return 1
    }
    return 0
  })

  const results = await Promise.all(countP)
  const total = results.reduce((cur, acc) => (acc + cur), 0)
  return total
}

function err(msg: string) {
  throw new Error(`[netlify-ssg-cache] ${msg}`)
}

function getDirectories() {
  const basePath = process.env.NETLIFY_BUILD_BASE
  const SSG = process.env.SSG || 'gatsby'

  if (!basePath) {
    err('Not in Netlify environment')
  }

  const SSGCacheDir = SSG_CACHE_DIR[SSG]
  if (typeof SSGCacheDir === 'undefined') {
    err('Unknown SSG')
  }
  
  const nCachePath = path.resolve(
    (basePath as string), 
    'cache', 
    'netlifySSGCache',
    SSGCacheDir,
  )

  const SSGCachePath = path.resolve(process.cwd(), SSGCacheDir)

  return {
    nCachePath,
    SSGCachePath,
  }
}

async function move(from: string, to: string) {
  if (!fs.existsSync(from)) {
    return
  }

  const fileCount = await readFileCount(from)
  report.info(`[netlify-ssg-cache] About to move ${fileCount} files`)

  if (fs.existsSync(to)) {
    await fs.remove(to)
  }
  return fs.move(from, to)
}

export async function main() {
  try {
    const { nCachePath, SSGCachePath } = getDirectories()

    await move(nCachePath, SSGCachePath)

    // @ts-ignore
    await execa('npm', ['run', 'build'], {
      cwd: process.cwd(),
      env: { NODE_ENV: 'production' },
      stdio: 'inherit',
    })

    await move(SSGCachePath, nCachePath)
    report.success(`[netlify-ssg-cache] Done.`)

  } catch (err) {
    report.warn(err)
    throw err
  }
}
