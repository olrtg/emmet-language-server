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
