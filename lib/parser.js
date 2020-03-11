const {
  getRoot,
  getChildren,
  depthRun,
  breadthRun,
  reduce
} = require('./tree')
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

const parser = module.exports.parser = (grammar, config = {}) => {
  const grammarErrors = []
  const parsedGrammar = EBNF(grammar, { original: grammar, grammarErrors, ...config })
  if (grammarErrors.length) {
    throw new Error({ errors: grammarErrors, payload: { grammar, parsedGrammar } })
  }
  const [[_, ruleNodes], _2] = parsedGrammar
  const hash = ruleNodes.reduce((hash, [_2, [[_3, head], [_4, body]]]) => {
    hash[head] = (...inputs) => {
      const [node, rest] = createParserFromNode(body, hash)(...inputs)
      return [[head, node], rest]
    }
    hash[head].ruleName = `<${head}>`
    return hash
  }, {})
  return Object.keys(hash).reduce((parser, nt) => {
    parser[nt] = (input, configs = {}) => {
      const errors = []
      const result = hash[nt](input, { original: input, errors, ...configs})
      if (!Array.isArray(result)) {
        throw new Error({ errors: [`Unexpected error: invalid returned value. Please, report it to https://github.com/carlosvpi/pasre/issues`], payload: { result, hash, axiom, input } })
      }
      const [rawTree, rest] = result
      if (errors.length) {
        throw new Error({ errors, payload: { rawTree, rest } })
      } else if (rest) {
        throw new Error({ errors: [`Input continues after end of parsing`] , payload: { rawTree, rest } })
      }
      // Transform tree nodeTypes from 'CONCAT' and such to 'MyRuleHead' and such
      const tree = restructureTree(rawTree)
      return tree
    }
    return parser
  }, {})
}

const createParserFromNode = (node, hash) => {
  const [type, value] = node
  const manyRules = (ruleNode, index) => {
    const parser = createParserFromNode(ruleNode, hash)
    return index ? EXPECT(parser) : parser
  }
  switch (type) {
    case Exp.type:
      return DISJUNCTION(...value.map(v => createParserFromNode(v, hash)))
    case Disj.type:
      return EXCEPTION(createParserFromNode(value[0], hash), value[1] ? createParserFromNode(value[1], hash) : undefined)
    case Xcep.type:
      return CONCAT(...value.map(manyRules))
    case NT.type:
      return hash[value]
    case Conc.type.Repetition:
      return REPETITION(value[0], createParserFromNode(value[1], hash))
    case Conc.type.DblQuote:
    case Conc.type.SglQuote:
      return LITERAL(value)
    case Conc.type.Regex:
      return MATCH(value)
    case Conc.type.Option:
      return OPTION(createParserFromNode(value, hash))
    case Conc.type.Closure:
      return CLOSURE(createParserFromNode(value, hash))
    case Conc.type.Group:
      return createParserFromNode(value, hash) // ADD STH TO IDENTIFY THAT THIS IS A GROUP
    case WS.type:
      return WS
    case WSs.type:
      return WSs
    default:
      throw new Error({ errors: [`Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/pasre/issues`], payload: { type, value, hash } })
  }
}

const restructureTree = (x) => x
