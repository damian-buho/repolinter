// Copyright 2017 TODO Group. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import matched from 'matched'
import fs from 'node:fs'

const glob = matched

interface GlobOptions {
  cwd?: string
  nocase?: boolean
  nodir?: boolean
  symlinks?: Record<string, boolean>
  ignore?: string | string[]
}

class FileSystem {
  targetDir: string
  filterPaths: string[]

  constructor(targetDir = '.', filterPaths: string[] = []) {
    this.targetDir = targetDir
    this.filterPaths = filterPaths
  }

  static async fileExists(file: string): Promise<boolean> {
    return fs.promises
      .access(file, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
  }

  async relativeFileExists(file: string): Promise<boolean> {
    return FileSystem.fileExists(path.resolve(this.targetDir, file))
  }

  async findFirst(
    globs: string | string[],
    nocase?: boolean
  ): Promise<string | undefined> {
    const allFiles = await this.findAll(globs, nocase)
    return allFiles.length > 0 ? allFiles.at(0) : undefined
  }

  async findFirstFile(
    globs: string | string[],
    nocase?: boolean
  ): Promise<string | undefined> {
    const allFiles = await this.findAllFiles(globs, nocase)
    return allFiles.length > 0 ? allFiles.at(0) : undefined
  }

  async findAllFiles(
    globs: string | string[],
    nocase?: boolean
  ): Promise<string[]> {
    const symlinks: Record<string, boolean> = {}
    const filePaths = await this.glob(globs, {
      cwd: this.targetDir,
      nocase: !!nocase,
      nodir: true,
      symlinks
    })

    const onlySymlinks: Record<string, boolean> = {}
    for (const fullPath in symlinks) {
      if (symlinks[fullPath]) {
        const relativeToRepoPath = this.normalizePath(
          path.relative(this.targetDir, fullPath)
        )
        onlySymlinks[relativeToRepoPath] = true
      }
    }

    return filePaths.filter(
      filePath => !onlySymlinks[this.normalizePath(filePath)]
    )
  }

  async glob(
    globs: string | string[],
    options: GlobOptions
  ): Promise<string[]> {
    const fixedGlobs =
      typeof globs === 'string'
        ? this.normalizePath(globs)
        : globs.map(g => this.normalizePath(g))
    return (await glob(fixedGlobs, options))
      .map(p => this.normalizePath(p))
      .filter(p => this.shouldInclude(p))
  }

  async findAll(
    globs: string | string[],
    nocase = false
  ): Promise<string[]> {
    const fixedGlobs =
      typeof globs === 'string'
        ? this.normalizePath(globs)
        : globs.map(g => this.normalizePath(g))
    return this.glob(fixedGlobs, {
      cwd: this.targetDir,
      nocase: !!nocase
    })
  }

  async isBinaryFile(relativeFile: string): Promise<boolean> {
    const file = path.resolve(this.targetDir, relativeFile)
    try {
      const { isBinaryFile } = await import('isbinaryfile')
      return isBinaryFile(file)
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('ENOENT')) {
        return false
      }
      throw e
    }
  }

  shouldInclude(filePath: string): boolean {
    if (this.filterPaths.length === 0) {
      return true
    }
    const resolvedPath = this.normalizePath(
      path.relative(this.targetDir, path.resolve(this.targetDir, filePath))
    )
    return this.filterPaths
      .map(p => this.normalizePath(p))
      .some(p => resolvedPath.startsWith(p))
  }

  normalizePath(filepath: string): string {
    if (process.platform === 'win32') {
      return filepath.split(path.sep).join('/')
    }
    return filepath
  }

  async getFileContents(relativeFile: string): Promise<string | undefined> {
    const file = path.resolve(this.targetDir, relativeFile)
    try {
      return await fs.promises.readFile(file, 'utf8')
    } catch {
      return undefined
    }
  }

  async setFileContents(relativeFile: string, contents: string): Promise<void> {
    return fs.promises.writeFile(
      path.resolve(this.targetDir, relativeFile),
      contents
    )
  }

  async removeFile(relativeFile: string): Promise<void> {
    return fs.promises.unlink(path.resolve(this.targetDir, relativeFile))
  }

  async getFileLines(
    relativeFile: string,
    lineCount: number
  ): Promise<string | undefined> {
    const file = path.resolve(this.targetDir, relativeFile)
    let fd: fs.promises.FileHandle | undefined
    try {
      fd = await fs.promises.open(file, 'r')
    } catch (e: unknown) {
      if (fd) await fd.close()
      if (e instanceof Error && e.message.includes('ENOENT')) {
        return undefined
      }
      throw e
    }
    const bufferSize = 1024
    const buffer = Buffer.alloc(bufferSize)
    let lines = ''
    let lineNumber = 0

    let leftOver = ''
    let idxStart = 0
    let idx: number
    while (true) {
      const ret = await fd.read(buffer, 0, bufferSize, null)
      const read = ret.bytesRead
      if (read === 0) {
        break
      }
      leftOver += buffer.toString('utf8', 0, read)
      idxStart = 0
      while ((idx = leftOver.indexOf('\n', idxStart)) !== -1) {
        lineNumber++
        lines += leftOver.substring(idxStart, idx) + '\n'
        idxStart = idx + 1

        if (lineNumber >= lineCount) {
          await fd.close()
          return lines
        }
      }
      leftOver = leftOver.substring(idxStart)
    }
    await fd.close()
    return lines
  }
}

export default FileSystem
