const MATCH = module.exports.MATCH = regex => (input, index) => {
  const match = input.slice(index).match(regex)
  if (!match || match.index !== 0) {
    return expect(regex, input, index)
  } else {
    return [[MATCH.type, ...match], index + match[0].length, []]
  }
}
MATCH.type = '$MATCH'

const LITERAL = module.exports.LITERAL = literal => (input, index) => {
  if (input.slice(index).indexOf(literal) === 0) {
    return [[LITERAL.type, literal], index + literal.length, []]
  }
  return expect(literal, input, index)
}
LITERAL.type = '$LITERAL'

const CONCAT = module.exports.CONCAT = (...rules) => (input, index) => {
  let children, endIndex, root, result = [], errors = [], originalInput
  for (let i = 0; i < rules.length; i++) {
    [[root, ...children], endIndex, errors] = rules[i](input, index)

    if (root === null) {
      return [[null], index, errors]
    } else {
      index = endIndex
      result.push([root, ...children])
    }
  }
  return [[CONCAT.type, ...result], index, []]
}
CONCAT.type = '$CONCAT'

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => (input, index) => {
  let node, endIndex, root, errors = [], furthestResult = [index, []]
  for (let i = 0; i < rules.length; i++) {
    [[root, ...node], endIndex, errors] = rules[i](input, index)
    if (root !== null) {
      return [[root, ...node], endIndex, errors]
    } else if (furthestResult[0] <= endIndex) {
      furthestResult = [endIndex, errors]
    }
  }
  return [[null], ...furthestResult]
}

const OPTION = module.exports.OPTION = rule => (input, index) => {
  const [[root, ...node], endIndex, errors] = rule(input, index)
  return root !== null
    ? [[root, ...node], endIndex, errors]
    : [[CONCAT.type], index, []]
}

const CLOSURE = module.exports.CLOSURE = rule => (input, index) => {
  let [[root, ...node], endIndex] = rule(input, index)
  let result = [], partial
  while (root) {
    result.push([root, ...node])
    partial = rule(input, endIndex)
    root = partial[0][0]
    node = partial[0].slice(1)
    endIndex = partial[1]
  }
  return [[CONCAT.type, ...result], endIndex, []]
}

const REPETITION = module.exports.REPETITION = (times, rule) => (input, index) => {
  let root, node, endIndex, result = [], errors = []
  for (let i = 0; i < times; i++) {
    [[root, ...node], endIndex, errors] = rule(input, index)
    if (root === null) {
      return [[null], index, errors]
    }
    index = endIndex
    result.push([root, ...node])
  }
  return [[CONCAT.type, ...result], index, errors]
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null]]) => (input, index) => {
  const [[root, ...node], endIndex, errors] = rule(input, index)
  const [[exceptRoot]] = exceptRule(input, index)
  if (!root || exceptRoot) {
    return [[null], index, errors]
  }
  return [[root, ...node], endIndex, errors]
}

const expect = module.exports.expect = (expected, input, index, errors = []) => {
  const got = input.length <= index
    ? 'end of input'
    : `'${input.slice(index, index + 40).split("\n").join("\\n")}...'`
  const lines = input.length <= index
    ? input.split('\n')
    : input.slice(0, index).split('\n')
  const line = lines.length
  const col = lines[line - 1].length
  return [[null], index, [...errors, `✘ ${line}:${col} | Expected '${expected}', got ${got}`]]
}
