#!/usr/bin/env node

import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
} from 'vscode-languageserver/node'
import {
  VSCodeEmmetConfig,
  doComplete,
  getEmmetMode,
} from '@vscode/emmet-helper'

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)

let globalConfig: VSCodeEmmetConfig = {}

connection.onInitialize(params => {
  globalConfig = params.initializationOptions || {}

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

documents.listen(connection)
connection.listen()
