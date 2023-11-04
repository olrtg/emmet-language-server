#!/usr/bin/env node

import {
  FileType,
  doComplete,
  expandAbbreviation,
  getEmmetMode,
  updateExtensionsPath,
  type FileService,
  type VSCodeEmmetConfig,
} from '@vscode/emmet-helper'
import fs from 'fs'
import path from 'path'
import util from 'util'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node'

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)

interface GlobalConfig extends VSCodeEmmetConfig {
  extensionsPath?: string[]
}

let globalConfig: GlobalConfig = {}

/**
 * @see {@link https://github.com/microsoft/vscode-emmet-helper/blob/ea184b3b7d6d7ffbc1721b5ce986c8477d420127/src/test/emmetHelper.test.ts#L40-L79}
 */
const fileService: FileService = {
  async readFile(uri) {
    if (uri.scheme !== 'file') {
      throw new Error(`schema ${uri.scheme} is not supported`)
    }

    return await util.promisify(fs.readFile)(uri.fsPath)
  },
  async stat(uri) {
    if (uri.scheme !== 'file') {
      throw new Error(`schema ${uri.scheme} is not supported`)
    }

    return new Promise((c, e) => {
      fs.stat(uri.fsPath, (err, stats) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return c({ type: FileType.Unknown, ctime: -1, mtime: -1, size: -1 })
          } else {
            return e(err)
          }
        }

        let type = FileType.Unknown
        if (stats.isFile()) {
          type = FileType.File
        } else if (stats.isDirectory()) {
          type = FileType.Directory
        } else if (stats.isSymbolicLink()) {
          type = FileType.SymbolicLink
        }

        c({
          type,
          ctime: stats.ctime.getTime(),
          mtime: stats.mtime.getTime(),
          size: stats.size,
        })
      })
    })
  },
}

connection.onInitialize(params => {
  globalConfig = params.initializationOptions || {}

  if (globalConfig.extensionsPath && globalConfig.extensionsPath.length) {
    const absolutePaths = globalConfig.extensionsPath.map(extensionPath =>
      path.isAbsolute(extensionPath)
        ? extensionPath
        : path.resolve(extensionPath),
    )

    updateExtensionsPath(absolutePaths, fileService)
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [
          // NOTE: For cases where is valid to expand emmet abbreviations with
          // special characters
          '!', // eg. `!` and `!!!` snippets in html or `!important` in css
          ':', // eg. `w:` should expand to `width: |;`
          '>', // https://docs.emmet.io/abbreviations/syntax/#child-gt
          '+', // https://docs.emmet.io/abbreviations/syntax/#sibling
          '^', // https://docs.emmet.io/abbreviations/syntax/#climb-up
          '*', // https://docs.emmet.io/abbreviations/syntax/#multiplication
          ')', // https://docs.emmet.io/abbreviations/syntax/#grouping
          '.', // https://docs.emmet.io/abbreviations/syntax/#id-and-class
          ']', // https://docs.emmet.io/abbreviations/syntax/#custom-attributes
          '@', // https://docs.emmet.io/abbreviations/syntax/#changing-numbering-base-and-direction
          '}', // https://docs.emmet.io/abbreviations/syntax/#text
          '/', // for self-closing tags, eg. `div/` should expand to `<div />|`

          // NOTE: For cases where completion is not triggered by typing a
          // single character
          'a',
          'b',
          'c',
          'd',
          'e',
          'f',
          'g',
          'h',
          'i',
          'j',
          'k',
          'l',
          'm',
          'n',
          'o',
          'p',
          'q',
          'r',
          's',
          't',
          'u',
          'v',
          'w',
          'x',
          'y',
          'z',

          // NOTE: For cases where completion is not triggered by typing a
          // single character or because numbers cannot be used to trigger
          // completion
          '0',
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
        ],
      },
    },
  }
})

connection.onCompletion(textDocumentPosition => {
  const document = documents.get(textDocumentPosition.textDocument.uri)

  if (!document) {
    return
  }

  const languageId = document.languageId
  const syntax = getEmmetMode(languageId) ?? 'html'

  if (!syntax) {
    return
  }

  const position = textDocumentPosition.position

  return doComplete(document, position, syntax, globalConfig)
})

connection.onRequest(
  'emmet/expandAbbreviation',
  (params: {
    abbreviation: string
    options: Parameters<typeof expandAbbreviation>[1]
  }) => {
    return expandAbbreviation(params.abbreviation, params.options)
  },
)

documents.listen(connection)
connection.listen()
