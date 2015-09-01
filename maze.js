var HEIGHT = 80;
var WIDTH = 80;
var BLOCK_WIDTH = 10;

var render = function(maze, canvas) {
	for (var i = maze.length - 1; i >= 0; i--) {
		for (var j = maze[i].length - 1; j >= 0; j--) {
			canvas.fillStyle = maze[i][j] === VISITED ? "#FF0000" : "#000000";
			canvas.fillRect(i * BLOCK_WIDTH, j * BLOCK_WIDTH, BLOCK_WIDTH, BLOCK_WIDTH);
		};
	};
};

var UNVISITED = 0;
var VISITED = 1;

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

	while (next.length > 0) {
		maze[cur.x][cur.y] = VISITED;

		var next = [];

		if (cur.x > 0) next.push({ x: cur.x - 1, y: cur.y });
		if (cur.x < WIDTH) next.push({ x: cur.x + 1, y: cur.y });
		if (cur.y > 0) next.push({ x: cur.x, y: cur.y - 1 });
		if (cur.y < HEIGHT) next.push({ x: cur.x, y: cur.y + 1 });

		cur = next[Math.random() * next.length];
	}


	render(maze, c);
});

