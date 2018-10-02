const fs = require('fs')

// parsing
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

const dictPath = './input/dict.txt'
if (!dictPath) {
	console.log('missing dict file');
	process.exit(1)
}
let dict = ''
try {
	dict = fs.readFileSync(dictPath).toString()
} catch (e) {
	console.log(`could not open dict at path: ${dictPath}`)
	process.exit(1)
}

dict = dict.split('\n')

const scoreTable = [
	{
		letters: 'eaionrtlsu',
		score: 1
	},{
		letters: 'dg',
		score: 2
	},{
		letters: 'bcmp',
		score: 3
	},{
		letters: 'fhvwy',
		score: 4
	},{
		letters: 'k',
		score: 5
	},{
		letters: 'jx',
		score: 8
	},{
		letters: 'qz',
		score: 10
	}
]

// returns the word's score according to the above score table
function scoreOfWord(word) {
	let score = [...word].map(char => scoreTable.find(st => st.letters.includes(char)).score)
	return score.reduce((a, b) => a + b)
}

let board = []
let rotatedBoard = []
let myLetters = ''

// filling the above 3 variables
// the rotated board is a 90 degres turn from the original board.
// it is used so I can shamelessly copy-paste the same code for horizontal and vertical moves
function parseBoard() {
	board = file.split('\n')
	myLetters = board[board.length - 1]
	board = board.slice(0, board.length - 1)
	if (!board.every(stripe => stripe.match(/^[a-z-]{15}$/)) || !board.length == 15 || !myLetters.match(/^[a-z]{7}$/))
		throw "format error"
	rotatedBoard = board.map((stripe, line) => {
		return [...stripe].map((char, col) => board[col][line]).join('')
	})
}

try {
	parseBoard()
} catch (e) {
	console.log(e)
	process.exit(1)
}

// the dict is probably filled with useless words that use letters that cannot be used.
// for the example, it reduces the dict from 178691 to 42655 entries
let lettersOnBoard = [...board.join('')].filter(char => char.match(/[a-z]/))
lettersOnBoard = lettersOnBoard.filter((char, i) => !lettersOnBoard.slice(0, i).find(c => c == char))
let availableLetters = lettersOnBoard.concat([...myLetters])
availableLetters = availableLetters.filter((char, i) => !availableLetters.slice(0, i).find(c => c == char))

let availableWords = dict.filter(word => word.match(new RegExp(`^[${availableLetters.join('')}]+$`)))


// this function rates a move and returns a representation of the board with this move
// if the move is illegal, it will rate it with a score of 0 and will not give a board
function rate(col, line, vertical, word) {
	tmpBoard = []
	// if the move is vertical we simply rotate the board, inverse 'col' and 'line' and keep going as if it was horizontal
	// note that the variable 'board' is duplicated and the original is kept clean.
	// in this function tmpBoard is the variable we are going to work on
	if (!vertical) tmpBoard = board.map(s => s.slice())
	else {
		tmpBoard = board.map((s, l) => {
			return [...s].map((char, c) => board[c][l]).join('')
		})
		const a = line
		line = col
		col = a
	}

	// first we check if there is enough room for the 'word'
	let stripe = tmpBoard[line]

	// note that stripe[1] are the boxes where we intend to place our word
	stripe = [stripe.slice(0, col), stripe.slice(col, col + word.length), stripe.slice(col + word.length, stripe.length)]
	if (stripe[1].length != word.length) return 0 // "not enough room"

	// we check if it doesn't conflict with already placed letters
	if (![...stripe[1]].every((char, i) => char == '-' || char == word[i])) return 0 //"can't be placed"

	// we check if we are not trying to replace a word already there
	if (!stripe[1].includes('-')) return 0 //not playing

	// we check if we have the right letters to place the word
	let myCurrentLetters = myLetters
	if (![...stripe[1]].every((char, i) => {
		if (char == '-') {
			if (myCurrentLetters.includes(word[i])) {
				index = myCurrentLetters.indexOf(word[i])
				myCurrentLetters = myCurrentLetters.slice(0, index) + myCurrentLetters.slice(index + 1);
				return true
			}
			return false
		}
		return true
	})) return 0 //you don't have the letters

	// we check if we are not placing a word alone
	let linked = [...word].find((char, i) => {
		let c = col + i
		if (c - 1 > 0 && tmpBoard[line][c - 1] != '-') return true
		if (c + 1 < stripe.length && tmpBoard[line][c + 1] != '-') return true
		if (line - 1 > 0 && tmpBoard[line - 1][c] != '-') return true
		if (line + 1 < tmpBoard.length && tmpBoard[line + 1][c] != '-') return true
		return false
	})
	if (!linked) return 0 //can't place word alone

	// 'w' is what is to replace 'stripe[1]' with the word we want to place
	// every new letter are placed in uppercase to make the scoring easier
	let w = [...word].map((char, i) => {
		if (stripe[1][i] == char) return char
		return char.toUpperCase()
	}).join('')

	stripe = stripe[0] + w + stripe[2]
	tmpBoard[line] = stripe;

	let rotated = tmpBoard.map((s, l) => {
		return [...s].map((char, c) => tmpBoard[c][l]).join('')
	})

	let score = 0
	// we check if cross match do actually make sense.
	let cross = rotated.every(s => {
		s = s.split('-').filter(a => a)
		return s.every(a => {
			if (a.length == 1 || availableWords.includes(a.toLowerCase())) {
				if (a.length != 1 && a.toLowerCase() != a) {
					score += scoreOfWord(a.toLowerCase())
				}
				return true
			}
		})
	})
	if (!cross) return 0 //crosses are wrong

	// we check if our word makes sense on the longitudinal way
	let foundWord = false
	let align = tmpBoard.every(s => {
		s = s.split('-').filter(a => a)
		return s.every(a => {
			if (a.length == 1 || a.toLowerCase() == a || availableWords.includes(a.toLowerCase())) {
				if (a.length != 1 && a.toLowerCase() != a) {
					if (a.toLowerCase() == word) foundWord = true;
					score += scoreOfWord(a.toLowerCase())
				}
				return true
			}
		})
	})
	if (!foundWord) return 0 //duplicated move
	if (!align) return 0 //doesn't align

	// we re position our board to the right position if the move is vertical
	if (vertical) {
		tmpBoard = tmpBoard.map((s, l) => {
			return [...s].map((char, c) => tmpBoard[c][l]).join('')
		})
	}

	return { score, tmpBoard }
}

