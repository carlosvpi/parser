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
const { reformat } = require('./reformat')

const WS = module.exports.WS = (...inputs) => {
  const [node, rest] = DISJUNCTION(
    MATCH(/[\ \n\t]/),
    CONCAT(
      LITERAL('(*'),
      MATCH(/(?!(\*\)))*/),
      EXPECT(LITERAL('*)'), '*)')
    )
  )(...inputs)

  return [['WS', reformat(node, {
    DISJUNCTION: {
      MATCH: value => value,
      CONCAT: value => value.map(([root, node]) => node).join('')
    }
  })], rest]
}

const WSs = module.exports.WSs = (...inputs) => {
  const [node, rest] = CLOSURE(WS)(...inputs)

  return [['WSs', reformat(node, {
    CLOSURE: (values) => values.map(([_, value]) => value)
  })], rest]
}

const NT = module.exports.NT = (...inputs) => {
  const [node, rest] = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)(...inputs)

  return [['NT', reformat(node, {
    CONCAT: (values => values && values[0] && values[0][1]) || null
  })], rest]
}

// const debug = (x) => (input) => console.log(x, input) || ['', input]

const Conc = module.exports.Conc = (input, config = {}) => {
  const [node, rest] = DISJUNCTION(
    NT,
    CONCAT(
      MATCH(/[0-9]+/),
      WSs,
      EXPECT(LITERAL('*'), '*'),
      WSs,
      NT
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
      EXPECT(LITERAL('('), ')'),
      WSs
    ),
    CONCAT(
      LITERAL('?'),
      EXPECT(config.special || (x => x), 'special rule'),
      EXPECT(LITERAL('?'), '?'),
      WSs
    )
  )(input, config)

  return [['Conc', reformat(node, {
    DISJUNCTION: {
      NT: value => value,
      CONCAT: value => value.filter(([root]) => root !== 'WSs')
    }
  })], rest]
}

const Xcep = module.exports.Xcep = (...inputs) => CONCAT(Conc, CLOSURE(Conc))(...inputs)

const Disj = module.exports.Disj = (...inputs) => CONCAT(
  Xcep,
  OPTION(
    CONCAT(
      LITERAL('-'),
      WSs,
      EXPECT(Exp, 'Expression after "-"')
    )
  )
)(...inputs)

const Exp = module.exports.Exp = (...inputs) => CONCAT(
  Disj,
  CLOSURE(
    CONCAT(
      LITERAL('|'),
      WSs,
      EXPECT(Exp, 'Expression after "|"')
    )
  )
)(...inputs)

const Rule = module.exports.Rule = (...inputs) => CONCAT(
  NT,
  EXPECT(LITERAL('='), '='),
  WSs,
  EXPECT(Exp, 'Expression after "="'),
  EXPECT(LITERAL(';'), ';'),
  WSs
)(...inputs)

const EBNF = module.exports.EBNF = CLOSURE(Rule)
