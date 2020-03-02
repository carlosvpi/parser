require('./lib/hoc.test')
require('./lib/rules.test')
require('./lib/tree.test')
require('./lib/parser.test')


// const traverser = getTraverser({
// 	S: (a, b) => a + b,
// 	A: (a, b, c) => a + b + c
// }, {
// 	S: (a, b) => [b, a]
// })
// const parser = getParser(`
// 	S = A ("b" | "c");
// 	A = "a" "b" ("c" | S);
// 	`)
// const tree = parser("ababcc")
// const value = traverser(tree)
// // value = cababc ?