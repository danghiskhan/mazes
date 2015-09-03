var HEIGHT = 100;
var WIDTH = 100;
var W = 8;

var CANVAS_HEIGHT = (HEIGHT + 1 / 2) * W;
var CANVAS_WIDTH = (WIDTH + 1 / 2) * W;

var INTERVAL_MS = 1;
var STEPS_AT_ONCE = 100;

var WALL_COLOUR = "#898BB8";
var MAZE_COLOUR = "#F9FAE5";
var PATHFINDER_COLOUR = "#45577a";
var SOLUTION_COLOUR = "#f2c03e";

var create2dArray = function(width, height, cellInfo) {
	var a = new Array(width);
	for (var n = a.length - 1; n >= 0; n--) {
		a[n] = new Array(height);
	}

	for (var i = a.length - 1; i >= 0; i--) {
		for (var j = a[i].length - 1; j >= 0; j--) {
			a[i][j] = cellInfo();
		}
	}

	return a;
};

var paintBuffer = null;

var renderInitial = function(canvas) {
	canvas.fillStyle = WALL_COLOUR;
	canvas.fillRect(0, 0, CANVAS_HEIGHT, CANVAS_WIDTH);
	paintBuffer = create2dArray(WIDTH, HEIGHT, function () {
		return {
			pos: null,
			right: null,
			bottom: null
		};
	});
};

var paint = function (i, j, colour, cellType) {
	if (paintBuffer[i][j][cellType] !== colour) {
		paintBuffer[i][j][cellType] = colour;
		return true;
	}

	return false;
};

var render = function(maze, canvas, bfsState) {
	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {

			// Colour in nodes
			canvas.fillStyle = MAZE_COLOUR;
			if (maze[i][j].visited) {
				if (bfsState && bfsState[i][j].visited) canvas.fillStyle = PATHFINDER_COLOUR;
				if ('path' in maze[i][j]) canvas.fillStyle = SOLUTION_COLOUR;

				if (paint(i, j, canvas.fillStyle, 'pos')) {
					canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W, W / 2, W / 2);
				}
			}

			// Colour in the right walls
			canvas.fillStyle = MAZE_COLOUR;
			if (!maze[i][j].right) {
				if (bfsState && (bfsState[i][j].dx === -1 || (i < WIDTH - 1 && bfsState[i + 1][j].dx === 1))) canvas.fillStyle = PATHFINDER_COLOUR;
				if ('rightPath' in maze[i][j]) canvas.fillStyle = SOLUTION_COLOUR;

				if (paint(i, j, canvas.fillStyle, 'right')) {
					canvas.fillRect((i + 1 / 2) * W + W / 2, (j + 1 / 2) * W, W / 2, W / 2);
				}
			}

			// Colour in the bottom walls
			canvas.fillStyle = MAZE_COLOUR;
			if (!maze[i][j].bottom) {
				if (bfsState && (bfsState[i][j].dy === -1 || (j < HEIGHT - 1 && bfsState[i][j + 1].dy === 1))) canvas.fillStyle = PATHFINDER_COLOUR;
				if ('bottomPath' in maze[i][j]) canvas.fillStyle = SOLUTION_COLOUR;

				if (paint(i, j, canvas.fillStyle, 'bottom')) {
					canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W + W / 2, W / 2, W / 2);
				}
			}
		}
	}
};

var mazeCellInfo = function () {
	return {
		visited: false,
		right: true,
		bottom: true
	};
};

var bfsInfo = function () {
	return {
		visited: false,
		dx: 0,
		dy: 0
	};
};

// Randomly chooses path
var randomPath = function(paths) {
	var newPaths = [];

	while (paths.length > 0) {
		newPaths.push(paths.splice(Math.random() * paths.length, 1)[0]);
	}

	return newPaths;
};

// Biased towards horizontal paths
var horizontalBias = function(paths) {
	return paths.sort(function(a, b) {
		return Math.abs(a.dx) + Math.abs(b.dx) - Math.random() * 8;
	});
};

