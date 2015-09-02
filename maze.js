var HEIGHT = 30;
var WIDTH = 30;
var W = 20;

var INTERVAL_MS = 1;

var BACKGROUND_COLOUR = "#D7F7DD";
var FOREGROUND_COLOUR = "#AB688B";

var render = function(maze, canvas) {
	canvas.fillStyle = BACKGROUND_COLOUR;
	canvas.fillRect(0, 0, (HEIGHT + 1 / 2) * W, (WIDTH + 1 / 2) * W);

	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			// Colour in visited nodes
			canvas.fillStyle = FOREGROUND_COLOUR;
			if (maze[i][j].visited) canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W, W / 2, W / 2);
			
			// Colour in the bottom or right walls depending on if they're broken
			canvas.fillStyle = FOREGROUND_COLOUR;
			if (!maze[i][j].bottom) canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W + W / 2, W / 2, W / 2);
			if (!maze[i][j].right) canvas.fillRect((i + 1 / 2) * W + W / 2, (j + 1 / 2) * W, W / 2, W / 2);
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
				right: true,
				bottom: true
			};
		};
	};

	return a;
}

$(document).ready(function() {
	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: (HEIGHT + 2) * W, width: (WIDTH + 2) * W });

	$("body").append(canvas);

	var c = canvas[0].getContext("2d");

	var maze = create2dArray(HEIGHT, WIDTH);

	var cur = {
		x: 0,
		y: 0
	};

	var stack = [];
	stack.push(cur);

	var iterate = function() {
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

		while (neighbours.length > 0) {
			stack.push(neighbours.splice(Math.random() * neighbours.length, 1)[0]);
		}

		// Get the next path ignoring paths to already visited nodes
		cur = stack.pop();
		while (maze[cur.x][cur.y].visited) {
			cur = stack.pop();
		}

		// Mark the wall to the new path as destroyed
		if (cur.dx === 1 && cur.x > 0) maze[cur.x - 1][cur.y].right = false;
		if (cur.dy === 1 && cur.y > 0) maze[cur.x][cur.y - 1].bottom = false;
		if (cur.dx === -1) maze[cur.x][cur.y].right = false;
		if (cur.dy === -1) maze[cur.x][cur.y].bottom = false;

		// Render the maze in its current state
		render(maze, c);
		// If incomplete, iterate again
		if (stack.length > 0) setTimeout(iterate, INTERVAL_MS);
	};
	
	setTimeout(iterate, INTERVAL_MS);
});

