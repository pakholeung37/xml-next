import { Parser, Handler } from './Parser'
import {
  SyntaxType,
  XMLDocument,
  XMLElement,
  XMLProlog,
  XMLPrologAttribute,
  XMLTextContent,
} from './types'

export interface XMLHandlerOptions {
  /**
   * Add a `startIndex` property to nodes.
   * When the parser is used in a non-streaming fashion, `startIndex` is an integer
   * indicating the position of the start of the node in the document.
   *
   * @default false
   */
  withStartIndices?: boolean

  /**
   * Add an `endIndex` property to nodes.
   * When the parser is used in a non-streaming fashion, `endIndex` is an integer
   * indicating the position of the end of the node in the document.
   *
   * @default false
   */
  withEndIndices?: boolean

  /**
   * Treat the markup as XML.
   *
   * @default false
   */
  xmlMode?: boolean
}

// Default options
const defaultOpts: XMLHandlerOptions = {
  withStartIndices: false,
  withEndIndices: false,
  xmlMode: false,
}

type Callback = (error: Error | null, ast: XMLDocument) => void
export class XMLHandler implements Partial<Handler> {
  private callback: Callback | null = null
  private options: XMLHandlerOptions
  private parser: Parser | null = null
  private rootElement: XMLElement | null = null
  private root: XMLDocument = this.createRoot()
  /** Stack of open tags. */
  private nodeStack: (XMLElement | null)[] = [this.rootElement]
  private done: boolean = false

  constructor(callback: Callback, options: XMLHandlerOptions = defaultOpts) {
    this.callback = callback
    this.options = options
  }

  public onparserinit(parser: Parser): void {
    this.parser = parser
  }

  public onreset(): void {
    this.root = this.createRoot()
    this.rootElement = null
    this.nodeStack = [this.rootElement]
    this.parser = null
    this.done = false
  }

  public onopentag(name: string, attrs: { [key: string]: string }): void {
    const node = this.createElement(name, attrs)
    if (this.rootElement === null) {
      this.rootElement = node
    }
    this.addNode(node)
    this.nodeStack.push(node)
  }

  public onclosetag(name: string): void {
    const elem = this.nodeStack.pop()
    if (elem && elem.name === name) {
      if (this.options.withEndIndices) {
        elem.position.endOffset = this.parser!.endIndex
      }
    } else {
      this.handleCallback(new Error('Unexpected closing tag'))
    }
  }

  public onend(): void {
    if (this.done) return
    this.done = true
    this.root.rootElement = this.rootElement
    this.handleCallback(null)
  }

  public onerror(error: Error): void {
    this.handleCallback(error)
  }

  public ontext(data: string): void {
    if (this.lastNode) {
      const node: XMLTextContent = {
        type: SyntaxType.XMLTextContent,
        text: data,
        parent: this.lastNode,
        position: {},
      }
      this.lastNode.textContents.push(node)
    }
  }
  // as xml prolog
  public onprocessinginstruction(name: string, data: string): void {
    if (/\?xml.*\?/.test(data)) {
      const node: XMLProlog = {
        type: SyntaxType.XMLProlog,
        attributes: [],
        position: {},
        parent: this.root,
      }
      const versionRE = data.match(/version="(.*?)"/)
      const encodingRE = data.match(/encoding="(.*?)"/)
      const attributes: XMLPrologAttribute[] = []

      ;[versionRE, encodingRE].forEach((match, index) => {
        if (match) {
          attributes.push({
            type: SyntaxType.XMLPrologAttribute,
            parent: node,
            key: index === 0 ? 'version' : 'encoding',
            value: match[1] + '',
            syntax: {},
            position: {},
          })
        }
      })
      node.attributes = attributes
      if (attributes.length > 0) {
        this.root.prolog = node
      }
    }
  }

  protected handleCallback(error: Error | null): void {
    if (this.callback) {
      this.callback(error, this.root)
    } else {
      if (error) {
        throw error
      }
    }
  }

  get lastNode(): XMLElement | null {
    return this.nodeStack[this.nodeStack.length - 1]
  }

  protected addNode(node: XMLElement): void {
    const parent = this.nodeStack[this.nodeStack.length - 1]
    if (this.options.withEndIndices) {
      node.position.endOffset = this.parser!.endIndex
    }
    if (this.options.withEndIndices) {
      node.position.endOffset = this.parser!.endIndex
    }
    if (parent) {
      parent.subElements.push(node)
      node.parent = parent
    } else {
      node.parent = this.root
    }
  }

  private createRoot(): XMLDocument {
    return {
      type: SyntaxType.XMLDocument,
      rootElement: null,
      position: {},
    }
  }

  private createElement(
    name: string,
    attrs: { [key: string]: string },
  ): XMLElement {
    const node: XMLElement = {
      type: SyntaxType.XMLElement,
      name: '',
      namespaces: {},
      subElements: [],
      textContents: [],
      parent: null,
      attributes: [],
      position: {},
    }
    const names = name.split(':')
    if (names.length === 1) {
      node.name = names[0]
    } else if (names.length === 2) {
      // namespace
      node.ns = names[0]
      node.name = names[1]
    } else {
      this.handleCallback(new Error('Invalid element name'))
    }

    node.attributes = Object.entries(attrs).map(([key, value]) => ({
      type: SyntaxType.XMLAttribute,
      key,
      value,
      parent: node,
      syntax: {
        key: {
          image: key,
          // TODO
          startOffset: 0,
          endOffset: 0,
        },
        value: {
          image: '"' + value + '"',
          // TODO
          startOffset: 0,
          endOffset: 0,
        },
      },
      position: {},
    }))
    return node
  }
}