// Biased towards diagonal paths
var diagonalBias = function(paths) {
	return paths.sort(function(a, b) {
		return 1 + Math.abs(a.x) + Math.abs(a.y) - Math.abs(b.x) - Math.abs(b.y) - Math.random() * 4;
	});
};

// Center bias
var centerBias = function(paths) {
	return paths.sort(function(a, b) {
		var distToCenter = function(pos) {
			return Math.abs(pos.x - WIDTH / 2) + Math.abs(pos.y - HEIGHT / 2);
		};

		return 1 + distToCenter(a) - distToCenter(b) - Math.random() * 2;
	});
};

// Outer bias
var outerBias = function(paths) {
	return paths.sort(function(a, b) {
		var distToCenter = function(pos) {
			return Math.abs(pos.x - WIDTH / 2) + Math.abs(pos.y - HEIGHT / 2);
		};

		return 1 + distToCenter(b) - distToCenter(a) - Math.random() * 2;
	});
};


var biases = [
	{ name: 'Random', fun: randomPath },
	{ name: 'Outer Bias', fun: outerBias },
	{ name: 'Center Bias', fun: centerBias },
	{ name: 'Horizontal Bias', fun: horizontalBias },
	{ name: 'Diagonal Bias', fun: diagonalBias }
];

var setupDropdown = function() {
	var dropdown = 	$('#biases');

	$.each(biases, function(index, value) {
		dropdown.append($("<option />").val(index).text(value.name));
	});
};

var createMaze = function(c, maze, doneCallback) {
	renderInitial(c);

	var cur = {
		x: 0,
		y: 0
	};

	var stack = [];
	stack.push(cur);

	var i = 0;

	// Returns whether iteration is finished
	var iterate = function() {
		if (stack.length === 0) return true;

		maze[cur.x][cur.y].visited = true;

		var neighbours = [];

		// Add possible paths to stack
		if (cur.x > 0 && !maze[cur.x - 1][cur.y].visited) {
			neighbours.push({ x: cur.x - 1, y: cur.y, dx: -1, dy: 0 });
		}
		if (cur.x < WIDTH - 1 && !maze[cur.x + 1][cur.y].visited) {
			neighbours.push({ x: cur.x + 1, y: cur.y, dx: 1, dy: 0 });
		}
		if (cur.y > 0 && !maze[cur.x][cur.y - 1].visited) {
			neighbours.push({ x: cur.x, y: cur.y - 1, dx: 0, dy: -1 });
		}
		if (cur.y < HEIGHT - 1 && !maze[cur.x][cur.y + 1].visited) {
			neighbours.push({ x: cur.x, y: cur.y + 1, dx: 0, dy: 1 });
		}

		// Sort via path criteria
		neighbours = biases[parseInt($('#biases').val())].fun(neighbours);

		while (neighbours.length > 0) {
			stack.push(neighbours.pop());
		}

		// Get the next path ignoring paths to already visited nodes
		cur = stack.pop();
		while (stack.length > 0 && maze[cur.x][cur.y].visited) {
			cur = stack.pop();
		}

		// Mark the wall to the new path as destroyed
		if (cur.dx === 1 && cur.x > 0) maze[cur.x - 1][cur.y].right = false;
		if (cur.dy === 1 && cur.y > 0) maze[cur.x][cur.y - 1].bottom = false;
		if (cur.dx === -1) maze[cur.x][cur.y].right = false;
		if (cur.dy === -1) maze[cur.x][cur.y].bottom = false;

		return false;
	};


	var fasterIterator = function() {
		var done = false;
		var i = 0;
	
		while (!done && i < STEPS_AT_ONCE) {
			done = iterate();
			i++;
		}
	
		// Render the maze in its current state
		render(maze, c);
		// If incomplete, iterate again
		if (!done) {
			setTimeout(fasterIterator, INTERVAL_MS);
		} else {
			if (doneCallback) doneCallback();
		}
	};

	setTimeout(fasterIterator, INTERVAL_MS);
};

