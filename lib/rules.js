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

const WS = module.exports.WS = DISJUNCTION(
  MATCH(/[\ \n\t]/),
  CONCAT(
    LITERAL('(*'),
    MATCH(/(?!(\*\)))*/),
    EXPECT(LITERAL('*)'), '*)')
  )
)

const WSs = module.exports.WSs = CLOSURE(WS)

const NT = module.exports.NT = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)

// const debug = (x) => (input) => console.log(x, input) || ['', input]

const Conc = module.exports.Conc = (input, config = {}) => DISJUNCTION(
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