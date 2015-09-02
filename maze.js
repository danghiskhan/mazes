var HEIGHT = 30;
var WIDTH = 30;
var W = 50;

var ITERATION_MS = 1;

var render = function(maze, canvas) {
	canvas.fillStyle = "#000000";
	canvas.fillRect(0, 0, (HEIGHT + 1 / 2) * W, (WIDTH + 1 / 2) * W);

	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			canvas.fillStyle = "#00FF00";
			if (maze[i][j].visited) canvas.fillRect((i + 1 / 2) * W, (j + 1 / 2) * W, W / 2, W / 2);
			canvas.fillStyle = "#00FFFF";
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

		var newCur = stack.pop();

		while (maze[newCur.x][newCur.y].visited) {
			newCur = stack.pop();
		}

		if (newCur.dx === 1 && newCur.x > 0) maze[newCur.x - 1][newCur.y].right = false;
		if (newCur.dy === 1 && newCur.y > 0) maze[newCur.x][newCur.y - 1].bottom = false;
		if (newCur.dx === -1) maze[newCur.x][newCur.y].right = false;
		if (newCur.dy === -1) maze[newCur.x][newCur.y].bottom = false;

		cur = newCur;
	
		render(maze, c);
		if (stack.length > 0) setTimeout(iterate, ITERATION_MS);
	};
	
	setTimeout(iterate, ITERATION_MS);
});

