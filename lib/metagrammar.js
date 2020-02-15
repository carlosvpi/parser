const { EBNF } = require('./rules')
const metagrammar = `WS     = /[\ \n\t]/
   | '(*' NoCloseComment '*)';
WSs    = { WS };
NT     = /[a-zA-Z_][a-zA-Z0-9_]*/;
Rule   = NT '=' WSs Exp ';' WSs;
Exp    = Disj { '|' WSs Disj };
Disj   = Xcep ['-' WSs Xcep];
Xcep   = Conc { Conc };
Conc   = /[0-9]+/ WSs '*' WSs NT
   | NT
   | '"' NoDblQuote '"' WSs
   | "'" NoSglQuote "'" WSs
   | '/' NoSlash '/' WSs
   | '[' Exp ']' WSs
   | '{' Exp '}' WSs
   | '(' Exp ')' WSs
   | '?' NoQuestion '?' WSs;`

const meta = module.exports.meta = (config = {}) => {
	const errors = []
   const ebnf = EBNF(metagrammar, { original: metagrammar, errors, ...config })
	console.log(ebnf)
   return ebnf
}

console.log(meta())