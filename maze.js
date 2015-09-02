var HEIGHT = 120;
var WIDTH = 120;
var W = 8;

var CANVAS_HEIGHT = (HEIGHT + 1 / 2) * W;
var CANVAS_WIDTH = (WIDTH + 1 / 2) * W;

var INTERVAL_MS = 1;
var STEPS_AT_ONCE = 100;

var BACKGROUND_COLOUR = "#AB688B";
var FOREGROUND_COLOUR = "#D7F7DD";

var renderInitial = function(canvas) {
	canvas.fillStyle = BACKGROUND_COLOUR;
	canvas.fillRect(0, 0, CANVAS_HEIGHT, CANVAS_WIDTH);
};

var render = function(maze, painted, canvas) {
	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			// Colour in visited nodes
			canvas.fillStyle = FOREGROUND_COLOUR;
			if (!painted[i][j].visited && maze[i][j].visited) {
				canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W, W / 2, W / 2);
				painted[i][j].visited = true;
			}

			// Colour in the bottom or right walls depending on if they're broken
			canvas.fillStyle = FOREGROUND_COLOUR;
			if (!maze[i][j].bottom) {//painted[i][j].bottom && !maze[i][j].bottom) {
				if ('bottomPath' in maze[i][j]) canvas.fillStyle = "#FF0000";
				canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W + W / 2, W / 2, W / 2);
				painted[i][j].bottom = false;
			}
			canvas.fillStyle = FOREGROUND_COLOUR;
			if (!maze[i][j].right) {//painted[i][j].right && !maze[i][j].right) {
				if ('rightPath' in maze[i][j]) canvas.fillStyle = "#FF0000";
				canvas.fillRect((i + 1 / 2) * W + W / 2, (j + 1 / 2) * W, W / 2, W / 2);
				painted[i][j].right = false;
			}

			// If cell part of path, colour
			if ('path' in maze[i][j]) {
				canvas.fillStyle = "#FF0000";
				canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W, W / 2, W / 2);
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
	{ name: 'Outer Bias', fun: outerBias },
	{ name: 'Center Bias', fun: centerBias },
	{ name: 'Random', fun: randomPath },
	{ name: 'Horizontal Bias', fun: horizontalBias },
	{ name: 'Diagonal Bias', fun: diagonalBias }
];

var setupDropdown = function() {
	var dropdown = 	$('#biases');

	$.each(biases, function(index, value) {
		dropdown.append($("<option />").val(index).text(value.name));
	});
};

var runMaze = function(c, maze, painted) {
	renderInitial(c);

	var cur = {
		x: 0,
		y: 0
	};

	var stack = [];
	stack.push(cur);

	var i = 0;

	var iterate = function() {
		if (stack.length === 0) return;

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

		// Render the maze in its current state
		if (i++ % STEPS_AT_ONCE === 0 || stack.length === 0) render(maze, painted, c);

		if (stack.length === 0) breadthFirstSearch(c, maze, painted);
	};


	var fasterIterator = function() {
		for (var i = 0; i < STEPS_AT_ONCE; i++) {
			iterate();
		}

		// If incomplete, iterate again
		if (stack.length > 0) setTimeout(fasterIterator, INTERVAL_MS);
	};

	setTimeout(fasterIterator, INTERVAL_MS);
};

var breadthFirstSearch = function (canvas, maze, painted) {
	var bfsState = create2dArray(HEIGHT, WIDTH, bfsInfo);
	var queue = [];

	var found = false;

	var cur = {
		x: 0,
		y: 0
	};

	queue.push(cur);

	while (!found) {
		bfsState[cur.x][cur.y].visited = true;
		bfsState[cur.x][cur.y].dx = cur.dx;
		bfsState[cur.x][cur.y].dy = cur.dy;

		if (cur.x === WIDTH - 1 && cur.y === HEIGHT - 1) {
			found = true;
		} else {
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
		}
	}

	var path = {
		x: cur.x,
		y: cur.y
	};

	do {
		maze[path.x][path.y].path = true;
		if (bfsState[path.x][path.y].dx === 1 && path.x > 0) maze[path.x - 1][path.y].rightPath = true;
		if (bfsState[path.x][path.y].dx === -1 && path.x < WIDTH - 1) maze[path.x][path.y].rightPath = true;
		if (bfsState[path.x][path.y].dy === 1 && path.y > 0) maze[path.x][path.y - 1].bottomPath = true;
		if (bfsState[path.x][path.y].dy === -1 && path.y < HEIGHT - 1) maze[path.x][path.y].bottomPath = true;

		var dx = bfsState[path.x][path.y].dx;
		var dy = bfsState[path.x][path.y].dy;

		path.x -= dx;
		path.y -= dy;

	} while (path.x > 0 || path.y > 0);

	render(maze, painted, canvas);
};

$(document).ready(function() {
	setupDropdown();

	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: CANVAS_HEIGHT, width: CANVAS_WIDTH });
	$(".container").append(canvas);
	var c = canvas[0].getContext("2d");

	// Keeps track of the maze
	var maze = create2dArray(HEIGHT, WIDTH, mazeCellInfo);
	// Keeps track of whats already been painted
	var painted = create2dArray(HEIGHT, WIDTH, mazeCellInfo);
	runMaze(c, maze, painted);

	// breadthFirstSearch(c, maze, painted);

	$('#biases').change(function(e) {
		maze = create2dArray(HEIGHT, WIDTH, mazeCellInfo);
		painted = create2dArray(HEIGHT, WIDTH, mazeCellInfo);
		runMaze(c, maze, painted);
	});
});
