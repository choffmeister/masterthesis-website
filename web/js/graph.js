Graph = function (element) {
	var graph = this;
	
	graph.element = element;
	graph.canvas = Raphael(graph.element);
	graph.vertices = {};
	graph.edges = [];
	graph.scale = new GraphScale.None();
	
	graph.zoom = 1.0;
	graph.center = [0.0, 0.0];
	graph.updateViewPort();
};

Graph.prototype = {
	zoomSpeed: 0.2,
	panSpeed: 20.0,

	zoomIn: function () {
		this.zoom *= (1.0 + this.zoomSpeed);
		this.updateViewPort();
	},

	zoomOut: function () {
		this.zoom /= (1.0 + this.zoomSpeed);
		this.updateViewPort();
	},
	
	panUp: function () {
		this.center[1] += this.panSpeed / this.zoom;
		this.updateViewPort();
	},

	panDown: function () {
		this.center[1] -= this.panSpeed / this.zoom;
		this.updateViewPort();
	},

	panLeft: function () {
		this.center[0] += this.panSpeed / this.zoom;
		this.updateViewPort();
	},

	panRight: function () {
		this.center[0] -= this.panSpeed / this.zoom;
		this.updateViewPort();
	},
	
	clear: function () {
		this.canvas.clear();
		this.vertices = {};
		this.edges = []
	},
	
	resetViewPort: function () {
		var bbox = [Infinity, -Infinity, Infinity, -Infinity];
		
		$.each(this.vertices, function (i, v) {
			if (v.positionX < bbox[0]) bbox[0] = v.positionX;
			if (v.positionX > bbox[1]) bbox[1] = v.positionX;
			if (v.positionY < bbox[2]) bbox[2] = v.positionY;
			if (v.positionY > bbox[3]) bbox[3] = v.positionY;
		});
		
		bbox[0] -= 15.0;
		bbox[1] += 15.0;
		bbox[2] -= 15.0;
		bbox[3] += 15.0;

		this.center[0] = (bbox[0] + bbox[1]) / 2.0;
		this.center[1] = (bbox[2] + bbox[3]) / 2.0;

		var width = $(this.element).width();
		var height = $(this.element).height();
		
		var zoom1 = width / (bbox[1] - bbox[0]);
		var zoom2 = height / (bbox[3] - bbox[2]);
		
		this.zoom = Math.min(zoom1, zoom2);

		this.updateViewPort();
	},
	
	updateViewPort: function () {
		var width = $(this.element).width();
		var height = $(this.element).height();

		this.canvas.setSize(width, height);
		this.canvas.setViewBox(-(width*0.5 / this.zoom) + this.center[0], -(height*0.5 / this.zoom) + this.center[1], width / this.zoom, height / this.zoom); 
	},

	addVertex: function(id, options) {
		options = $.extend({
			label: id,
			opacity: 1.0,
			visible: true
		}, options);
		
		var vertex = new GraphVertex(this, id, options);
		this.vertices[id] = vertex;
		return vertex;
	},
	
	addEdge: function(sourceVertexId, targetVertexId, options) {
		options = $.extend({
			label: '',
			bending: 0,
			directed: false,
			opacity: 1.0,
			visible: true
		}, options);
		
		var source = this.vertices[sourceVertexId];
		var target = this.vertices[targetVertexId];
		
		if (!source)
			throw 'Unknown vertex id \'' + sourceVertexId + '\'';
		if (!target)
			throw 'Unknown vertex id \'' + targetVertexId + '\'';
		
		var edge = new GraphEdge(this, source, target, options);
		this.edges.push(edge);
		source.edges.push(edge);
		target.edges.push(edge);
		return edge;
	},

	showAll: function() {
		$.each(this.edges, function (i, edge) { edge.show(); });
		$.each(this.vertices, function (i, vertex) { vertex.show(); });
	},

	hideAll: function() {
		$.each(this.edges, function (i, edge) { edge.hide(); });
		$.each(this.vertices, function (i, vertex) { vertex.hide(); });
	},

	draw: function() {
		var graph = this;
		
		$.each(this.edges, function(i, edge) { edge.draw(); });
		$.each(this.vertices, function(id, vertex) { vertex.draw(); });
	},
	
	walk: function(startVertex, options) {
		options = $.extend({
			edgeSelector: function (e) {
				return true;
			},
			vertexSelector: function (e) {
				return true;
			},
			edgeCallback: function (e) {
			},
			vertexCallback: function (v) {
			},
			direction: 1
		}, options);
		
		var stack = new Array();
		var walkedVertices = new Array();
		var walkedEdges = new Array();
		stack.push(startVertex);
		
		while (stack.length > 0) {
			var v = stack.pop();
			
			if ($.inArray(v, walkedVertices) != -1) continue;
			walkedVertices.push(v);
			
			if (!options.vertexSelector(v)) return;
			options.vertexCallback(v);
			
			$.each(v.edges, function (i, e) {
				if (options.direction == 1 && e.source != v) return;
				if (options.direction == -1 && e.target != v) return;
				if ($.inArray(e, walkedEdges) != -1) return;
				walkedEdges.push(e);
				
				if (!options.edgeSelector(e)) return;
				
				options.edgeCallback(e);
				
				if (e.source == v) stack.push(e.target);
				if (e.target == v) stack.push(e.source);
			});
		}
	}
};

