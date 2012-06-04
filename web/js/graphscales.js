GraphScale = {};

GraphScale.Linear = function(graph, minX, maxX, minY, maxY) {
	this.graph = graph;
	this.minX = minX;
	this.maxX = maxX;
	this.minY = minY;
	this.maxY = maxY;

	if (maxX < minX)
		throw 'Maximal X cannot be smaller than minimal X';
	if (maxY < minY)
		throw 'Maximal Y cannot be smaller than minimal Y';

	if (minX == maxX) {
		minX -= 0.0001;
		maxX += 0.0001;
	}

	if (minY == maxY) {
		minY -= 0.0001;
		maxX += 0.0001;
	}
};

GraphScale.Linear.prototype = {
	scaleX: function (x) {
		return (x - this.minX) / (this.maxX - this.minX) * this.graph.width;
	},
	scaleY: function (y) {
		return (y - this.minY) / (this.maxY - this.minY) * this.graph.height;
	},
	unscaleX: function (x) {
		return (x / this.graph.width) * (this.maxX - this.minX) + this.minX;
	},
	unscaleY: function (y) {
		return (y / this.graph.height) * (this.maxY - this.minY) + this.minY;
	}
};

GraphScale.Quadratic = function(graph, minX, maxX, minY, maxY) {
	this.graph = graph;
	this.minX = minX;
	this.maxX = maxX;
	this.minY = minY;
	this.maxY = maxY;

	if (maxX < minX)
		throw 'Maximal X cannot be smaller than minimal X';
	if (maxY < minY)
		throw 'Maximal Y cannot be smaller than minimal Y';

	if (minX == maxX) {
		minX -= 0.0001;
		maxX += 0.0001;
	}

	if (minY == maxY) {
		minY -= 0.0001;
		maxX += 0.0001;
	}
};

GraphScale.Quadratic.prototype = {
	scaleX: function (x) {
		var lambda = (x - this.minX) / (this.maxX - this.minX);

		return lambda * lambda * this.graph.width;
	},
	scaleY: function (y) {
		var lambda = (y - this.minY) / (this.maxY - this.minY);

		return lambda * lambda * this.graph.height;
	},
	unscaleX: function (x) {
		var lambda = (x / this.graph.width);

		return Math.sqrt(lamba) * (this.maxX - this.minX) + this.minX;
	},
	unscaleY: function (y) {
		var lambda = (y / this.graph.height);

		return Math.sqrt(lambda) * (this.maxY - this.minY) + this.minY;
	}
};
