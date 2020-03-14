(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('./lib/parser')

},{"./lib/parser":3}],2:[function(require,module,exports){
const MATCH = module.exports.MATCH = regex => (input, index) => {
  const match = input.slice(index).match(regex)
  if (!match || match.index !== 0) {
    return [[null], index]
  } else {
    return [[MATCH.type, ...match], index + match[0].length]
  }
}
MATCH.type = '$MATCH'

const LITERAL = module.exports.LITERAL = literal => (input, index) => {
  if (input.slice(index).indexOf(literal) === 0) {
    return [[LITERAL.type, literal], index + literal.length]
  }
  return [[null], index]
}
LITERAL.type = '$LITERAL'

const CONCAT = module.exports.CONCAT = (...rules) => (input, index, errors) => {
  let children, endIndex, root, result = []
  const originalIndex = index
  for (let i = 0; i < rules.length; i++) {
    [[root, ...children], endIndex] = rules[i](input, index, errors)
    if (root === null) {
      return [[null], originalIndex]
    } else {
      index = endIndex
      result.push([root, ...children])
    }
  }
  return [[CONCAT.type, ...result], index]
}
CONCAT.type = '$CONCAT'

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => (input, index, errors) => {
  let node, endIndex, root
  for (let i = 0; i < rules.length; i++) {
    [[root, ...node], endIndex] = rules[i](input, index, errors)
    if (root !== null) {
      return [[root, ...node], endIndex]
    }
  }
  return [[null], index]
}

const OPTION = module.exports.OPTION = rule => (input, index, errors) => {
  const [[root, ...node], endIndex] = rule(input, index, errors)
  return node.length
    ? [[root, ...node], endIndex]
    : [[CONCAT.type], index]
}

const CLOSURE = module.exports.CLOSURE = rule => (input, index, errors) => {
  let [[root, ...node], endIndex] = rule(input, index, errors)
  let result = [], partial
  while (root) {
    result.push([root, ...node])
    partial = rule(input, endIndex, errors)
    root = partial[0][0]
    node = partial[0].slice(1)
    endIndex = partial[1]
  }
  return [[CONCAT.type, ...result], endIndex]
}

const REPETITION = module.exports.REPETITION = (times, rule) => (input, index, errors) => {
  let root, node, endIndex, result = []
  for (let i = 0; i < times; i++) {
    [[root, ...node], endIndex] = rule(input, index, errors)
    if (!node.length) {
      return [[null], index]
    }
    index = endIndex
    result.push([root, ...node])
  }
  return [[CONCAT.type, ...result], index]
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null]]) => (input, index, errors) => {
  const [[root, ...node], endIndex] = rule(input, index, errors)
  const [[_, ...exceptNode]] = exceptRule(input, index)
  if (!root || exceptNode.length) {
    return [[null], index]
  }
  return [[root, ...node], endIndex]
}

const EXPECT = module.exports.EXPECT = (rule, expected, recoveryRule = (x, index) => [[null], index]) => (input, index, errors) => {
  const result = rule(input, index, errors)
  const [[root, ...node], endIndex] = result
  if (root === null) {
    const got = input.length <= endIndex
      ? 'end of input'
      : `'${input.slice(index, index + 40).split("\n").join("\\n")}...'`
    const lines = input.length <= endIndex
      ? input.split('\n')
      : input.slice(0, index).split('\n')
    const line = lines.length
    const col = lines[line - 1].length
    errors.push(`✘ ${line}:${col} | Expected '${expected}', got ${got}`)
    return recoveryRule(input, index)
  }
  return result
}

},{}],3:[function(require,module,exports){
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

},{"./hoc":2,"./rules":4}],4:[function(require,module,exports){
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

const WS = module.exports.WS = (input, index, errors) => {
  const [[root, node], endIndex] = MATCH(/([\ \n\t]|\(\*([^\*]|\*(?!\)))*\*\))/)(input, index, errors)

  return root
    ? [[WS.type, node], endIndex]
    : [[null], endIndex]
}
WS.type = `$WS`

const WSs = module.exports.WSs = (input, index, errors) => {
  const [_, endIndex] = CLOSURE(WS)(input, index, errors)

  return [[WSs.type], endIndex]
}
WSs.type = `$WSs`

const NT = module.exports.NT = (input, index, errors) => {
  const [[root, node], endIndex] = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)(input, index, errors)

  return node
    ? [[NT.type, node[1]], endIndex]
    : [[null], index]
}
NT.type = `$NT`

