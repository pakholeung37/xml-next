import { XMLAstVisitor } from '@xml-tools/ast'
import { XMLAstNode } from './types'

export * from './types'
export * from './tokenize'
export * from './parse'
export * from './walk'

export function accept(_node: XMLAstNode, _visitor: XMLAstVisitor): void {
  return
}
