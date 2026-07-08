// SPDX-FileCopyrightText: 2017 TODO Group.
// SPDX-FileCopyrightText: 2026 Damián Búho <damian.buho@proton.me>
// SPDX-License-Identifier: Apache-2.0

import path from 'node:path'
import fs from 'node:fs'
import { glob } from 'tinyglobby'

export interface GlobOptions {
  cwd?: string
  nocase?: boolean
  nodir?: boolean
  symlinks?: Record<string, boolean>
  ignore?: string | string[]
}

class FileSystem {
  static async fileExists(file: string): Promise<boolean> {
    try {
      await fs.promises.access(file, fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  private globCache = new Map<string, string[]>()
  targetDirectory: string
  filterPaths: string[]

  constructor(targetDirectory = '.', filterPaths: string[] = []) {
    this.targetDirectory = targetDirectory
    this.filterPaths = filterPaths
  }

  private globCacheKey(
    globs: string | string[],
    options: GlobOptions,
    mergedIgnore: string[]
  ): string {
    return JSON.stringify({ globs, options, ignore: mergedIgnore })
  }

  // Resolves a relative path and asserts it stays within targetDirectory,
  // preventing path traversal (e.g. ../../etc/passwd) via caller-supplied input.
  resolveContained(relativeFile: string): string {
    const base = path.resolve(this.targetDirectory)
    const resolved = path.resolve(base, relativeFile)
    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
      throw new Error(
        `path '${relativeFile}' resolves outside target directory '${base}'`
      )
    }
    return resolved
  }

  async relativeFileExists(file: string): Promise<boolean> {
    return FileSystem.fileExists(this.resolveContained(file))
  }

  async findFirst(
    globs: string | string[],
    isNocase?: boolean
  ): Promise<string | undefined> {
    const allFiles = await this.findAll(globs, isNocase)
    return allFiles.length > 0 ? allFiles.at(0) : undefined
  }

  async findFirstFile(
    globs: string | string[],
    isNocase?: boolean
  ): Promise<string | undefined> {
    const allFiles = await this.findAllFiles(globs, isNocase)
    return allFiles.length > 0 ? allFiles.at(0) : undefined
  }

  async findAllFiles(
    globs: string | string[],
    isNocase?: boolean
  ): Promise<string[]> {
    const symlinks: Record<string, boolean> = {}
    const filePaths = await this.glob(globs, {
      cwd: this.targetDirectory,
      nocase: !!isNocase,
      nodir: true,
      symlinks
    })

    const onlySymlinks = new Set<string>()
    for (const [fullPath, isSymlink] of Object.entries(symlinks)) {
      if (!isSymlink) {
        continue
      }

      const relativeToRepoPath = this.normalizePath(
        path.relative(this.targetDirectory, fullPath)
      )
      onlySymlinks.add(relativeToRepoPath)
    }

    return filePaths.filter(
      filePath => !onlySymlinks.has(this.normalizePath(filePath))
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
    // Always exclude node_modules and .git to avoid scanning dependency trees
    // during rule evaluation. Callers may extend this list via options.ignore.
    const defaultIgnore = ['node_modules/**', '.git/**']
    const userIgnore = options.ignore
      ? Array.isArray(options.ignore)
        ? options.ignore
        : [options.ignore]
      : []
    const mergedIgnore = [...defaultIgnore, ...userIgnore]

    const key = this.globCacheKey(fixedGlobs, options, mergedIgnore)
    const cached = this.globCache.get(key)
    if (cached !== undefined) {
      return cached
    }

    const results = await glob(fixedGlobs, {
      cwd: options.cwd ?? this.targetDirectory,
      caseSensitiveMatch: options.nocase !== true,
      onlyFiles: options.nodir !== false,
      ignore: mergedIgnore,
      dot: true,
      expandDirectories: false
    })

    if (options.symlinks) {
      const cwd = options.cwd ?? this.targetDirectory
      for (const relative of results) {
        const fullPath = path.resolve(cwd, relative)
        try {
          const stat = await fs.promises.lstat(fullPath)
          options.symlinks[fullPath] = stat.isSymbolicLink()
        } catch {
          options.symlinks[fullPath] = false
        }
      }
    }

    const normalized = results
      .map(p => this.normalizePath(p))
      .filter(p => this.shouldInclude(p))

    this.globCache.set(key, normalized)
    return normalized
  }

  async findAll(globs: string | string[], isNocase = false): Promise<string[]> {
    const fixedGlobs =
      typeof globs === 'string'
        ? this.normalizePath(globs)
        : globs.map(g => this.normalizePath(g))
    return this.glob(fixedGlobs, {
      cwd: this.targetDirectory,
      nocase: !!isNocase
    })
  }

  async isBinaryFile(relativeFile: string): Promise<boolean> {
    const file = this.resolveContained(relativeFile)
    try {
      const { isBinaryFile } = await import('isbinaryfile')
      return isBinaryFile(file)
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return false
      }
      throw error
    }
  }

  shouldInclude(filePath: string): boolean {
    if (this.filterPaths.length === 0) {
      return true
    }
    const resolvedPath = this.normalizePath(
      path.relative(
        this.targetDirectory,
        path.resolve(this.targetDirectory, filePath)
      )
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
    const file = this.resolveContained(relativeFile)
    try {
      return await fs.promises.readFile(file, 'utf8')
    } catch {
      return undefined
    }
  }

  async setFileContents(relativeFile: string, contents: string): Promise<void> {
    this.globCache.clear()
    return fs.promises.writeFile(this.resolveContained(relativeFile), contents)
  }

  async removeFile(relativeFile: string): Promise<void> {
    this.globCache.clear()
    return fs.promises.unlink(this.resolveContained(relativeFile))
  }

  async getFileLines(
    relativeFile: string,
    lineCount: number
  ): Promise<string | undefined> {
    const file = this.resolveContained(relativeFile)
    let fd: fs.promises.FileHandle | undefined
    try {
      fd = await fs.promises.open(file, 'r')
    } catch (error: unknown) {
      if (fd) await fd.close()
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return undefined
      }
      throw error
    }
    const bufferSize = 1024
    const buffer = Buffer.alloc(bufferSize)
    let lines = ''
    let lineNumber = 0

    let leftOver = ''
    let indexStart: number
    let index: number
    while (true) {
      const returnValue = await fd.read(buffer, 0, bufferSize)
      const read = returnValue.bytesRead
      if (read === 0) {
        break
      }
      leftOver += buffer.toString('utf8', 0, read)
      indexStart = 0
      while ((index = leftOver.indexOf('\n', indexStart!)) !== -1) {
        lineNumber++
        lines += leftOver.slice(indexStart!, index) + '\n'
        indexStart = index + 1

        if (lineNumber >= lineCount) {
          await fd.close()
          return lines
        }
      }
      leftOver = leftOver.slice(Math.max(0, indexStart))
    }
    await fd.close()
    return lines
  }
}

export default FileSystem
