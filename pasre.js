(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
  pasre: require('./lib/parser'),
  getTraverser: require('./lib/traverse')
}
},{"./lib/parser":3,"./lib/traverse":5}],2:[function(require,module,exports){
const MATCH = module.exports.MATCH = regex => {
  const resultRule = (input, ...configs) => {
    const match = input.match(regex)
    if (!match || match.index !== 0) {
      return [[null], input]
    } else {
      return [[MATCH.type, match[0]], input.slice(match[0].length)]
    }
  }
  return resultRule
}
MATCH.type = '$MATCH'

const LITERAL = module.exports.LITERAL = literal => {
  const resultRule = (input, ...configs) => {
    if (input.indexOf(literal) === 0) {
      return [[LITERAL.type, literal], input.slice(literal.length)]
    }
    return [[null], input]
  }
  return resultRule
}
LITERAL.type = '$LITERAL'

const CONCAT = module.exports.CONCAT = (...rules) => {
  const resultRule = (input, ...configs) => {
    let children, rest, root, result = []
    const originalInput = input
    for (let i = 0; i < rules.length; i++) {
      [[root, ...children], rest] = rules[i](input, ...configs)
      if (root === null) {
        return [[null], originalInput]
      } else {
        input = rest
        result.push([root, ...children])
      }
    }
    return [[CONCAT.type, ...result], input]
  }
  return resultRule
}
CONCAT.type = '$CONCAT'

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => {
  const resultRule = (input, ...configs) => {
    let node, rest, root
    for (let i = 0; i < rules.length; i++) {
      [[root, ...node], rest] = rules[i](input, ...configs)
      if (root !== null) {
        return [[root, ...node], rest]
      }
    }
    return [[null], input]
  }
  return resultRule
}

const OPTION = module.exports.OPTION = rule => {
  const resultRule = (input, ...configs) => {
    const [[root, ...node], rest] = rule(input, ...configs)
    return node.length
      ? [[root, ...node], rest]
      : [[CONCAT.type], input]
  }
  return resultRule
}

const CLOSURE = module.exports.CLOSURE = rule => {
  const resultRule = (input, ...configs) => {
    let [[root, ...node], rest] = rule(input, ...configs)
    let result = [], partial
    while (root) {
      result.push([root, ...node])
      partial = rule(rest, ...configs)
      root = partial[0][0]
      node = partial[0].slice(1)
      rest = partial[1]
    }
    return [[CONCAT.type, ...result], rest]
  }
  return resultRule
}

const REPETITION = module.exports.REPETITION = (times, rule) => {
  const resultRule = (input, ...configs) => {
    let root, node, rest, result = []
    for (let i = 0; i < times; i++) {
      [[root, ...node], rest] = rule(input, ...configs)
      if (!node.length) {
        return [[null], input]
      }
      input = rest
      result.push([root, ...node])
    }
    return [[CONCAT.type, ...result], input]
  }
  return resultRule
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null]]) => {
  const resultRule = (input, ...configs) => {
    const [[root, ...node], rest] = rule(input, ...configs)
    const [[_, ...exceptNode]] = exceptRule(input, ...configs)
    if (!root || exceptNode.length) {
      return [[null], input]
    }
    return [[root, ...node], rest]
  }
  return resultRule
}

const EXPECT = module.exports.EXPECT = (rule, expected, recoveryRule = (x) => [[null], x]) => {
  const resultRule = (input, { original = input, errors = [], ...configs}) => {
    const result = rule(input, { original, errors, ...configs })
    if (result[0][0] === null) {
      const got = input === ''
        ? 'end of input'
        : `'${input.slice(0, 20).split("\n").join("\\n")}...'`
      const lines = input === ''
        ? original.split('\n')
        : original.slice(0, original.indexOf(input)).split('\n')
      const line = lines.length
      const col = lines[line - 1].length
      errors.push(`✘ ${line}:${col} | Expected '${expected}', got ${got}`)
      return recoveryRule(input)
    }
    return result
  }
  return resultRule
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

const WS = module.exports.WS = (...inputs) => {
  const [[root], rest] = MATCH(/([\ \n\t]|\(\*.*\*\))/)(...inputs)

  return root
    ? [[WS.type], rest]
    : [[null], rest]
}
WS.type = `$WS`

const WSs = module.exports.WSs = (...inputs) => {
  const [_, rest] = CLOSURE(WS)(...inputs)


  return [[WSs.type], rest]
}
WSs.type = `$WSs`

const NT = module.exports.NT = (...inputs) => {
  const [[root, node], rest] = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)(...inputs)

  return node
    ? [[NT.type, node[1]], rest]
    : [[null], rest]
}
NT.type = `$NT`

