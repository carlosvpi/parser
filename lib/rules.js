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

module.exports.WS = DISJUNCTION(
  MATCH(/[\ \n\t]/),
  CONCAT(
    LITERAL('(*'),
    MATCH(/(?!(\*\)))*/),
    EXPECT(LITERAL('*)'), '*)')
  )
)

// module.exports.WSs = CLOSURE(WS)

// module.exports.NT = CONCAT(MATCH(/[a-zA-Z_][a-zA-Z0-9_]*/), WSs)

// module.exports.Conc = (input, config) => DISJUNCTION(
//   CONCAT(
//     MATCH(/[0-9]+/),
//     WSs,
//     REQUIRE(EXPECT('*'), LITERAL('*')),
//     WSs,
//     NT
//   ),
//   NT,
//   CONCAT(
//     LITERAL('"'),
//     MATCH(/[^\"]/),
//     REQUIRE(EXPECT('"'), LITERAL('"')),
//     WSs
//   ),
//   CONCAT(
//     LITERAL("'"),
//     MATCH(/[^\']/),
//     REQUIRE(EXPECT("'"), LITERAL("'")),
//     WSs
//   ),
//   CONCAT(
//     LITERAL('/'),
//     MATCH(/[^\/]/),
//     REQUIRE(EXPECT('/'), LITERAL('/')),
//     WSs
//   ),
//   CONCAT(
//     LITERAL('['),
//     WSs,
//     Exp,
//     REQUIRE(EXPECT(']'), LITERAL(']')),
//     WSs
//   ),
//   CONCAT(
//     LITERAL('{'),
//     WSs,
//     Exp,
//     REQUIRE(EXPECT('}'), LITERAL('}')),
//     WSs
//   ),
//   CONCAT(
//     LITERAL('('),
//     WSs,
//     Exp,
//     REQUIRE(EXPECT('('), LITERAL(')')),
//     WSs
//   ),
//   CONCAT(
//     LITERAL('?'),
//     config.special || (x => x),
//     REQUIRE(EXPECT('?'), LITERAL('?')),
//     WSs
//   )
// )(input, config)

// module.exports.Xcep = CONCAT(Conc, CLOSURE(Conc))

// module.exports.Disj = CONCAT(
//   Xcep,
//   OPTION(
//     CONCAT(
//       LITERAL('-'),
//       WSs,
//       REQUIRE(EXPECT('Expression after "-"'), Xcep)
//     )
//   )
// )

// module.exports.Exp = CONCAT(
//   Disj,
//   CLOSURE(
//     CONCAT(
//       LITERAL('|'),
//       WSs,
//       REQUIRE(EXPECT('Expression after "|"'), Disj)
//     )
//   )
// )

// module.exports.Rule = CONCAT(
//   NT,
//   REQUIRE(EXPECT('='), LITERAL('=')),
//   WSs,
//   REQUIRE(EXPECT('Expression after "="'), Exp),
//   REQUIRE(EXPECT(';'), LITERAL(';')),
//   WSs
// )

// module.exports.EBNF = CLOSURE(Rule)