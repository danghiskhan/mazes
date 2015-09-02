var HEIGHT = 80;
var WIDTH = 80;
var W = 6;

var INTERVAL_MS = 1;
var STEPS_AT_ONCE = 100;

var UNVISITED = 0;
var ON_THE_STACK = 1;
var VISITED = 2;

var BACKGROUND_COLOUR = "#D7F7DD";
var FOREGROUND_COLOUR = "#AB688B";
var ON_THE_STACK_COLOUR = "#00FF00";

var renderInitial = function(canvas) {
	canvas.fillStyle = BACKGROUND_COLOUR;
	canvas.fillRect(0, 0, (HEIGHT + 1 / 2) * W, (WIDTH + 1 / 2) * W);
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
			if (painted[i][j].bottom !== VISITED && maze[i][j].bottom !== UNVISITED) {
				canvas.fillStyle = maze[i][j].bottom === ON_THE_STACK ? ON_THE_STACK_COLOUR : FOREGROUND_COLOUR; 
				canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W + W / 2, W / 2, W / 2);
				painted[i][j].bottom = maze[i][j].bottom;
			}
			if (painted[i][j].right !== VISITED && maze[i][j].bottom !== UNVISITED) {
				canvas.fillStyle = maze[i][j].right === ON_THE_STACK ? ON_THE_STACK_COLOUR : FOREGROUND_COLOUR; 
				canvas.fillRect((i + 1 / 2) * W + W / 2, (j + 1 / 2) * W, W / 2, W / 2);
				painted[i][j].right = maze[i][j].bottom;
			}
		};
	};
};

var create2dArray = function(width, height) {
	var a = new Array(width);
	for (var i = a.length - 1; i >= 0; i--) {
		a[i] = new Array(height);
	};

	for (var i = a.length - 1; i >= 0; i--) {
		for (var j = a[i].length - 1; j >= 0; j--) {
			a[i][j] = {
				visited: false,
				right: UNVISITED,
				bottom: UNVISITED
			};
		};
	};

	return a;
}

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

$(document).ready(function() {
	setupDropdown();

	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: (HEIGHT + 1 / 2) * W, width: (WIDTH + 1 / 2) * W });

	$(".container").append(canvas);

	var c = canvas[0].getContext("2d");

	var runMaze = function() {
		// Keeps track of the maze
		var maze = create2dArray(HEIGHT, WIDTH);
		// Keeps track of whats already been painted
		var painted = create2dArray(HEIGHT, WIDTH);

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
				maze[cur.x - 1][cur.y].right = ON_THE_STACK;
			} 
			if (cur.x < WIDTH - 1 && !maze[cur.x + 1][cur.y].visited) {
				neighbours.push({ x: cur.x + 1, y: cur.y, dx: 1, dy: 0 });	
				maze[cur.x][cur.y].right = ON_THE_STACK;
			} 
			if (cur.y > 0 && !maze[cur.x][cur.y - 1].visited) {
				neighbours.push({ x: cur.x, y: cur.y - 1, dx: 0, dy: -1 });	
				maze[cur.x][cur.y - 1].bottom = ON_THE_STACK;
			} 
			if (cur.y < HEIGHT - 1 && !maze[cur.x][cur.y + 1].visited) {
				neighbours.push({ x: cur.x, y: cur.y + 1, dx: 0, dy: 1 });	
				maze[cur.x][cur.y].bottom = ON_THE_STACK;
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
			if (cur.dx === 1 && cur.x > 0) maze[cur.x - 1][cur.y].right = VISITED;
			if (cur.dy === 1 && cur.y > 0) maze[cur.x][cur.y - 1].bottom = VISITED;
			if (cur.dx === -1) maze[cur.x][cur.y].right = VISITED;
			if (cur.dy === -1) maze[cur.x][cur.y].bottom = VISITED;

			// Render the maze in its current state
			if (i++ % STEPS_AT_ONCE === 0 || stack.length === 0) render(maze, painted, c);
		};


		var faster_iterator = function() {
			for (var i = 0; i < STEPS_AT_ONCE; i++) {
				iterate();	
			}

			// If incomplete, iterate again
			if (stack.length > 0) setTimeout(faster_iterator, INTERVAL_MS);
		};
		
		setTimeout(faster_iterator, INTERVAL_MS);
	};

	runMaze();

	$('#biases').change(function(e) {
		runMaze();
	});
});

