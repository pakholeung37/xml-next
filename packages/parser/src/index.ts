import { Parser } from './Parser'
import { XMLDocument } from './types'
import { XMLHandler } from './XMLHandler'

export function parse(xmlContent: string): {
  ast: XMLDocument
  errors: Error[]
} {
  let result: any
  let errors: Error[] = []
  const handler = new XMLHandler((error, ast) => {
    if (error) {
      // Handle error
      errors = [error]
    } else {
      // Parsing completed, do something
      result = ast
    }
  })

  const parser = new Parser(handler, { xmlMode: true })
  parser.write(xmlContent)
  parser.end()
  return { ast: result, errors }
}
