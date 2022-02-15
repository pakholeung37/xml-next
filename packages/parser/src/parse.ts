/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-08-19 00:54:46
 * @version 1.0.0
 * @desc parse.ts
 */

import { noNestedTags, selfCloseTags } from './config'
import { IToken, tokenize, TokenKind } from './tokenize'
import {
  IAttributeValue,
  INode,
  IText,
  SyntaxKind,
  XMLAstNode,
  XMLDocument,
  XMLAttribute,
  XMLElement,
} from './types'
import { getLineRanges, getPosition } from './utils'

interface IContext {
  parent: IContext | undefined
  tag: XMLElement
}

export interface ParseOptions {}

let index: number
let count: number
let tokens: IToken[]
let tagChain: IContext | undefined
let nodes: INode[]
let token: IToken
let node: IText | undefined
let buffer: string
let lines: number[] | undefined
// let parseOptions: ParseOptions | undefined

function init(input?: string, _options?: ParseOptions) {
  if (input === undefined) {
    count = 0
    tokens.length = 0
    buffer = ''
  } else {
    tokens = tokenize(input)
    count = tokens.length
    buffer = input
  }
  index = 0
  tagChain = undefined
  nodes = []
  token = undefined as any
  node = undefined
  lines = undefined
  // parseOptions = options
}

function pushNode(_node: XMLAstNode) {
  if (!tagChain) {
    nodes.push(_node)
  } else if (
    _node.type === SyntaxKind.XMLElement &&
    _node.name === tagChain.tag.name &&
    noNestedTags[_node.name]
  ) {
    tagChain = tagChain.parent
    pushNode(_node)
  } else if (tagChain.tag.subElements) {
    tagChain.tag.position.endOffset = _node.endOffset
    tagChain.tag.subElements.push(_node)
  }
}

function pushTagChain(tag: XMLElement) {
  tagChain = { parent: tagChain, tag: tag }
  node = undefined
}

function createLiteral(
  startOffset = token.start,
  endOffset = token.end,
  value = token.value,
): IText {
  return { startOffset, endOffset, value, type: SyntaxKind.XMLTextContent }
}

function createRoot(): XMLDocument {
  return {
    type: SyntaxKind.XMLDocument,
    position: {
      startOffset: 0,
      endOffset: buffer.length,
    },
    rootElement: null,
  }
}

function createTag(): XMLElement {
  return {
    parent: null,
    position: {
      startOffset: token.start - 1, // include <
      endOffset: token.end,
    },
    type: SyntaxKind.XMLElement,
    name: token.value,
    attributes: [],
    subElements: [],
    namespaces: {},
    textContents: [],
    // open: createLiteral(token.start - 1), // not finished
    // close: null,
  }
}

function createAttribute(): XMLAttribute {
  return {
    type: SyntaxKind.XMLAttribute,
    position: {
      startOffset: token.start,
      endOffset: null,
    },
    syntax: {
      key: {
        startOffset: token.start,
        endOffset: token.end,
        image: token.value,
      },
      value: null,
    },
    key: token.value,
    value: null,
  } as unknown as XMLAttribute
}

function createAttributeValueSyntax(): XMLAttribute['syntax']['value'] {
  return {
    startOffset: token.start,
    endOffset: token.end,
    image:
      token.type === TokenKind.AttrValueNq
        ? token.value
        : token.value.substring(1, token.value.length - 1),
  }
}

function appendLiteral(_node: IText | IAttributeValue = node as IText) {
  _node.value += token.value
  _node.endOffset = token.end
}

function appendValueLiteral(attr: XMLAttribute) {
  attr.value += token.value
  attr.position.endOffset = token.end
  attr.syntax.value!.endOffset = token.end
}

function unexpected() {
  if (lines === undefined) {
    lines = getLineRanges(buffer)
  }
  const [line, column] = getPosition(lines, token.start)
  throw new Error(
    `Unexpected token "${token.value}(${token.type})" at [${line},${column}]` +
      (tagChain
        ? ` when parsing tag: ${JSON.stringify(tagChain.tag.name)}.`
        : ''),
  )
}

const enum OpenTagState {
  BeforeAttr,
  InName,
  AfterName,
  AfterEqual,
  InValue,
}