GraphVertex = function (graph, id, options) {
	this.graph = graph;
	this.id = id;
	this.positionX = 0.0;
	this.positionY = 0.0;
	this.edges = [];
	this.options = options;
	this.element = null;
};

GraphVertex.prototype = {
	hide: function () {
		this.options.visible = false;

		if (this.element != null) {
			this.element.hide();
		}
	},

	show: function () {
		this.options.visible = true;
		
		if (this.element != null) {
			this.element.show();
		}
	},

	draw: function () {
		var vertex = this;
		var graph = vertex.graph;
		var canvas = graph.canvas;

		var x = graph.scale.scaleX(vertex.positionX);
		var y = graph.scale.scaleY(vertex.positionY);

		var circ = vertex.element;
		
		if (circ == null) {
			circ = canvas.circle(x, y, 10);

			if (vertex.options.click) circ.click(function (event) {
				vertex.options.click(vertex, event);
			});
			
			var startX = 0;
			var startY = 0;
			circ.drag(function (dx, dy) {
				vertex.positionX = graph.scale.unscaleX(startX + dx / graph.zoom);
				vertex.positionY = graph.scale.unscaleY(startY + dy / graph.zoom);
				vertex.draw();
				
				$.each(vertex.edges, function (i, e) { e.draw(); });
			}, function () {
				startX = graph.scale.scaleX(vertex.positionX);
				startY = graph.scale.scaleY(vertex.positionY);
			});

			vertex.element = circ;
			if (vertex.options.visible != true) vertex.element.hide();
		}
		
		circ.attr({ 'cx': x, 'cy': y });
		circ.attr({ 'fill': '#ffffff', 'stroke': '#dddddd', 'stroke-width': 3, 'title': vertex.options.label });
		circ.attr({ 'fill-opacity': vertex.options.opacity, 'stroke-opacity': vertex.options.opacity });
	}
};

GraphEdge = function (graph, sourceVertex, targetVertex, options) {
	this.graph = graph;
	this.source = sourceVertex;
	this.target = targetVertex;
	this.options = options;
	this.element = null;
};

GraphEdge.prototype = {
	hide: function () {
		this.options.visible = false;

		if (this.element != null) {
			this.element.hide();
		}
	},

	show: function () {
		this.options.visible = true;
		
		if (this.element != null) {
			this.element.show();
		}
	},

	draw: function () {
		var edge = this;
		var graph = edge.graph;
		var canvas = graph.canvas;

		var x1 = graph.scale.scaleX(edge.source.positionX);
		var y1 = graph.scale.scaleY(edge.source.positionY);
		var x2 = graph.scale.scaleX(edge.target.positionX);
		var y2 = graph.scale.scaleY(edge.target.positionY);
		
		var nx = -(y2 - y1);
		var ny = x2 - x1;
		var tmp = Math.sqrt(nx*nx + ny*ny);
		nx = nx / tmp;
		ny = ny / tmp;

		var x3 = (x1 + x2) / 2.0 + nx * 10 * edge.options.bending;
		var y3 = (y1 + y2) / 2.0 + ny * 10 * edge.options.bending;

		var line = edge.element;
		
		if (line == null) {
			var line = canvas.path('M' + x1 + ',' + y1 + 'Q' + x3 + ',' + y3 + ' ' + x2 + ',' + y2);
		}

		line.attr('path', 'M' + x1 + ',' + y1 + 'Q' + x3 + ',' + y3 + ' ' + x2 + ',' + y2);
		line.attr({ 'stroke-width': 3, 'fill-opacity': edge.options.opacity, 'stroke-opacity': edge.options.opacity });
		if (edge.options.type == 0) {
			line.attr({ 'stroke-dasharray': '- ' });
		}
		if (edge.options.color) {
			line.attr({ 'stroke': edge.options.color });
		}
		edge.element = line;
		if (edge.options.visible != true) edge.element.hide();
	}
};
