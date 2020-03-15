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

const parser = module.exports = (grammar) => {
  const grammarErrors = []
  const parsedGrammar = EBNF(grammar, 0, grammarErrors)
  if (grammarErrors.length) {
    console.error(grammarErrors.join('\n'))
  }
  const [[_, ...ruleNodes], _2] = parsedGrammar
  const hash = ruleNodes.reduce((hash, [_2, head, body]) => {
    hash[head] = (input, index, errors) => {
      const ruleParser = createParserFromNode(body, hash)
      const [node, endIndex] = ruleParser(input, index, errors)
      return node[0] === null
        ? [[null], endIndex]
        : [[head, node], endIndex]
    }
    return hash
  }, {})
  return Object.keys(hash).reduce((parser, nt) => {
    parser[nt] = (input) => {
      const errors = []
      const result = hash[nt](input, 0, errors)
      if (!Array.isArray(result)) {
        console.error(`✘ Unexpected error: invalid returned value. Please, report it to https://github.com/carlosvpi/parser/issues`)
      }
      const [tree, endIndex] = result
      if (errors.length) {
        console.error(errors.join('\n'))
      } else if (endIndex < input.length) {
        console.error(`✘ Input continues after end of parsing: '${input.slice(endIndex, endIndex + 50).split("\n").join("\\n")}'..., for a total of ${input.length - endIndex} characters`)
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
    return index ? EXPECT(parser, ruleNode[1]) : parser
  }
  switch (type) {
    case Exp.type:
      return DISJUNCTION(...children.map(v => createParserFromNode(v, hash)))
    case Disj.type:
      return EXCEPTION(createParserFromNode(children[0], hash), children[1] ? createParserFromNode(children[1], hash) : undefined)
    case Xcep.type:
      return CONCAT(...children.map(manyRules))
    case NT.type:
      return (input, index, errors) => {
        if (typeof hash[children[0]] !== 'function') {
          errors.push(`✘ Undefined nonterminal '${children[0]}'`)
          return [[null], index]
        }
        return hash[children[0]](input, index, errors)
      }
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
      console.error(`✘ Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/parser/issues`)
  }
}
