const fs = require('fs')
const md5 = require('md5')

//parsing
const path = process.argv[2]
if (!path) {
	console.log('missing input file');
	process.exit(1)
}
let file = ''
try {
	file = fs.readFileSync(path).toString()
} catch (e) {
	console.log(`could not open file at path: ${path}`)
	process.exit(1)
}

function formatError() {
	console.log('please format your input file this way:\n"[salt],[iterator]"\nWhere salt is a string and iterator is a number')
	process.exit(1)
}

const commaIndex = file.indexOf(',')

if (commaIndex == -1) formatError()

//extracting salt and iterator
const salt = file.substr(0, commaIndex)
let iterator = file.substr(commaIndex + 1, file.length - commaIndex - 1)

if (!salt || isNaN(iterator)) formatError()

iterator = Number(iterator)
console.log('salt:', salt, '\niterator:', iterator)

let zeroString = ''
while (zeroString.length < iterator)
	zeroString += '0'

var output = [...'..........']
let i = 0
charFound = 0

// looping ➰➰➰
while (charFound < 10) {
	hash = md5(`${salt}${iterator + i}`)
	if (hash.startsWith(zeroString) && !isNaN(hash[4]) && output[hash[4]] == '.') {
		e = ((iterator + i) % 32)
		output[hash[4]] = hash[e]
		charFound++
		const tmpOutput = output.join('')
		console.log(tmpOutput)
	}
	i++
}

// writing answer to file
const response = output.join('')
try{
	fs.writeFileSync(`${path}.answer`, response)
} catch (e) {
	console.log(`could not write file at path: ${path}.answer`)
	process.exit(1)
}