function parseOpenTag() {
  let state = OpenTagState.BeforeAttr

  let attr: XMLAttribute = undefined as any

  const tag = createTag()
  pushNode(tag)
  if (tag.name === '' || tag.name === '!' || tag.name === '!--') {
    // tag.open.value = '<' + tag.open.value
    if (index === count) {
      return
    } else {
      token = tokens[++index]
      if (token.type !== TokenKind.OpenTagEnd) {
        node = createLiteral()
        tag.subElements = [node]
        while (++index < count) {
          token = tokens[index]
          if (token.type === TokenKind.OpenTagEnd) {
            node = undefined
            break
          }
          appendLiteral()
        }
      }
      // tag.close = createLiteral(token.start, token.end + 1, `${token.value}>`)
      tag.position.endOffset = token.end + 1
    }
    return
  }
  while (++index < count) {
    token = tokens[index]
    if (token.type === TokenKind.OpenTagEnd) {
      tag.position.endOffset = token.end + 1
      // tag.open.endOffset = token.end + 1
      // tag.open.value = buffer.substring(
      //   tag.open.startOffset,
      //   tag.open.endOffset,
      // )
      if (token.value === '' && tag.name && !selfCloseTags[tag.name]) {
        tag.subElements = []
        pushTagChain(tag)
      } else {
        tag.subElements = []
      }
      break
    } else if (state === OpenTagState.BeforeAttr) {
      if (token.type !== TokenKind.Whitespace) {
        attr = createAttribute()
        state = OpenTagState.InName
        tag.attributes.push(attr)
      }
    } else if (state === OpenTagState.InName) {
      if (token.type === TokenKind.Whitespace) {
        state = OpenTagState.AfterName
      } else if (token.type === TokenKind.AttrValueEq) {
        state = OpenTagState.AfterEqual
      } else {
        // appendLiteral(attr.name)
        unexpected()
      }
    } else if (state === OpenTagState.AfterName) {
      if (token.type !== TokenKind.Whitespace) {
        if (token.type === TokenKind.AttrValueEq) {
          state = OpenTagState.AfterEqual
        } else {
          attr = createAttribute()
          state = OpenTagState.InName
          tag.attributes.push(attr)
        }
      }
    } else if (state === OpenTagState.AfterEqual) {
      if (token.type !== TokenKind.Whitespace) {
        attr.syntax.value = createAttributeValueSyntax()
        attr.value = attr.syntax.value!.image
        attr.position.endOffset = attr.syntax.value!.endOffset
        if (token.type === TokenKind.AttrValueNq) {
          state = OpenTagState.InValue
        } else {
          attr.position.endOffset = attr.syntax.value!.endOffset
          state = OpenTagState.BeforeAttr
        }
      }
    } else if (state === OpenTagState.InValue) {
      if (token.type === TokenKind.Whitespace) {
        attr.position.endOffset = attr.syntax.value!.endOffset
        state = OpenTagState.BeforeAttr
      } else {
        appendValueLiteral(attr)
      }
    } else {
      unexpected()
    }
  }
}

function parseCloseTag() {
  let _context = tagChain
  while (true) {
    if (!_context || token.value.trim() === _context.tag.name) {
      break
    }
    _context = _context.parent
  }
  if (!_context) {
    return
  }
  // _context.tag.close = createLiteral(
  //   token.start - 2,
  //   token.end + 1,
  //   buffer.substring(token.start - 2, token.end + 1),
  // )
  _context.tag.position.endOffset = token.end + 1
  _context = _context.parent
  tagChain = _context
}

export function parse(input: string, options?: ParseOptions): XMLAstNode {
  init(input, {
    ...options,
  } as ParseOptions)
  const root = createRoot()
  while (index < count) {
    token = tokens[index]
    switch (token.type) {
      case TokenKind.Literal:
        if (!node) {
          node = createLiteral()
          pushNode(node)
        } else {
          appendLiteral(node)
        }
        break
      case TokenKind.OpenTag:
        node = undefined
        parseOpenTag()
        break
      case TokenKind.CloseTag:
        node = undefined
        parseCloseTag()
        break
      default:
        unexpected()
        break
    }
    index++
  }
  const _node = nodes[0]
  root.rootElement = _node as XMLElement
  init()

  return root
}
