/**
 * An Abstract Syntax Tree structure
 * Which contains partial position information relevant
 * for validation and content assist scenarios.
 *
 * Note that:
 *
 * - This data structure is immutable.
 * - The AST is is a "pure data structure"
 *     there are no methods directly on the nodes, instead utilities are provided
 *     as external functions.
 * - The AST does not contain the full syntactic information, which means
 *     implementing certain editor services scenarios may require first augmenting
 *     this data structure (e.g formatting).
 * - Some properties are optional (marked with '?' syntax)
 * - Some properties are mandatory but may be `InvalidSyntax` (null) because
 *   this structure also represents partially valid XML.
 */

export interface SourcePosition {
  startOffset?: number
  endOffset?: number
  startLine?: number
  endLine?: number
  startColumn?: number
  endColumn?: number
}
export interface XMLToken extends SourcePosition {
  image: string
}
export interface XMLDocument {
  type: SyntaxType.XMLDocument
  prolog?: XMLProlog
  rootElement: XMLElement | InvalidSyntax
  position: SourcePosition
}

export interface XMLProlog {
  type: SyntaxType.XMLProlog
  parent: XMLDocument
  position: SourcePosition
  attributes: XMLPrologAttribute[]
}

// A Prefix cannot include a colon ":" so the below string will never conflict
// with a valid namespace prefix.
export type DefaultNS = '::DEFAULT'
export type Prefix = string | DefaultNS
export type Uri = string

export interface XMLElement {
  type: SyntaxType.XMLElement
  parent: XMLElement | XMLDocument | null

  namespaces: Record<Prefix, Uri>

  // namespace prefix used by this XML Element.
  // - Note that this is an optional syntax.
  ns?: string
  // Actual name part (without the namespace prefix) used by this XML Element.
  name: string | InvalidSyntax

  attributes: XMLAttribute[]
  subElements: XMLElement[]
  textContents: XMLTextContent[]
  position: SourcePosition
}

export interface XMLTextContent {
  type: SyntaxType.XMLTextContent
  parent: XMLElement | null
  text: string | InvalidSyntax
  position: SourcePosition
}

export interface XMLAttributeBase {
  type: string

  key: string | InvalidSyntax
  // Semantic Value: Would not include the quotes!
  value: string | InvalidSyntax
  syntax: {
    key?: XMLToken
    // Original Literal value, would include the quotes
    value?: XMLToken
  }
  position: SourcePosition
}

export interface XMLAttribute extends XMLAttributeBase {
  type: SyntaxType.XMLAttribute
  parent: XMLElement | null
}

/**
 * XMLPrologAttribute is virtually identical to a regular `XMLAttribute`.
 * However it was moved to a separate interface to allow consistent handling of the `parent`
 * property in `XMLAttribute`, as 99.9% of the time the edge case of a parent being an XMLProlog
 * is not relevant.
 */
export interface XMLPrologAttribute extends XMLAttributeBase {
  type: SyntaxType.XMLPrologAttribute
  parent: XMLProlog | null
}

export type XMLAstNode =
  | XMLDocument
  | XMLProlog
  | XMLPrologAttribute
  | XMLElement
  | XMLAttribute
  | XMLTextContent

export type InvalidSyntax = null

/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-08-18 15:17:51
 * @version 1.0.0
 * @desc types.ts
 */

export enum SyntaxType {
  XMLDocument = 'XMLDocument',
  XMLElement = 'XMLElement',
  XMLProlog = 'XMLProlog',
  XMLPrologAttribute = 'XMLPrologAttribute',
  XMLAttribute = 'XMLAttribute',
  XMLTextContent = 'XMLTextContent',
}
