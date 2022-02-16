import { expect } from 'chai'
import { partialRight } from 'lodash'
import { readFileSync } from 'fs'
import { resolve, basename } from 'path'
import { parse as toolparse } from '@xml-tools/parser'
import { buildAst } from '@xml-tools/ast'
import {
  modifyAstForAssertions,
  assertParentPropsAreValid,
  sanitize,
} from './utils'
import { parse } from '../index'
import { XMLAstNode } from '../types'

function executeSampleTest(dirPath: string, _assertNoErrors: boolean) {
  it('Can build an AST for a valid XML', () => {
    const inputPath = resolve(dirPath, 'input.xml')
    const inputText = readFileSync(inputPath).toString('utf8')
    const simpleNewLinesInput = inputText.replace(/\r\n/g, '\n')
    const { ast } = parse(simpleNewLinesInput)
    // if (assertNoErrors === true) {
    //   expect(lexErrors).to.be.empty
    //   expect(parseErrors).to.be.empty
    // }
    assertParentPropsAreValid(ast as unknown as XMLAstNode)
    modifyAstForAssertions(ast as unknown as XMLAstNode)
    sanitize(ast)
    const { cst, tokenVector } = toolparse(inputText)
    const expectedOutput = buildAst(cst as any, tokenVector)
    sanitize(expectedOutput as any)
    modifyAstForAssertions(expectedOutput as unknown as XMLAstNode)
    expect(ast).to.deep.equal(expectedOutput)
  })
}

export function testNameFromDir(dirPath: string) {
  return basename(dirPath)
}

export const executeValidSampleTest = partialRight(executeSampleTest, true)
export const executeInValidSampleTest = partialRight(executeSampleTest, false)
