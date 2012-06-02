Graph = function (element, width, height) {
	var graph = this;
	
	graph.element = element;
	graph.width = width;
	graph.height = height;
	graph.vertices = {};
	graph.edges = [];
	graph.scale = new GraphScale.Linear(0, 100, 0, 100, graph.width, graph.height);
	
//	$(graph.element).mousewheel(function (event, delta) {
//		var x = delta == 1 ? graph.scale.unscaleX(event.pageX - $(graph.element).offset().left) : (graph.scale.maxX + graph.scale.minX) / 2.0;
//		var y = delta == 1 ? graph.scale.unscaleX(event.pageY - $(graph.element).offset().top) : (graph.scale.maxY + graph.scale.minY) / 2.0;
//		
//		var newXrange = (graph.scale.maxX - graph.scale.minX) * (1.0 - delta * 0.2);
//		var newYrange = (graph.scale.maxY - graph.scale.minY) * (1.0 - delta * 0.2);
//
//		graph.scale = new GraphScale.Linear(x - newXrange / 2, x + newXrange / 2, y - newYrange / 2, y + newYrange / 2, graph.width, graph.height);
//		graph.draw();
//		
//		return false;
//	});
	
	$(graph.element).dblclick(function () {
		if ($(graph.element).css('position') != 'fixed') {
			$(graph.element).css({
				'position': 'fixed',
				'z-index': 10000,
				'left': 0,
				'top': 0,
				'right': 0,
				'bottom': 0,
				'max-height': 'none'
			});
		} else {
			$(graph.element).css({
				'position': 'static',
				'z-index': 0,
				'max-height': '400px'
			});
		}
	});
};

Graph.prototype = {
	addVertex: function(id, options) {
		options = $.extend({
			label: id,
			visible: true
		}, options);
		
		var vertex = new GraphVertex(id, options);
		this.vertices[id] = vertex;
		return vertex;
	},
	
	addEdge: function(sourceVertexId, targetVertexId, options) {
		options = $.extend({
			label: '',
			directed: false,
			visible: true
		}, options);
		
		var source = this.vertices[sourceVertexId];
		var target = this.vertices[targetVertexId];
		
		if (!source)
			throw 'Unknown vertex id \'' + sourceVertexId + '\'';
		if (!target)
			throw 'Unknown vertex id \'' + targetVertexId + '\'';
		
		var edge = new GraphEdge(source, target, options);
		this.edges.push(edge);
		return edge;
	},
	
	draw: function() {
		var graph = this;
		
		$(graph.element).html('');
		var canvas = Raphael(graph.element, graph.width, graph.height);

		$.each(this.edges, function(i, edge) {
			if (!edge.options.visible || !edge.source.options.visible || !edge.target.options.visible) return;

			var x1 = graph.scale.scaleX(edge.source.positionX);
			var y1 = graph.scale.scaleY(edge.source.positionY);
			var x2 = graph.scale.scaleX(edge.target.positionX);
			var y2 = graph.scale.scaleY(edge.target.positionY);
			
			var line = canvas.path('M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2);
			var text = canvas.text((x1 + x2) / 2.0, (y1 + y2) / 2.0, edge.options.label);
		});
		
		$.each(this.vertices, function(id, vertex) {
			if (!vertex.options.visible) return;
			
			var x = graph.scale.scaleX(vertex.positionX);
			var y = graph.scale.scaleY(vertex.positionY);
			
			var rect = canvas.rect(x - 40, y - 10, 80, 20, 4);
			rect.attr('fill', '#fff');
			var text = canvas.text(x, y, vertex.options.label);
		});
	}
};

GraphVertex = function (id, options) {
	this.id = id;
	this.positionX = 0.0;
	this.positionY = 0.0;
	this.options = options;
};

GraphVertex.prototype = {
	hide: function () {
		this.options.visible = false;
	},
	
	show: function () {
		this.options.visible = true;
	}
};

GraphEdge = function (sourceVertex, targetVertex, options) {
	this.source = sourceVertex;
	this.target = targetVertex;
	this.options = options;
};

GraphEdge.prototype = {
	hide: function () {
		this.options.visible = false;
	},
	
	show: function () {
		this.options.visible = true;
	}
};

GraphScale = {};
GraphScale.Linear = function(minX, maxX, minY, maxY, width, height) {
	this.minX = minX;
	this.maxX = maxX;
	this.minY = minY;
	this.maxY = maxY;
	this.width = width;
	this.height = height;
	
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
		return (x - this.minX) / (this.maxX - this.minX) * this.width;
	},
	scaleY: function (y) {
		return (y - this.minY) / (this.maxY - this.minY) * this.height;
	},
	unscaleX: function (x) {
		return (x / this.width) * (this.maxX - this.minX) + this.minX;
	},
	unscaleY: function (y) {
		return (y / this.height) * (this.maxY - this.minY) + this.minY;
	}
}

