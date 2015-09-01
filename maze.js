var HEIGHT = 20;
var WIDTH = 20;
var W = 24;

var ITERATION_MS = 10;

var render = function(maze, canvas) {
	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			canvas.fillStyle = "#000000";
			canvas.fillRect(0, 0, i * W, j * W);

			canvas.fillStyle = "#00FF00";
			if (maze[i][j].visited) canvas.fillRect(i * W + W / 3, j * W + W / 3, W / 3, W / 3);
			canvas.fillStyle = "#0000FF";
			if (!maze[i][j].top) canvas.fillRect(i * W + W / 3, j * W, W / 3, W / 3);
			if (!maze[i][j].bottom) canvas.fillRect(i * W + W / 3, j * W + 2 * W / 3, W / 3, W / 3);
			if (!maze[i][j].right) canvas.fillRect(i * W + 2 * W / 3, j * W + W / 3, W / 3, W / 3);
			if (!maze[i][j].left) canvas.fillRect(i * W, j * W + W / 3, W / 3, W / 3);
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
				top: true,
				right: true,
				bottom: true,
				left: true
			};
		};
	};

	return a;
}

$(document).ready(function() {
	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: HEIGHT * W, width: WIDTH * W });

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

		if (cur.x > 0 && !maze[cur.x - 1][cur.y].visited) neighbours.push({ x: cur.x - 1, y: cur.y });
		if (cur.x < WIDTH - 1 && !maze[cur.x + 1][cur.y].visited) neighbours.push({ x: cur.x + 1, y: cur.y });
		if (cur.y > 0 && !maze[cur.x][cur.y - 1].visited) neighbours.push({ x: cur.x, y: cur.y - 1 });
		if (cur.y < HEIGHT - 1 && !maze[cur.x][cur.y + 1].visited) neighbours.push({ x: cur.x, y: cur.y + 1 });

		var deadEnd = neighbours.length === 0;

		while (neighbours.length > 0) {
			stack.push(neighbours.splice(Math.random() * neighbours.length, 1)[0]);
		}

		var newCur = stack.pop();

		var delta = {
			x: newCur.x - cur.x, 
			y: newCur.y - cur.y
		};

		if (!deadEnd) {
			if (delta.x === 1) maze[cur.x][cur.y].right = false;
			if (delta.x === -1) maze[cur.x][cur.y].left = false;
			if (delta.y === 1) maze[cur.x][cur.y].top = false;
			if (delta.y === -1) maze[cur.x][cur.y].bottom = false;
		}

		cur = newCur;

		render(maze, c);

		if (stack.length > 0) setTimeout(iterate, ITERATION_MS);
	};
	
	setTimeout(iterate, ITERATION_MS);
});

