const PF = require('pathfinding')
const fs = require('fs')

// orders an array of points into a map object
// {
// 	start: {x:, y:}
// 	enf: {x:, y:}
// 	reefs: [{x:, y:} ...]
// 	grid: {topLeft:{x:, y:} topRight:{x:, y:}}
// }
function extractMap(points) {
	let coords = points.map(str =>  /^x(-?\d+)y(-?\d+)$/.exec(str))
	.filter(values => values)
	.map(values => ({ x: values[1], y: values[2]}))

	if (!coords.length)
		throw "could not extract any coordinates"

	const maxY = coords.reduce((agg, cur) => {
		return (agg.y > cur.y) ? agg : cur
	}).y
	const minY = coords.reduce((agg, cur) => {
		return (agg.y < cur.y) ? agg : cur
	}).y
	const maxX = coords.reduce((agg, cur) => {
		return (agg.x > cur.x) ? agg : cur
	}).x
	const minX = coords.reduce((agg, cur) => {
		return (agg.x < cur.x) ? agg : cur
	}).x

	coords.forEach(point => point.x -= minX)
	coords.forEach(point => point.y -= minY)

	const grid = {
		topLeft: {x: minX, y: minY},
		bottomRight: {x: maxX, y: maxY}
	}

	const start = coords[0]
	const end = coords[coords.length - 1]
	const reefs = coords.slice(1, coords.length - 1)
	return {
		start,
		end,
		reefs,
		grid
	} 
}

// reads the input, turns it into a 'map' object
function parseMap(input) {
	let points = input.replace(/\n/g, '')
	points = points.split(',')
	return extractMap(points)
}

// returns a matrix with the specified symbols
// s for start
// e for end
// r for reefs
// o for ocean
// p for path
function mapMatrix(map, s, e, r, o, p) {
	const { start, end, reefs, grid, path } = map
	const matrix = []
	let stripe = []
	for (let x = grid.topLeft.x; x <= grid.bottomRight.x; x++)
		stripe.push(o)
	for (let y = grid.topLeft.y; y <= grid.bottomRight.y; y++) {
		matrix.push(stripe.slice(0))
	}

	matrix[start.y][start.x] = s
	matrix[end.y][end.x] = e
	if (path) {
		path.forEach(point => matrix[point.y][point.x] = p)
	}
	reefs.forEach(point => matrix[point.y][point.x] = r)
	return matrix
}

// parsing
const filePath = process.argv[2]
if (!filePath) {
	console.log('missing input file');
	process.exit(1)
}
let file = ''
try {
	file = fs.readFileSync(filePath).toString()
} catch (e) {
	console.log(`could not open file at path: ${filePath}`)
	process.exit(1)
}
let myMap = {}
try {
	// creating map object
	myMap = parseMap(file)
} catch (e) {
	console.log(e)
	process.exit(1)
}

// use pathfinding.js for the resolution
const myMatrix = mapMatrix(myMap, 0, 0, 1, 0, 0)

const grid = new PF.Grid(myMatrix);
// I used Dijkstra as it is the simplest and the most reliable. (not the fastest though)
const finder = new PF.DijkstraFinder()
myMap.path = finder.findPath(myMap.start.x, myMap.start.y, myMap.end.x, myMap.end.y, grid)
myMap.path = myMap.path.slice(1, myMap.path.length - 1).map(pt => ({x: pt[0], y:pt[1]}))

// writing response to the answer file
try{
	if (!myMap.path.length) {
		console.log(error)
		fs.writeFileSync(`${filePath}.answer`, 'error')
	} else {
		let response = mapMatrix(myMap, 'S', 'E', 'X', '.', 'O')

		response = response.map(stripe => stripe.join(''))
		response = response.join('\n')

		console.log(response)

		fs.writeFileSync(`${filePath}.answer`, response)
	}
} catch (e) {
	console.log(`could not write file at path: ${filePath}.answer`)
	process.exit(1)
}
