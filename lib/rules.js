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
  const [[_, node], rest] = MATCH(/([\ \n\t]|\(\*.*\*\))/)(...inputs)

  return node
    ? [['WS', true], rest]
    : [[null], rest]
}
WS.ruleName = `WS`

const WSs = module.exports.WSs = (...inputs) => {
  const [[_, node], rest] = CLOSURE(WS)(...inputs)

  return [['WSs', true], rest]
}
WSs.ruleName = `WSs`

const NT = module.exports.NT = (...inputs) => {
  const [[_, node], rest] = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)(...inputs)

  return node && node[0]
    ? [['NT', node && node[0] && node[0][1]], rest]
    : [[null], rest]
}
NT.ruleName = `NT`

const Conc = module.exports.Conc = (input, config = {}) => {
  const [[root, node], rest] = DISJUNCTION(
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
  // console.log('End')
  // console.groupEnd()

  const result = root === null ? [null]
    : root === 'NT' ? ['NT', node]
    : node[2][0] === 'LITERAL' && node[2][1] === '*' ? ['Repetition', [node[0][1], node[4][1]]]
    : node[0][0] === 'LITERAL' && node[0][1] === '"' ? ['DblQuote', node[1][1]]
    : node[0][0] === 'LITERAL' && node[0][1] === "'" ? ['SglQuote', node[1][1]]
    : node[0][0] === 'LITERAL' && node[0][1] === '/' ? ['Regex', node[1][1]]
    : node[0][0] === 'LITERAL' && node[0][1] === '[' ? ['Option', node[2]]
    : node[0][0] === 'LITERAL' && node[0][1] === '{' ? ['Closure', node[2]]
    : node[0][0] === 'LITERAL' && node[0][1] === '(' ? ['Group', node[2]]
    : [null]

  return [result, rest]
}
Conc.ruleName = `Conc`

const Xcep = module.exports.Xcep = (...inputs) => {
  const [[root, node], rest] = CONCAT(Conc, CLOSURE(Conc))(...inputs)

  return root !== null
    ? [['Concatenation', node && [node[0], ...node[1][1]]], rest]
    : [[null], rest]
}
Xcep.ruleName = `Xcep`

const Disj = module.exports.Disj = (...inputs) => {
  const [[root, node], rest] = CONCAT(
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
    ? [['Exception', [node[0], (node[1] && node[1][1] && node[1][1][2]) || null]], rest]
    : [[null], rest]
}
Disj.ruleName = `Disj`

const Exp = module.exports.Exp = (...inputs) => {
  const [[_, node], rest] = CONCAT(
    Disj,
    CLOSURE(
      CONCAT(
        LITERAL('|'),
        WSs,
        EXPECT(Disj, 'Expression after "|"')
      )
    )
  )(...inputs)

  return [['Disjunction', node && [node[0], ...((node && node[1] && node[1][1] && node[1][1].map(item => item && item[1] && item[1][2])) || [])]], rest]
}
Exp.ruleName = `Exp`

const Rule = module.exports.Rule = (...inputs) => {
  const [[_, node], rest] = CONCAT(
    NT,
    EXPECT(LITERAL('='), '='),
    WSs,
    EXPECT(Exp, 'Expression after "="'),
    EXPECT(LITERAL(';'), ';'),
    WSs
  )(...inputs)

  return [['Rule', node ? [['Head', node[0][1]], ['Body', node[3]]] : null], rest]
}
Rule.ruleName = `Rule`

const EBNF = module.exports.EBNF = (...inputs) => {
  const [[_, node], rest] = CONCAT(WSs, CLOSURE(Rule))(...inputs)

  return [['EBNF', node[1][1]], rest]
}
EBNF.ruleName = `EBNF`
