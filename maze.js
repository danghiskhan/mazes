var HEIGHT = 80;
var WIDTH = 80;
var BLOCK_WIDTH = 10;

var UNVISITED = 0;
var VISITED = 1;

var render = function(maze, canvas) {
	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			canvas.fillStyle = maze[i][j] === VISITED ? "#FF0000" : "#000000";
			canvas.fillRect(i * BLOCK_WIDTH, j * BLOCK_WIDTH, BLOCK_WIDTH, BLOCK_WIDTH);
		};
	};
};

var createMaze = function() {
	var maze = new Array(WIDTH);
	for (var i = maze.length - 1; i >= 0; i--) {
		maze[i] = new Array(HEIGHT);
	};

	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			maze[i][j] = UNVISITED;
		};
	};

	return maze;
}

$(document).ready(function() {
	var canvas = $("<canvas/>", { id: "maze" }).prop({ height: HEIGHT * BLOCK_WIDTH, width: WIDTH * BLOCK_WIDTH });

	$("body").append(canvas);

	var c = canvas[0].getContext("2d");

	var maze = createMaze();

	var cur = {
		x: 0,
		y: 0
	};

	var stack = [];
	stack.push(cur);

	var iterate = function() {
		maze[cur.x][cur.y] = VISITED;

		var neighbours = [];

		if (cur.x > 0 && maze[cur.x - 1][cur.y] === UNVISITED) neighbours.push({ x: cur.x - 1, y: cur.y });
		if (cur.x < WIDTH - 1 && maze[cur.x + 1][cur.y] === UNVISITED) neighbours.push({ x: cur.x + 1, y: cur.y });
		if (cur.y > 0 && maze[cur.x][cur.y - 1] === UNVISITED) neighbours.push({ x: cur.x, y: cur.y - 1 });
		if (cur.y < HEIGHT - 1 && maze[cur.x][cur.y + 1] === UNVISITED) neighbours.push({ x: cur.x, y: cur.y + 1 });

		while (neighbours.length > 0) {
			stack.push(neighbours.splice(Math.random() * neighbours.length, 1)[0]);
		}

		cur = stack.pop();

		render(maze, c);

		if (stack.length > 0) setTimeout(iterate, 100);
	};
	
	setTimeout(iterate, 100);
});