let moves = []
// looping for horizontal moves ➰➰➰
// I decided to "bruteforce" the problem as smart algorythms were way too complicated to implement
board.forEach((stripe, line) => {
	// there is no need to check for words if there is no chance to place a word
	// so we check if the lines above and under are not empty
	if (board[line].replace(/-/g, '') == '') {
		if (line + 1 >= board.length || board[line + 1].replace(/-/g, '') == '') {
			if (line - 1 < 0 || board[line - 1].replace(/-/g, '') == '') {
				return
			}
		}
	}
	// we filter the dict to remove the words that can not go in this line
	letters = myLetters + board[line].replace(/-/g, '')
	possibleWords = availableWords.filter(word => word.match(new RegExp(`^[${letters}]+$`)));
	// looping ➰➰➰
	// on each box we ask for the score:
	// 0 if illegal
	// {score: tmpBoard:} if legal
	// sucessful moves go to the moves array
	[...stripe].forEach((char, col) => {
		possibleWords.forEach(w => {
			let {score, tmpBoard} = rate(col, line, false, w)
			if (score) {
				moves.push({col, line, vertical: false, word:w, score, tmpBoard})
			}
		})
	})
})

// looping for vertical moves ➰➰➰
// this is a shameless and ugly copy-paste of the above loop
rotatedBoard.forEach((stripe, line) => {
	if (rotatedBoard[line].replace(/-/g, '') == '') {
		if (line + 1 >= rotatedBoard.length || rotatedBoard[line + 1].replace(/-/g, '') == '') {
			if (line - 1 < 0 || rotatedBoard[line - 1].replace(/-/g, '') == '') {
				return
			}
		}
	}
	letters = myLetters + rotatedBoard[line].replace(/-/g, '')
	possibleWords = availableWords.filter(word => word.match(new RegExp(`^[${letters}]+$`)));
	[...stripe].forEach((char, col) => {
		possibleWords.forEach(w => {
			let {score, tmpBoard} = rate(line, col, true, w)
			if (score) {
				moves.push({line:col, col:line, vertical: true, word:w, score, board:tmpBoard})
			}
		})
	})
})

// all moves are ordered by decreasing score
let ordered = moves.sort((a, b) => b.score - a.score)

// the different moves that share the top score
let bestMoves = []
for (let i = 0; i < ordered.length; i++) {
	if (ordered[i].score == ordered[0].score)
		bestMoves.push(ordered[i])
	else break;
}

// return the and log what we found
try {
	console.log(`found ${ordered.length} possible moves`)
	if (ordered.length) {
		console.log(`best score is: ${ordered[0].score}`)
		console.log('these are the best moves:')
		bestMoves.forEach(mov => {
			console.log(mov)
			console.log('------------------------------------')
		})
		let response = `(${ordered[0].col},${ordered[0].line},${ordered[0].vertical},${ordered[0].word})`
		fs.writeFileSync(`${path}.answer`, response)
	} else {
		fs.writeFileSync(`${path}.answer`, 'error')
	}
} catch (e) {
	console.log(`could not write file at path: ${path}.answer`)
	process.exit(1)
}
