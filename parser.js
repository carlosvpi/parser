(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('./lib/parser')

},{"./lib/parser":3}],2:[function(require,module,exports){
const MATCH = module.exports.MATCH = regex => (input, index) => {
  const match = input.slice(index).match(regex)
  if (!match || match.index !== 0) {
    return [[null], index, []]
  } else {
    return [[MATCH.type, ...match], index + match[0].length, []]
  }
}
MATCH.type = '$MATCH'

const LITERAL = module.exports.LITERAL = literal => (input, index) => {
  if (input.slice(index).indexOf(literal) === 0) {
    return [[LITERAL.type, literal], index + literal.length, []]
  }
  return [[null], index, []]
}
LITERAL.type = '$LITERAL'

const CONCAT = module.exports.CONCAT = (...rules) => (input, index) => {
  let children, endIndex, root, result = [], itemErrors, errors = [], originalIndex = index
  for (let i = 0; i < rules.length; i++) {
    [[root, ...children], endIndex, itemErrors] = rules[i](input, index)

    errors.push(...itemErrors)
    if (root === null) {
      return [[null], originalIndex, errors]
    } else {
      index = endIndex
      result.push([root, ...children])
    }
  }
  return [[CONCAT.type, ...result], index, errors]
}
CONCAT.type = '$CONCAT'

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => (input, index) => {
  let node, endIndex, root, itemErrors, errors = []
  for (let i = 0; i < rules.length; i++) {
    [[root, ...node], endIndex, itemErrors] = rules[i](input, index)
    errors.push(...itemErrors)
    if (root !== null) {
      return [[root, ...node], endIndex, errors]
    }
  }
  return [[null], index, errors]
}

const OPTION = module.exports.OPTION = rule => (input, index) => {
  const [[root, ...node], endIndex, errors] = rule(input, index)
  return node.length
    ? [[root, ...node], endIndex, errors]
    : [[CONCAT.type], index, []]
}

const CLOSURE = module.exports.CLOSURE = rule => (input, index) => {
  let [[root, ...node], endIndex, errors] = rule(input, index)
  let result = [], partial
  while (root) {
    result.push([root, ...node])
    partial = rule(input, endIndex)
    root = partial[0][0]
    node = partial[0].slice(1)
    endIndex = partial[1]
    errors.push(...partial[2])
  }
  return [[CONCAT.type, ...result], endIndex, errors]
}

const REPETITION = module.exports.REPETITION = (times, rule) => (input, index) => {
  let root, node, endIndex, result = [], itemErrors, errors = []
  for (let i = 0; i < times; i++) {
    [[root, ...node], endIndex, itemErrors] = rule(input, index)
    errors.push(...itemErrors)
    if (root === null) {
      return [[null], index, errors]
    }
    index = endIndex
    result.push([root, ...node])
  }
  return [[CONCAT.type, ...result], index, errors]
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null]]) => (input, index) => {
  const [[root, ...node], endIndex, errors] = rule(input, index)
  const [[exceptRoot]] = exceptRule(input, index)
  if (!root || exceptRoot) {
    return [[null], index, errors]
  }
  return [[root, ...node], endIndex, errors]
}

const EXPECT = module.exports.EXPECT = (rule, expected) => (input, index) => {
  const result = rule(input, index)
  let [[root, ...node], endIndex, errors] = result
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
    let auxIndex = index, newErrors = []
    if (auxIndex < input.length) {
      do {
        [[root, ...node], endIndex, newErrors] = rule(input, ++auxIndex)
      } while(!root && auxIndex < input.length)
    }
    return [[root, ...node], endIndex, [...errors, ...newErrors]]
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
      return CONCAT(...children.map((ruleNode, index) => {
        const parser = createParserFromNode(ruleNode, hash)
        return index ? EXPECT(parser, `non-terminal ${ruleNode[1]}`) : parser
      }))
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

const WS = module.exports.WS = (input, index) => {
  const [[root, node], endIndex, errors] = MATCH(/([\ \n\t]|\(\*([^\*]|\*(?!\)))*\*\))/)(input, index)

  return root
    ? [[WS.type, node], endIndex, errors]
    : [[null], endIndex, errors]
}
WS.type = `$WS`

const WSs = module.exports.WSs = (input, index) => {
  const [_, endIndex, errors] = CLOSURE(WS)(input, index)

  return [[WSs.type], endIndex, errors]
}
WSs.type = `$WSs`

const NT = module.exports.NT = (input, index) => {
  const [[root, node], endIndex, errors] = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)(input, index)

  return node
    ? [[NT.type, node[1]], endIndex, errors]
    : [[null], index, errors]
}
NT.type = `$NT`

const Conc = module.exports.Conc = (input, index) => {
  const [[root, ...node], endIndex, errors] = DISJUNCTION(
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
  )(input, index)

  if (index === 527) {
    // debugger
  }

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

  return [result, endIndex, errors]
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

const Xcep = module.exports.Xcep = (input, index) => {
  const [[root, ...node], endIndex, errors] = CONCAT(Conc, CLOSURE(Conc))(input, index)

  return root !== null
    ? [[Xcep.type, ...(node ? [node[0], ...(node[1] ? node[1].slice(1) : [])] : [])], endIndex, errors]
    : [[null], endIndex, errors]
}
Xcep.type = `$Xcep`

const Disj = module.exports.Disj = (input, index) => {
  const [[root, ...node], endIndex, errors] = CONCAT(
    Xcep,
    OPTION(
      CONCAT(
        LITERAL('-'),
        WSs,
        EXPECT(Xcep, 'Expression after "-"')
      )
    )
  )(input, index)


  return root !== null
    ? [[Disj.type, ...[node[0], ...(node[1] && node[1][1] ? [node[1][3]] : [])]], endIndex, errors]
    : [[null], endIndex, errors]
}
Disj.type = `$Disj`

const Exp = module.exports.Exp = (input, index) => {
  const [[_, ...node], endIndex, errors] = CONCAT(
    Disj,
    CLOSURE(
      CONCAT(
        LITERAL('|'),
        WSs,
        EXPECT(Disj, 'Expression after "|"')
      )
    )
  )(input, index)

  return [[Exp.type, ...(node && [node[0], ...(node[1] && node[1] ? node[1].slice(1).map(item => item[3]) : [])])], endIndex, errors]
}
Exp.type = `$Exp`

const Rule = module.exports.Rule = (input, index) => {
  const [[_, ...node], endIndex, errors] = CONCAT(
    NT,
    EXPECT(LITERAL('='), '='),
    WSs,
    EXPECT(Exp, 'Body of the rule'),
    EXPECT(LITERAL(';'), ';'),
    WSs
  )(input, index)

  const head = (node && node[0] && node[0][1]) || null
  const body = (node && node[3]) || null

  return head && body
    ? [[Rule.type, head, body], endIndex, errors]
    : [[null], index, errors]
}
Rule.type = `$Rule`

const EBNF = module.exports.EBNF = (input, index) => {
  const [[_, ...node], endIndex, errors] = CONCAT(WSs, CLOSURE(Rule))(input, index)

  return [[EBNF.type, ...node[1].slice(1)], endIndex, errors]
}
EBNF.type = `$EBNF`

},{"./hoc":2}]},{},[1]);
