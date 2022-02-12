import { parse, DocumentCstNode } from '@xml-tools/parser'
import { buildAst } from '@xml-tools/ast'
import { parse as nextParse } from '../index'

describe('simple xml', () => {
  it('should comile right', () => {
    const xmlText = `<note>
                     <to>Bill</to>
                     <from>Tim</from>
                 </note>
`
    const { cst, tokenVector } = parse(xmlText)
    const xmlAst = buildAst(cst as DocumentCstNode, tokenVector)
    expect({}).toMatchObject(xmlAst)
  })
})
