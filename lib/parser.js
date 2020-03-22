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
  const [[_, ...ruleNodes], _2, grammarErrors] = EBNF(grammar, 0)
  if (grammarErrors.length) {
    throw new Error(grammarErrors.join('\n'))
  }
  const hash = ruleNodes.reduce((hash, [_2, head, body]) => {
    hash[head] = (input, index = 0) => {
      const ruleParser = createParserFromNode(body, hash)
      const [node, endIndex, errors] = ruleParser(input, index)
      return node[0]
        ? [[head, node], endIndex, errors]
        : [[null], endIndex, errors]
    }
    return hash
  }, {})

  return hash
}

const createParserFromNode = (node, hash) => {
  const [type, ...children] = node
  switch (type) {
    case Exp.type:
      return DISJUNCTION(...children.map(v => createParserFromNode(v, hash)))
    case Disj.type:
      return EXCEPTION(createParserFromNode(children[0], hash), children[1] ? createParserFromNode(children[1], hash) : undefined)
    case Xcep.type:
      return CONCAT(...children.map(ruleNode => createParserFromNode(ruleNode, hash)))
    case NT.type:
      return (input, index) => {
        if (typeof hash[children[0]] !== 'function') {
          return [[null], index, [`✘ Undefined non-terminal '${children[0]}'`]]
        }
        return hash[children[0]](input, index)
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
      return createParserFromNode(children[0], hash)
    case WS.type:
      return WS
    case WSs.type:
      return WSs
    default:
      (input, index) => [[null], index, `✘ Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/parser/issues`]
  }
}