const Conc = module.exports.Conc = (input, index, errors) => {
  const [[root, ...node], endIndex] = DISJUNCTION(
    NT,
    CONCAT(
      MATCH(/[0-9]+/),
      WSs,
      EXPECT(LITERAL('*'), '*'),
      WSs,
      EXPECT(NT, 'Non terminal')
    ),
    CONCAT(
      LITERAL('"'),
      MATCH(/([^\\"]|\\.)*/),
      EXPECT(LITERAL('"'), '"'),
      WSs
    ),
    CONCAT(
      LITERAL("'"),
      MATCH(/([^\\']|\\.)*/),
      EXPECT(LITERAL("'"), "'"),
      WSs
    ),
    CONCAT(
      LITERAL('/'),
      MATCH(/([^\\\/]|\\.)*/),
      EXPECT(LITERAL('/'), '/'),
      WSs
    ),
    CONCAT(
      LITERAL('['),
      WSs,
      Exp,
      EXPECT(LITERAL(']'), ']'),
      WSs
    ),
    CONCAT(
      LITERAL('{'),
      WSs,
      Exp,
      EXPECT(LITERAL('}'), '}'),
      WSs
    ),
    CONCAT(
      LITERAL('('),
      WSs,
      Exp,
      EXPECT(LITERAL(')'), ')'),
      WSs
    ),
    CONCAT(
      LITERAL('?'),
      MATCH(/([^\\\?]|\\\?)*/),
      EXPECT(LITERAL('?'), '?'),
      WSs
    )
  )(input, index, errors)


  const result = root === null ? [null]
    : root === NT.type ? [NT.type, ...node]
    : node[2][0] === LITERAL.type && node[2][1] === '*' ? [Conc.type.Repetition, node[0][1], node[4][1]]
    : node[0][0] === LITERAL.type && node[0][1] === '"' ? [Conc.type.DblQuote, node[1][1]]
    : node[0][0] === LITERAL.type && node[0][1] === "'" ? [Conc.type.SglQuote, node[1][1]]
    : node[0][0] === LITERAL.type && node[0][1] === '/' ? [Conc.type.Regex, node[1][1]]
    : node[0][0] === LITERAL.type && node[0][1] === '[' ? [Conc.type.Option, node[2]]
    : node[0][0] === LITERAL.type && node[0][1] === '{' ? [Conc.type.Closure, node[2]]
    : node[0][0] === LITERAL.type && node[0][1] === '(' ? [Conc.type.Group, node[2]]
    : [null]

  return [result, endIndex]
}
Conc.type = {
  Repetition: `$Repetition`,
  DblQuote: `$DblQuote`,
  SglQuote: `$SglQuote`,
  Regex: `$Regex`,
  Option: `$Option`,
  Closure: `$Closure`,
  Group: `$Group`
}

const Xcep = module.exports.Xcep = (input, index, errors) => {
  const [[root, ...node], endIndex] = CONCAT(Conc, CLOSURE(Conc))(input, index, errors)

  return root !== null
    ? [[Xcep.type, ...(node ? [node[0], ...(node[1] ? node[1].slice(1) : [])] : [])], endIndex]
    : [[null], endIndex]
}
Xcep.type = `$Xcep`

const Disj = module.exports.Disj = (input, index, errors) => {
  const [[root, ...node], endIndex] = CONCAT(
    Xcep,
    OPTION(
      CONCAT(
        LITERAL('-'),
        WSs,
        EXPECT(Xcep, 'Expression after "-"')
      )
    )
  )(input, index, errors)


  return root !== null
    ? [[Disj.type, ...[node[0], ...(node[1] && node[1][1] ? [node[1][3]] : [])]], endIndex]
    : [[null], endIndex]
}
Disj.type = `$Disj`

const Exp = module.exports.Exp = (input, index, errors) => {
  const [[_, ...node], endIndex] = CONCAT(
    Disj,
    CLOSURE(
      CONCAT(
        LITERAL('|'),
        WSs,
        EXPECT(Disj, 'Expression after "|"')
      )
    )
  )(input, index, errors)

  return [[Exp.type, ...(node && [node[0], ...(node[1] && node[1] ? node[1].slice(1).map(item => item[3]) : [])])], endIndex]
}
Exp.type = `$Exp`

const Rule = module.exports.Rule = (input, index, errors) => {
  const [[_, ...node], endIndex] = CONCAT(
    NT,
    EXPECT(LITERAL('='), '='),
    WSs,
    EXPECT(Exp, 'Expression after "="'),
    EXPECT(LITERAL(';'), ';'),
    WSs
  )(input, index, errors)

  const head = (node && node[0] && node[0][1]) || null
  const body = (node && node[3]) || null

  return head && body
    ? [[Rule.type, head, body], endIndex]
    : [[null], index]
}
Rule.type = `$Rule`

const EBNF = module.exports.EBNF = (input, index, errors) => {
  const [[_, ...node], endIndex] = CONCAT(WSs, CLOSURE(Rule))(input, index, errors)

  return [[EBNF.type, ...node[1].slice(1)], endIndex]
}
EBNF.type = `$EBNF`

},{"./hoc":2}]},{},[1]);
