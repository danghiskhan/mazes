var HEIGHT = 100;
var WIDTH = 120;
var W = 6;

var CANVAS_HEIGHT = (HEIGHT + 1 / 2) * W;
var CANVAS_WIDTH = (WIDTH + 1 / 2) * W;

var INTERVAL_MS = 10;
var PAUSE_BEFORE_RESTART_MS = 5000;

var WALL_COLOUR = "#898BB8";
var MAZE_COLOUR = "#F9FAE5";
var PATHFINDER_COLOUR = "#45577a";
var SOLUTION_COLOUR = "#f2c03e";

var stepsAtOnce = 50;

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

// Canvas paintbuffer
var paintBuffer = null;

// Prevent rendering issues by only allowing one timeout instance at a time
var timeout = null;
var startTimeout = function(f, ms) {
	if (timeout !== null) {
		clearTimeout(timeout);
	}
	timeout = setTimeout(f, ms);	
};

var renderInitial = function(canvas) {
	canvas.fillStyle = WALL_COLOUR;
	canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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

var render = function(maze, canvas, searchState) {
	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {

			// Colour in nodes
			canvas.fillStyle = MAZE_COLOUR;
			if (maze[i][j].visited) {
				if (searchState && searchState[i][j].visited) canvas.fillStyle = PATHFINDER_COLOUR;
				if ('path' in maze[i][j]) canvas.fillStyle = SOLUTION_COLOUR;

				if (paint(i, j, canvas.fillStyle, 'pos')) {
					canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W, W / 2, W / 2);
				}
			}

			// Colour in the right walls
			canvas.fillStyle = MAZE_COLOUR;
			if (!maze[i][j].right) {
				if (searchState && (searchState[i][j].dx === -1 || (i < WIDTH - 1 && searchState[i + 1][j].dx === 1))) canvas.fillStyle = PATHFINDER_COLOUR;
				if ('rightPath' in maze[i][j]) canvas.fillStyle = SOLUTION_COLOUR;

				if (paint(i, j, canvas.fillStyle, 'right')) {
					canvas.fillRect((i + 1 / 2) * W + W / 2, (j + 1 / 2) * W, W / 2, W / 2);
				}
			}

			// Colour in the bottom walls
			canvas.fillStyle = MAZE_COLOUR;
			if (!maze[i][j].bottom) {
				if (searchState && (searchState[i][j].dy === -1 || (j < HEIGHT - 1 && searchState[i][j + 1].dy === 1))) canvas.fillStyle = PATHFINDER_COLOUR;
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
		var horScore = function(pos) {
			return Math.abs(pos.dx) - Math.abs(pos.dy);
		};

		return (horScore(b) - horScore(a)) * (1 - Math.random()) + 0.5 - Math.random();
	});
};

// Biased towards diagonal paths
var diagonalBias = function(paths) {
	return paths.sort(function(a, b) {
		return (Math.abs(a.x) + Math.abs(a.y) - Math.abs(b.x) - Math.abs(b.y)) * (1 - Math.random() * 2) + 0.5 - Math.random();
	});
};

// Center bias
var centerBias = function(paths) {
	return paths.sort(function(a, b) {
		var distToCenter = function(pos) {
			return Math.abs(pos.x - WIDTH / 2) + Math.abs(pos.y - HEIGHT / 2);
		};

		return (distToCenter(a) - distToCenter(b)) * (1 - Math.random() * 1.2) + 0.5 - Math.random();
	});
};

// Outer bias
var outerBias = function(paths) {
	return paths.sort(function(a, b) {
		var distToCenter = function(pos) {
			return Math.abs(pos.x - WIDTH / 2) + Math.abs(pos.y - HEIGHT / 2);
		};

		return (distToCenter(b) - distToCenter(a)) * (1 - Math.random() * 2) + 0.5 - Math.random();
	});
};

// Top left bias
var topLeftBias = function(paths) {
	return paths.sort(function(a, b) {
		var distToTopLeft = function(pos) {
			return pos.x + pos.y;
		};

		return (distToTopLeft(b) - distToTopLeft(a)) * (1 - Math.random() * 2) + 0.5 - Math.random();
	});
};


