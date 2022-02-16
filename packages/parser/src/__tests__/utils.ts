import { SyntaxType, XMLAstNode } from '../types'
import { forEach } from 'lodash'
import { expect } from 'chai'
import { XMLAstVisitor, XMLTextContent, accept } from '@xml-tools/ast'

export function modifyAstForAssertions(astNode: XMLAstNode) {
  // Avoid comparing cyclic structures
  accept(astNode as any, parentRemoverVisitor)
  // Reduce verbosity of assertions
  accept(astNode as any, positionReducerVisitor)
}

/**
 * @type {XMLAstVisitor}
 */
const parentRemoverVisitor = {
  /* eslint-disable-next-line no-unused-vars -- consistent signatures in visitor methods even if they are empty placeholders */
  visitXMLDocument: (_node: any) => {
    // top level XML Doc does not have a parent...
  },
  visitXMLProlog: (node: any) => {
    delete node.parent
  },
  visitXMLPrologAttribute: (node: any) => {
    delete node.parent
  },
  visitXMLElement: (node: any) => {
    delete node.parent
  },
  visitXMLAttribute: (node: any) => {
    delete node.parent
  },
  visitXMLTextContent: (node: any) => {
    delete node.parent
  },
}

export const positionReducerVisitor = {
  visitXMLDocument: (node: any) => {
    reduceNodePoseInfo(node)
  },
  visitXMLProlog: (node: any) => {
    reduceNodePoseInfo(node)
  },
  visitXMLPrologAttribute: (node: any) => {
    reduceNodePoseInfo(node)
  },
  visitXMLElement: (node: any) => {
    reduceNodePoseInfo(node)
  },
  visitXMLAttribute: (node: any) => {
    reduceNodePoseInfo(node)
  },
  visitXMLTextContent: (node: any) => {
    reduceNodePoseInfo(node)
  },
}

function reduceNodePoseInfo(node: { position: any; syntax: any }) {
  reducePositionInfo(node.position)

  forEach(node.syntax, tok => {
    reducePositionInfo(tok)
  })
}

function reducePositionInfo(
  pos: {
    startColumn?: any
    endColumn?: any
    startLine?: any
    endLine?: any
  } = {},
) {
  delete pos.startColumn
  delete pos.endColumn
  delete pos.startLine
  delete pos.endLine
}

export function assertParentPropsAreValid(astNode: XMLAstNode) {
  accept(astNode as any, parentPropsValidatorVisitor as any)
}

const parentPropsValidatorVisitor: XMLAstVisitor = {
  /* eslint-disable-next-line no-unused-vars -- consistent signatures in visitor methods even if they are empty placeholders */
  visitXMLDocument: (_node: any) => {
    // top level XML Doc does not have a parent...
  },
  visitXMLProlog: (node: any) => {
    expect(node.parent.prolog).to.eql(node)
  },
  visitXMLElement: (node: any) => {
    const parent = node.parent
    if (parent.type === SyntaxType.XMLDocument) {
      expect(parent.rootElement).to.eql(node)
    } else {
      expect(parent.subElements).to.include(node)
    }
  },
  visitXMLAttribute: (node: any) => {
    expect(node.parent.attributes).to.include(node)
  },
  visitXMLTextContent: (node: XMLTextContent) => {
    expect(node.parent.textContents).to.include(node)
  },
}

export function sanitize(ast: XMLAstNode): XMLAstNode {
  const innerAst = ast as any
  if (innerAst.position) {
    delete innerAst.position
  }
  // if (innerAst.syntax) {
  //   delete innerAst.syntax
  // }
  if (innerAst.textContents) {
    delete innerAst.textContents
  }
  if (innerAst.namespaces) {
    delete innerAst.namespaces
  }
  if (innerAst.prolog) {
    sanitize(innerAst.prolog)
    // delete innerAst.prolog
  }
  if (innerAst.rootElement) {
    sanitize(innerAst.rootElement)
  }
  if (innerAst.subElements) {
    innerAst.subElements.forEach((elem: any) => sanitize(elem))
  }
  if (innerAst.attributes) {
    innerAst.attributes.forEach((elem: any) => sanitize(elem))
  }
  if (innerAst.textContents) {
    innerAst.textContents.forEach((elem: any) => sanitize(elem))
  }
  return innerAst
}
