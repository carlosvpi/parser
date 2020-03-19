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
