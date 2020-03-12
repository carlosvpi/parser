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
    throw new Error(grammarErrors.join('\n'), { grammar, parsedGrammar })
  }
  const [[_, ...ruleNodes], _2] = parsedGrammar
  const hash = ruleNodes.reduce((hash, [_2, head, body]) => {
    hash[head] = (...inputs) => {
      const ruleParser = createParserFromNode(body, hash)
      const [node, rest] = ruleParser(...inputs)
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
        throw new Error(`Unexpected error: invalid returned value. Please, report it to https://github.com/carlosvpi/pasre/issues`, { result, hash, axiom, input })
      }
      const [rawTree, rest] = result
      if (errors.length) {
        throw new Error(errors.join('\n'), { rawTree, rest })
      } else if (rest) {
        throw new Error(`Input continues after end of parsing: ${rest.slice(0, 50)}..., for a total of ${rest.length} characters` , { rawTree, rest })
      }
      // Transform tree nodeTypes from 'CONCAT' and such to 'MyRuleHead' and such
      const tree = restructureTree(rawTree)
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
  let x
  switch (type) {
    case Exp.type:
      x= (...inputs) => {
        const r = DISJUNCTION(...children.map(v => createParserFromNode(v, hash)))(...inputs)
        return r
      }
      break
    case Disj.type:
      x= (...inputs) => {
        const r = EXCEPTION(createParserFromNode(children[0], hash), children[1] ? createParserFromNode(children[1], hash) : undefined)(...inputs)
        return r
      }
      break
    case Xcep.type:
      x= (...inputs) => {
        const r = CONCAT(...children.map(manyRules))(...inputs)
        return r
      }
      break
    case NT.type:
      x= hash[children[0]]
      break
    case Conc.type.Repetition:
      x= REPETITION(children[0], createParserFromNode(children[1], hash))
      break
    case Conc.type.DblQuote:
    case Conc.type.SglQuote:
      x= LITERAL(children[0])
      break
    case Conc.type.Regex:
      x= (...inputs) => {
        const r = MATCH(children[0])(...inputs)
        return r
      }
      break
    case Conc.type.Option:
      x= (...inputs) => {
        const r = OPTION(createParserFromNode(children[0], hash))(...inputs)
        return r
      }
      break
    case Conc.type.Closure:
      x= (...inputs) => {
        const r = CLOSURE(createParserFromNode(children[0], hash))(...inputs)
        return r
      }
      break
    case Conc.type.Group:
      x= (...inputs) => {
        const r = createParserFromNode(children[0], hash)(...inputs) // ADD STH TO IDENTIFY THAT THIS IS A GROUP
        return r
      }
      break
    case WS.type:
      x= WS
      break
    case WSs.type:
      x= WSs
      break
    default:
      throw new Error(`Unexpected error: invalid node type. Please, report it to https://github.com/carlosvpi/pasre/issues`, { type, children, hash })
  }
  return x
}

const restructureTree = (x) => x
