/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-08-19 00:54:46
 * @version 1.0.0
 * @desc walk.ts
 */

import { XMLElement, XMLDocument } from '@xml-tools/ast'
import { SyntaxKind } from './types'

export interface WalkOptions {
  enter?(
    node: XMLElement | XMLDocument,
    parent: XMLElement | XMLDocument | undefined,
    index: number,
  ): void
  leave?(
    node: XMLElement | XMLDocument,
    parent: XMLElement | XMLDocument | undefined,
    index: number,
  ): void
}

function visit(
  node: XMLDocument | XMLElement,
  parent: XMLElement | XMLDocument | undefined,
  index: number,
  options: WalkOptions,
) {
  if (options.enter) {
    options.enter(node, parent, index)
  }
  if (node.type === SyntaxKind.XMLDocument && node.rootElement) {
    visit(node.rootElement, node, index, options)
  }
  if (node.type === SyntaxKind.XMLElement && Array.isArray(node.subElements)) {
    for (let i = 0; i < node.subElements.length; i++) {
      visit(node.subElements[i], node, i, options)
    }
  }
  if (options.leave) {
    options.leave(node, parent, index)
  }
}

export function walk(ast: XMLElement | XMLDocument, options: WalkOptions) {
  visit(ast, void 0, 0, options)
}
