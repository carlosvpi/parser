const MATCH = module.exports.MATCH = regex => (input, index) => {
  const match = input.slice(index).match(regex)
  if (!match || match.index !== 0) {
    return [[null], index]
  } else {
    return [[MATCH.type, ...match], index + match[0].length]
  }
}
MATCH.type = '$MATCH'

const LITERAL = module.exports.LITERAL = literal => (input, index) => {
  if (input.slice(index).indexOf(literal) === 0) {
    return [[LITERAL.type, literal], index + literal.length]
  }
  return [[null], index]
}
LITERAL.type = '$LITERAL'

const CONCAT = module.exports.CONCAT = (...rules) => (input, index, errors) => {
  let children, endIndex, root, result = [], recoveryMode = false
  const originalIndex = index
  for (let i = 0; i < rules.length; i++) {
    [[root, ...children], endIndex] = rules[i](input, index, recoveryMode ? [] : errors)
    if (root === null) {
      return [[null], originalIndex]
    } else {
      index = endIndex
      if (root === EXPECT.type) {
        recoveryMode = true
        i--
        index++
      } else {
        recoveryMode = false
        result.push([root, ...children])
      }
    }
  }
  return [[CONCAT.type, ...result], index]
}
CONCAT.type = '$CONCAT'

const DISJUNCTION = module.exports.DISJUNCTION = (...rules) => (input, index, errors) => {
  let node, endIndex, root
  for (let i = 0; i < rules.length; i++) {
    [[root, ...node], endIndex] = rules[i](input, index, errors)
    if (root !== null) {
      return [[root, ...node], endIndex]
    }
  }
  return [[null], index]
}

const OPTION = module.exports.OPTION = rule => (input, index, errors) => {
  const [[root, ...node], endIndex] = rule(input, index, errors)
  return node.length
    ? [[root, ...node], endIndex]
    : [[CONCAT.type], index]
}

const CLOSURE = module.exports.CLOSURE = rule => (input, index, errors) => {
  let [[root, ...node], endIndex] = rule(input, index, errors)
  let result = [], partial
  while (root) {
    result.push([root, ...node])
    partial = rule(input, endIndex, errors)
    root = partial[0][0]
    node = partial[0].slice(1)
    endIndex = partial[1]
  }
  return [[CONCAT.type, ...result], endIndex]
}

const REPETITION = module.exports.REPETITION = (times, rule) => (input, index, errors) => {
  let root, node, endIndex, result = []
  for (let i = 0; i < times; i++) {
    [[root, ...node], endIndex] = rule(input, index, errors)
    if (!node.length) {
      return [[null], index]
    }
    index = endIndex
    result.push([root, ...node])
  }
  return [[CONCAT.type, ...result], index]
}

const EXCEPTION = module.exports.EXCEPTION = (rule, exceptRule = () => [[null]]) => (input, index, errors) => {
  const [[root, ...node], endIndex] = rule(input, index, errors)
  const [[_, ...exceptNode]] = exceptRule(input, index)
  if (!root || exceptNode.length) {
    return [[null], index]
  }
  return [[root, ...node], endIndex]
}

const EXPECT = module.exports.EXPECT = (rule, expected) => (input, index, errors) => {
  const result = rule(input, index, errors)
  const [[root, ...node], endIndex] = result
  if (root === null) {
    const got = input.length <= endIndex
      ? 'end of input'
      : `'${input.slice(index, index + 40).split("\n").join("\\n")}...'`
    const lines = input.length <= endIndex
      ? input.split('\n')
      : input.slice(0, index).split('\n')
    const line = lines.length
    const col = lines[line - 1].length
    errors.push(`✘ ${line}:${col} | Expected '${expected}', got ${got}`)
    return input.length <= endIndex
      ? [[null], index]
      : [[EXPECT.type], index]
  }
  return result
}
EXPECT.type = '$EXPECT'