var breadthFirstSearch = function (canvas, maze) {
	var bfsState = create2dArray(HEIGHT, WIDTH, bfsInfo);
	var queue = [];

	var found = false;

	var cur = {
		x: 0,
		y: 0
	};

	queue.push(cur);

	var i = 0;

	var iterateBFS = function () {
		bfsState[cur.x][cur.y].visited = true;
		bfsState[cur.x][cur.y].dx = cur.dx;
		bfsState[cur.x][cur.y].dy = cur.dy;

		if (cur.x === WIDTH - 1 && cur.y === HEIGHT - 1) {
			return true;
		}

		// Add possible paths to queue
		if (cur.x > 0 && !bfsState[cur.x - 1][cur.y].visited && !maze[cur.x - 1][cur.y].right) {
			queue.push({ x: cur.x - 1, y: cur.y, dx: -1, dy: 0 });
		}
		if (cur.x < WIDTH - 1 && !bfsState[cur.x + 1][cur.y].visited && !maze[cur.x][cur.y].right) {
			queue.push({ x: cur.x + 1, y: cur.y, dx: 1, dy: 0 });
		}
		if (cur.y > 0 && !bfsState[cur.x][cur.y - 1].visited && !maze[cur.x][cur.y - 1].bottom) {
			queue.push({ x: cur.x, y: cur.y - 1, dx: 0, dy: -1 });
		}
		if (cur.y < HEIGHT - 1 && !bfsState[cur.x][cur.y + 1].visited && !maze[cur.x][cur.y].bottom) {
			queue.push({ x: cur.x, y: cur.y + 1, dx: 0, dy: 1 });
		}

		do {
			cur = queue.shift();
		} while (bfsState[cur.x][cur.y].visited && queue.length > 0);

		return false;

		// if (i++ % (STEPS_AT_ONCE) === 0) render(maze, canvas, bfsState);
	};

	var fasterIterator = function() {
		var done = false;
		var i = 0;
	
		while (!done && i < STEPS_AT_ONCE) {
			done = iterateBFS();
			i++;
		}
	
		// Render the maze in its current state
		render(maze, canvas, bfsState)
		// If incomplete, iterate again
		if (!done) {
			setTimeout(fasterIterator, INTERVAL_MS);
		} else {
			// Now find solution path
			var path = {
				x: cur.x,
				y: cur.y
			};

			maze[path.x][path.y].path = true;

			while (path.x > 0 || path.y > 0) {
				if (bfsState[path.x][path.y].dx === 1 && path.x > 0) maze[path.x - 1][path.y].rightPath = true;
				if (bfsState[path.x][path.y].dx === -1 && path.x < WIDTH - 1) maze[path.x][path.y].rightPath = true;
				if (bfsState[path.x][path.y].dy === 1 && path.y > 0) maze[path.x][path.y - 1].bottomPath = true;
				if (bfsState[path.x][path.y].dy === -1 && path.y < HEIGHT - 1) maze[path.x][path.y].bottomPath = true;

				var dx = bfsState[path.x][path.y].dx;
				var dy = bfsState[path.x][path.y].dy;

				path.x -= dx;
				path.y -= dy;

				maze[path.x][path.y].path = true;
			}

			render(maze, canvas, bfsState);
		}
	};

	setTimeout(fasterIterator, INTERVAL_MS);
};

$(document).ready(function() {
	setupDropdown();

	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: CANVAS_HEIGHT, width: CANVAS_WIDTH });
	$(".container").append(canvas);
	var c = canvas[0].getContext("2d");

	// Keeps track of the maze
	var maze = create2dArray(HEIGHT, WIDTH, mazeCellInfo);

	var startSearch = function () {
		breadthFirstSearch(c, maze);
	};

	createMaze(c, maze, startSearch);

	$('#biases').change(function(e) {
		maze = create2dArray(HEIGHT, WIDTH, mazeCellInfo);
		createMaze(c, maze, startSearch);
	});
});