var biases = [
	{ name: 'Random', fun: randomPath },
	{ name: 'Top Left Bias', fun: topLeftBias },
	{ name: 'Horizontal Bias', fun: horizontalBias },
	{ name: 'Outer Bias', fun: outerBias },
	{ name: 'Center Bias', fun: centerBias },
	{ name: 'Diagonal Bias', fun: diagonalBias }
];

var queue = function() {
	var queue = [];

	return {
		add: function(item) {
			queue.push(item);
		},
		extract: function() {
			return queue.shift();
		},
		isEmpty: function() {
			return queue.length === 0;
		}
	};
};

var stack = function() {
	var stack = [];

	return {
		add: function(item) {
			stack.push(item);
		},
		extract: function() {
			return stack.pop();
		},
		isEmpty: function() {
			return stack.length === 0;
		}
	};
};

var aStar = function() {
	return new Heap(function(item) {
		return item.dist + Math.sqrt(Math.pow(WIDTH - item.x, 2), Math.pow(HEIGHT - item.y, 2));
	});
};

var bestFirst = function() {
	return new Heap(function(item) {
		return Math.sqrt(Math.pow(WIDTH - item.x, 2), Math.pow(HEIGHT - item.y, 2));
	});
};

var searchAlgos = [
	{ name: 'Flood Fill (Breadth First Search)', fun: queue },
	{ name: 'Depth First Search', fun: stack },
	{ name: 'Best First Search', fun: bestFirst },
	{ name: 'A* Search', fun: aStar }
];