const Conc = module.exports.Conc = (input, config = {}) => {
  const [[root, ...node], rest] = DISJUNCTION(
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
      MATCH(/[^\"]*/),
      EXPECT(LITERAL('"'), '"'),
      WSs
    ),
    CONCAT(
      LITERAL("'"),
      MATCH(/[^\']*/),
      EXPECT(LITERAL("'"), "'"),
      WSs
    ),
    CONCAT(
      LITERAL('/'),
      MATCH(/[^\/]*/),
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
      EXPECT(config.special || (x => x), 'special rule'),
      EXPECT(LITERAL('?'), '?'),
      WSs
    )
  )(input, config)


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

  return [result, rest]
}
Conc.type = {}
Conc.type.Repetition = `$Repetition`
Conc.type.DblQuote = `$DblQuote`
Conc.type.SglQuote = `$SglQuote`
Conc.type.Regex = `$Regex`
Conc.type.Option = `$Option`
Conc.type.Closure = `$Closure`
Conc.type.Group = `$Group`

const Xcep = module.exports.Xcep = (...inputs) => {
  const [[root, ...node], rest] = CONCAT(Conc, CLOSURE(Conc))(...inputs)


  return root !== null
    ? [[Xcep.type, ...(node ? [node[0], ...(node[1] ? node[1].slice(1) : [])] : [])], rest]
    : [[null], rest]
}
Xcep.type = `$Xcep`

const Disj = module.exports.Disj = (...inputs) => {
  const [[root, ...node], rest] = CONCAT(
    Xcep,
    OPTION(
      CONCAT(
        LITERAL('-'),
        WSs,
        EXPECT(Xcep, 'Expression after "-"')
      )
    )
  )(...inputs)


  return root !== null
    ? [[Disj.type, ...[node[0], ...(node[1] && node[1][1] ? [node[1][3]] : [])]], rest]
    : [[null], rest]
}
Disj.type = `$Disj`

const Exp = module.exports.Exp = (...inputs) => {
  const [[_, ...node], rest] = CONCAT(
    Disj,
    CLOSURE(
      CONCAT(
        LITERAL('|'),
        WSs,
        EXPECT(Disj, 'Expression after "|"')
      )
    )
  )(...inputs)

  return [[Exp.type, ...(node && [node[0], ...(node[1] && node[1] ? node[1].slice(1).map(item => item[3]) : [])])], rest]
}
Exp.type = `$Exp`

const Rule = module.exports.Rule = (...inputs) => {
  const [[_, ...node], rest] = CONCAT(
    NT,
    EXPECT(LITERAL('='), '='),
    WSs,
    EXPECT(Exp, 'Expression after "="'),
    EXPECT(LITERAL(';'), ';'),
    WSs
  )(...inputs)

  const head = (node && node[0] && node[0][1]) || null
  const body = (node && node[3]) || null

  return head && body
    ? [[Rule.type, head, body], rest]
    : [[null], rest]
}
Rule.type = `$Rule`

const EBNF = module.exports.EBNF = (...inputs) => {
  const [[_, ...node], rest] = CONCAT(WSs, CLOSURE(Rule))(...inputs)

  return [[EBNF.type, ...node[1].slice(1)], rest]
}
EBNF.type = `$EBNF`

},{"./hoc":2}],5:[function(require,module,exports){
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

const generalBubble = {
	[MATCH.type]: (_, node) => [node],
	[LITERAL.type]: (_, node) => [node],
	[CONCAT.type]: (...nodes) => nodes
		.reduce((acc, node) => Array.isArray(node) ? [...acc, ...node] : [...acc, node], [])
}

const getTraverser = module.exports.getTraverser = (userBubble = {}, capture = {}) => {
	const bubble = {
		...generalBubble,
		...userBubble
	}
	let i = 0
	const traverseFromNode = ([root, ...children]) => {
		let j = i++
		if (getTraverser.valueTypes.includes(root)) {
			return children
		}
		const capturedChildren = typeof capture[root] === 'function'
			? capture[root](...children)
			: children
		const traversedChildren = capturedChildren.map(traverseFromNode)
		const result = typeof bubble[root] === 'function'
			? bubble[root](...traversedChildren)
			: []
		return result
	}
	return traverseFromNode
}

getTraverser.valueTypes = [MATCH.type, LITERAL.type]

},{"./hoc":2,"./rules":4}]},{},[1]);
