import fs from 'fs-extra'
import path from 'path'

import { SSG_CACHE_DIR } from './constants'

function err(msg: string) {
  throw new Error(`[netlify-ssg-cache] ${msg}`)
}

async function readFileCount(targetPath: string): Promise<number> {
  if (!fs.existsSync(targetPath)) {
    err(`${targetPath} doesn't exists.`)
  }

  const files = await fs.readdir(targetPath)
  const countP = files.map<Promise<number>>(async file => {
    const filePath = path.join(targetPath, file)
    const stats = await fs.stat(filePath)
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

function getDirectories({ ssg = 'gatsby' }) {
  const basePath = process.env.NETLIFY_BUILD_BASE

  if (!basePath) {
    err('Not in Netlify environment')
  }

  const SSGCacheDir = SSG_CACHE_DIR[ssg]
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
  console.log(`[netlify-ssg-cache] About to move ${fileCount} files`)

  if (fs.existsSync(to)) {
    await fs.remove(to)
  }
  return fs.move(from, to)
}

function plugin(config: any) {
  const { ssg } = config
  try {
    const { nCachePath, SSGCachePath } = getDirectories({ ssg })
    return {
      name: 'netlify-ssg-cache',
      getCache: async function({ constants }: { constants: any }) {
        // const nCachePath = path.resolve(constants.CACHE_DIR, 'netlifySSGCache')
        await move(nCachePath, SSGCachePath)
      },
      saveCache: async function (){
        await move(SSGCachePath, nCachePath)
      }
    }
  } catch(err) {
    throw err
  }
}

module.exports = plugin