var setupControls = function() {
	var biasesDropdown = $('#biases');

	$.each(biases, function(index, value) {
		biasesDropdown.append($("<option />").val(index).text(value.name));
	});

	var searchAlgoDropdown = $('#search-algo');

	$.each(searchAlgos, function(index, value) {
		searchAlgoDropdown.append($("<option />").val(index).text(value.name));
	});

	$('#sim-speed').on('change mousemove', function(e) {
		stepsAtOnce = this.valueAsNumber;
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
	
		while (!done && i < stepsAtOnce) {
			done = iterate();
			i++;
		}
	
		// Render the maze in its current state
		render(maze, c);
		// If incomplete, iterate again
		if (!done) {
			startTimeout(fasterIterator, INTERVAL_MS);
		} else {
			if (doneCallback) doneCallback();
		}
	};

	startTimeout(fasterIterator, INTERVAL_MS);
};

var search = function (canvas, maze, doneCallback) {
	var searchState = create2dArray(WIDTH, HEIGHT, bfsInfo);
	var items = searchAlgos[parseInt($('#search-algo').val())].fun();

	var found = false;

	var cur = {
		x: 0,
		y: 0,
		dist: 0
	};

	items.add(cur);

	var i = 0;

	var iterateSearch = function () {
		searchState[cur.x][cur.y].visited = true;
		searchState[cur.x][cur.y].dx = cur.dx;
		searchState[cur.x][cur.y].dy = cur.dy;

		if (cur.x === WIDTH - 1 && cur.y === HEIGHT - 1) {
			return true;
		}

		// Add possible paths to items
		if (cur.x > 0 && !searchState[cur.x - 1][cur.y].visited && !maze[cur.x - 1][cur.y].right) {
			items.add({ x: cur.x - 1, y: cur.y, dx: -1, dy: 0, dist: cur.dist + 1 });
		}
		if (cur.x < WIDTH - 1 && !searchState[cur.x + 1][cur.y].visited && !maze[cur.x][cur.y].right) {
			items.add({ x: cur.x + 1, y: cur.y, dx: 1, dy: 0, dist: cur.dist + 1 });
		}
		if (cur.y > 0 && !searchState[cur.x][cur.y - 1].visited && !maze[cur.x][cur.y - 1].bottom) {
			items.add({ x: cur.x, y: cur.y - 1, dx: 0, dy: -1, dist: cur.dist + 1 });
		}
		if (cur.y < HEIGHT - 1 && !searchState[cur.x][cur.y + 1].visited && !maze[cur.x][cur.y].bottom) {
			items.add({ x: cur.x, y: cur.y + 1, dx: 0, dy: 1, dist: cur.dist + 1 });
		}

		do {
			cur = items.extract();
		} while (searchState[cur.x][cur.y].visited && !items.isEmpty());

		return false;
	};

	var fasterIterator = function() {
		var done = false;
		var i = 0;
	
		while (!done && i < stepsAtOnce) {
			done = iterateSearch();
			i++;
		}
	
		// Render the maze in its current state
		render(maze, canvas, searchState)
		// If incomplete, iterate again
		if (!done) {
			startTimeout(fasterIterator, INTERVAL_MS);
		} else {
			// Now find solution path
			var path = {
				x: cur.x,
				y: cur.y
			};

			maze[path.x][path.y].path = true;

			while (path.x > 0 || path.y > 0) {
				if (searchState[path.x][path.y].dx === 1 && path.x > 0) maze[path.x - 1][path.y].rightPath = true;
				if (searchState[path.x][path.y].dx === -1 && path.x < WIDTH - 1) maze[path.x][path.y].rightPath = true;
				if (searchState[path.x][path.y].dy === 1 && path.y > 0) maze[path.x][path.y - 1].bottomPath = true;
				if (searchState[path.x][path.y].dy === -1 && path.y < HEIGHT - 1) maze[path.x][path.y].bottomPath = true;

				var dx = searchState[path.x][path.y].dx;
				var dy = searchState[path.x][path.y].dy;

				path.x -= dx;
				path.y -= dy;

				maze[path.x][path.y].path = true;
			}

			render(maze, canvas, searchState);

			doneCallback();
		}
	};

	startTimeout(fasterIterator, INTERVAL_MS);
};

// Min heap implementation being implemented for practice
function Heap(score) {
	this.items = [];
	this.score = score;
}
Heap.prototype = {
	add: function(item) {
		var pos = this.items.length;

		this.items[pos] = item;

		var done = false; 

		while (!done && pos !== 0) {
			done = true;

			if (this.score(this.items[pos]) < this.score(this.items[Math.floor(pos / 2)])) {
				this.swap(pos, Math.floor(pos / 2));
				pos = Math.floor(pos / 2);
				done = false;
			}
		}
	},
	swap: function(a, b) {
		var temp = this.items[a];
		this.items[a] = this.items[b];
		this.items[b] = temp;
	},
	peek: function() {
		return this.items[0];
	},
	extract: function() {
		var max = this.items[0];

		var end = this.items.pop();
		this.items[0] = end;

		var done = false;
		var pos = 0;

		while (!done) {
			done = true;

			var swapPos = -1;

			if (pos * 2 < this.items.length && this.score(this.items[pos]) > this.score(this.items[pos * 2])) {
				swapPos = pos * 2;
			}

			if (pos * 2 + 1 < this.items.length && this.score(this.items[swapPos === - 1 ? pos : swapPos]) > this.score(this.items[pos * 2 + 1])) {
				swapPos = pos * 2 + 1;
			}

			if (swapPos !== -1) {
				this.swap(pos, swapPos);
				pos = swapPos;
				done = false;
			}
		}

		// console.log(this.items);

		return max;
	},
	isEmpty: function() {
		return this.items.length === 0;
	}
};

$(document).ready(function() {
	setupControls();

	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: CANVAS_HEIGHT, width: CANVAS_WIDTH });
	$(".container").append(canvas);
	var c = canvas[0].getContext("2d");

	// Keeps track of the maze
	var maze = create2dArray(WIDTH, HEIGHT, mazeCellInfo);

	var startSearch = function () {
		search(c, maze, function() {
			startTimeout(function() {
				maze = create2dArray(WIDTH, HEIGHT, mazeCellInfo);
				createMaze(c, maze, startSearch);
			}, PAUSE_BEFORE_RESTART_MS);
		});
	};

	createMaze(c, maze, startSearch);

	$('#biases').change(function(e) {
		maze = create2dArray(WIDTH, HEIGHT, mazeCellInfo);
		createMaze(c, maze, startSearch);
	});
});
