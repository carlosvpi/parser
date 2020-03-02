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

  return [['WS', node ? true : null], rest]
}

const WSs = module.exports.WSs = (...inputs) => {
  const [[_, node], rest] = CLOSURE(WS)(...inputs)

  return [['WSs', true], rest]
}

const NT = module.exports.NT = (...inputs) => {
  const [[_, node], rest] = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)(...inputs)

  return [['NT', node && node[0] && node[0][1]], rest]
}

// const debug = (x) => (input) => console.log(x, input) || ['', input]

const Conc = module.exports.Conc = (input, config = {}) => {
  const [[_, node], rest] = DISJUNCTION(
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

  const result = node === null ? ['Expression', null]
    : node[0] === 'NT' ? ['NT', node[1]]
    : node[1][2][0] === 'LITERAL' && node[1][2][1] === '*' ? ['Repetition', [node[1][0][1], node[1][4][1]]]
    : node[1][0][0] === 'LITERAL' && node[1][0][1] === '"' ? ['DblQuote', node[1][1][1]]
    : node[1][0][0] === 'LITERAL' && node[1][0][1] === "'" ? ['SglQuote', node[1][1][1]]
    : node[1][0][0] === 'LITERAL' && node[1][0][1] === '/' ? ['Regex', node[1][1][1]]
    : node[1][0][0] === 'LITERAL' && node[1][0][1] === '[' ? ['Option', node[1][2]]
    : node[1][0][0] === 'LITERAL' && node[1][0][1] === '{' ? ['Closure', node[1][2]]
    : node[1][0][0] === 'LITERAL' && node[1][0][1] === '(' ? ['Group', node[1][2]]
    : [null, null]

  return [result, rest]
}

const Xcep = module.exports.Xcep = (...inputs) => {
  const [[_, node], rest] = CONCAT(Conc, CLOSURE(Conc))(...inputs)

  return [['Concatenation', node && [node[0], ...node[1][1]]], rest]
}

const Disj = module.exports.Disj = (...inputs) => {
  const [[_, node], rest] = CONCAT(
    Xcep,
    OPTION(
      CONCAT(
        LITERAL('-'),
        WSs,
        EXPECT(Xcep, 'Expression after "-"')
      )
    )
  )(...inputs)

  return [['Exception', node ? [['Positive', node[0]], ['Negative', (node[1] && node[1][1] && node[1][1][1] && node[1][1][1][2]) || null]] : null], rest]
}

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

const EBNF = module.exports.EBNF = (...inputs) => {
  const [[_, node], rest] = CONCAT(WSs, CLOSURE(Rule))(...inputs)

  return [['EBNF', node[1][1]], rest]
}
