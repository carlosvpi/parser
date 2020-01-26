const reformat = module.exports.reformat = (node, hash) => {
	// console.log(node, hash)
	if (hash && hash.__proto__ === Function.prototype) {
		return hash(node)
	} else if (!hash || node === null) {
		return null
	} else {
		const [root, child] = node
		return reformat(child, hash[root])
	}
}
