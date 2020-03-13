const {
  WS,
  WSs,
  NT,
  Conc,
  Xcep,
  Disj,
  Exp,
  Rule,
  EBNF
} = require('./rules')
const {
  MATCH,
  LITERAL,
  CONCAT,
  DISJUNCTION,
  OPTION,
  CLOSURE,
  REPETITION,
  EXCEPTION,
  EXPECT
} = require('./hoc')

const parser = module.exports.parser = (grammar) => {
  const grammarErrors = []
  const parsedGrammar = EBNF(grammar, 0, grammarErrors)
  if (grammarErrors.length) {
    throw new Error(grammarErrors.join('\n'), { grammar, parsedGrammar })
  }
  const [[_, ...ruleNodes], _2] = parsedGrammar
  const hash = ruleNodes.reduce((hash, [_2, head, body]) => {
    hash[head] = (input, index, errors) => {
      const ruleParser = createParserFromNode(body, hash)
      const [node, rest] = ruleParser(input, index, errors)
      return [[head, node], rest]
    }
    return hash
  }, {})
  return Object.keys(hash).reduce((parser, nt) => {
    parser[nt] = (input) => {
      const errors = []
      const result = hash[nt](input, 0, errors)
      if (!Array.isArray(result)) {
        throw new Error(`Unexpected error: invalid returned value. Please, report it to https://github.com/carlosvpi/parser/issues`, { result, hash, axiom, input })
      }
      const [tree, endIndex] = result
      if (errors.length) {
        throw new Error(errors.join('\n'), { rawTree, endIndex })
      } else if (endIndex < input.length) {
        throw new Error(`Input continues after end of parsing: ${input.slice(endIndex, endIndex + 50)}..., for a total of ${input.length - endIndex} characters` , { rawTree, endIndex })
      }
      return tree
    }
    return parser
  }, {})
}

const createParserFromNode = (node, hash) => {
  const [type, ...children] = node
  const manyRules = (ruleNode, index) => {
    const parser = createParserFromNode(ruleNode, hash)
    return index ? EXPECT(parser) : parser
  }
  switch (type) {
    case Exp.type:
      return DISJUNCTION(...children.map(v => createParserFromNode(v, hash)))
    case Disj.type:
      return EXCEPTION(createParserFromNode(children[0], hash), children[1] ? createParserFromNode(children[1], hash) : undefined)
    case Xcep.type:
      return CONCAT(...children.map(manyRules))
    case NT.type:
      return hash[children[0]]
    case Conc.type.Repetition:
      return REPETITION(children[0], createParserFromNode(children[1], hash))
    case Conc.type.DblQuote:
    case Conc.type.SglQuote:
      return LITERAL(children[0])
    case Conc.type.Regex:
      return MATCH(children[0])
    case Conc.type.Option:
      return OPTION(createParserFromNode(children[0], hash))
    case Conc.type.Closure:
      return CLOSURE(createParserFromNode(children[0], hash))
    case Conc.type.Group:
      return createParserFromNode(children[0], hash) // ADD STH TO IDENTIFY THAT THIS IS A GROUP
    case WS.type:
      return WS
    case WSs.type:
      return WSs
    default:
      throw new Error(`Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/parser/issues`, { type, children, hash })
  }
}
