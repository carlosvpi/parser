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
  // console.group('WS')
  const [[root], rest] = MATCH(/([\ \n\t]|\(\*.*\*\))/)(...inputs)
  // console.log(root, rest)
  // console.log('------------')
  // console.groupEnd()

  return root
    ? [[WS.type], rest]
    : [[null], rest]
}
WS.type = `$WS`

const WSs = module.exports.WSs = (...inputs) => {
  // console.group('WSs')
  const [_, rest] = CLOSURE(WS)(...inputs)

  // console.log(_, rest)
  // console.log('------------')
  // console.groupEnd('------------')

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

  // console.group('Conc')
  // console.log(root, node)
  // console.log('---------')
  // console.groupEnd()

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

  // console.group('Xcep')
  // console.log(node)
  // console.log([[Xcep.type, ...(node ? [node[0], ...(node[1] ? node[1].slice(1) : [])] : [])], rest])
  // console.log('-------------')
  // console.groupEnd()

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

  // console.group('Disj')
  // console.log(node)
  // console.log(...[node[0], ...(node[1] && node[1] ? [node[1][3]] : [])])
  // console.log('-----------')
  // console.groupEnd()

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

  // console.group('Exp')
  // console.log(node)
  // console.log(node[1] && node[1].slice(1).map(item => item[3]))
  // console.log('-------------')
  // console.groupEnd()
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
  // console.group('Rule')
  // console.log(node)
  // console.log('-------------')
  // console.groupEnd()

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
