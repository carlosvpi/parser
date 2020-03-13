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
  const [[root], endIndex] = MATCH(/([\ \n\t]|\(\*.*\*\))/)(input, index, errors)

  return root
    ? [[WS.type], endIndex]
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
      MATCH(/[^\?]*/),
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
