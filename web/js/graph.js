Graph = function (element) {
	var graph = this;
	
	graph.element = element;
	graph.canvas = Raphael(graph.element);
	graph.edgesAnchor = graph.canvas.rect();
	graph.verticesAnchor = graph.canvas.rect();
	graph.frontAnchor = graph.canvas.rect();
	graph.vertices = {};
	graph.edges = [];
	graph.scale = new GraphScale.None();
	graph.edgeColors = [];

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
			if (v.isVisible()) {
				if (v.positionX < bbox[0]) bbox[0] = v.positionX;
				if (v.positionX > bbox[1]) bbox[1] = v.positionX;
				if (v.positionY < bbox[2]) bbox[2] = v.positionY;
				if (v.positionY > bbox[3]) bbox[3] = v.positionY;
			}
		});
		
		if (bbox[0] == Infinity) {
			bbox[0] = 0.0;
			bbox[1] = 0.0;
			bbox[2] = 0.0;
			bbox[3] = 0.0;
		}
		
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
			highlighted: false,
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
			highlighted: false,
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

	showAll: function(order) {
		this.showAllVertices(order);
		this.showAllEdges(order);
	},

	hideAll: function(order) {
		this.hideAllVertices(order);
		this.hideAllEdges(order);
	},
	
	showAllVertices: function(order) {
		$.each(this.vertices, function (i, vertex) { vertex.show(order); });
	},

	hideAllVertices: function(order) {
		$.each(this.vertices, function (i, vertex) { vertex.hide(order); });
	},
	
	showAllEdges: function(order) {
		$.each(this.edges, function (i, edge) { edge.show(order); });
	},

	hideAllEdges: function(order) {
		$.each(this.edges, function (i, edge) { edge.hide(order); });
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
			vertexSelector: function (v) {
				return true;
			},
			edgeCallback: function (e) {
			},
			vertexCallback: function (v) {
			},
			direction: 1
		}, options);
		
		var verticesRemaining = options.notVertexCallback ? $.extend({}, this.vertices) : {};
		var edgesRemaining = options.notEdgeCallback ? [].concat(this.edges) : [];
		
		var stack = new Array();
		var walkedVertices = new Array();
		var walkedEdges = new Array();
		stack.push(startVertex);
		
		while (stack.length > 0) {
			var v = stack.pop();
			if (verticesRemaining[v.id]) delete verticesRemaining[v.id];
			
			if ($.inArray(v, walkedVertices) != -1) continue;
			walkedVertices.push(v);
			
			if (!options.vertexSelector(v)) return;
			options.vertexCallback(v);
			
			$.each(v.edges, function (i, e) {
				if (options.direction == 1 && e.source != v) return;
				if (options.direction == -1 && e.target != v) return;
				if ($.inArray(e, walkedEdges) != -1) return;
				walkedEdges.push(e);
				
				var p = $.inArray(e, edgesRemaining);
				if (p != -1) {
					edgesRemaining.splice(p, 1);
				}
				
				if (!options.edgeSelector(e)) return;
				
				options.edgeCallback(e);
				
				if (e.source == v) stack.push(e.target);
				if (e.target == v) stack.push(e.source);
			});
		}
		
		$.each(verticesRemaining, function (id, v) {
			options.notVertexCallback(v);
		});
		
		$.each(edgesRemaining, function (i, e) {
			options.notEdgeCallback(e);
		});
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
	this.enabled = options.disabled ? false : true;
	this.visibility = { 0: options.visible ? true : false };
};

GraphVertex.prototype = {
	hide: function (order) {
		if (order == -1) {
			this.visibility = { 0: false };
		} else {
			this.visibility[order || 0] = false;
		}

		if (!this.isVisible() && this.element != null) {
			this.element.hide();
		}
	},

	show: function (order) {
		if (order == -1) {
			this.visibility = { 0: true };
		} else {
			this.visibility[order || 0] = true;
		}
		
		if (this.isVisible() && this.element != null) {
			this.element.show();
		}
	},
	
	isVisible: function () {
		if (!this.enabled) return false;
		
		var result = true;
		
		$.each(this.visibility, function (order, value) {
			if (!value) {
				result = false;
			}
		});
		
		return result;
	},
	
	enable: function () {
		if (!this.enabled) {
			this.enabled = true;
			this.draw();
		}
	},
	
	disable: function () {
		this.enabled = false;
		
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
	},
	
	highlight: function () {
		if (!this.options.highlighted) {
			this.options.highlighted = true;
			
			if (this.element) {
				this.element.insertBefore(this.graph.frontAnchor);
			}
			
			this.draw();
		}
	},
	
	unhighlight: function () {
		if (this.options.highlighted) {
			this.options.highlighted = false;
			this.draw();
		}
	},

	draw: function () {
		var vertex = this;
		var graph = vertex.graph;
		var canvas = graph.canvas;
		
		if (!vertex.enabled) return;

		var x = graph.scale.scaleX(vertex.positionX);
		var y = graph.scale.scaleY(vertex.positionY);

		var circ = vertex.element;
		
		if (circ == null) {
			circ = canvas.circle(x, y, 10);
			circ.insertBefore(graph.frontAnchor);

			if (vertex.options.click) circ.click(function (event) {
				vertex.options.click(vertex, event);
			});
			
			if (vertex.options.dblclick) circ.dblclick(function (event) {
				vertex.options.dblclick(vertex, event);
			});

			if (vertex.options.drag) {
				var state = {};
				var internalState = {};
				circ.drag(
					function (dxRaw, dyRaw, xRaw, yRaw, event) {
						if (internalState.started) {
							var x = graph.scale.unscaleX(internalState.x + dxRaw / graph.zoom);
							var y = graph.scale.unscaleY(internalState.y + dyRaw / graph.zoom);
							
							vertex.options.drag(vertex, x - internalState.x, y - internalState.y, x, y, state, event);
						}
						
						var diffRaw = { x: internalState.screenX - xRaw, y: internalState.screenY - yRaw };
						
						if (!internalState.started && Math.sqrt(diffRaw.x*diffRaw.x + diffRaw.y*diffRaw.y) > 5) {
							internalState.started = true;
							if (vertex.options.dragStart) {
								vertex.options.dragStart(vertex, internalState.x, internalState.y, state, event);
							}
						}
					},
					function (x, y, event) {
						state = {};
						internalState = { x: graph.scale.scaleX(vertex.positionX), y: graph.scale.scaleY(vertex.positionY), screenX: x, screenY: y, started: false };
					}
				);
			}

			vertex.element = circ;
			if (vertex.isVisible() != true) vertex.element.hide();
		}
		
		circ.attr({ 'cx': x, 'cy': y });
		circ.attr({ 'fill': '#ffffff', 'title': vertex.options.label });
		circ.attr({ 'fill-opacity': vertex.options.opacity, 'stroke-opacity': vertex.options.opacity });
		
		if (vertex.options.highlighted) {
			circ.attr({ 'stroke': '#ff0000', 'stroke-width': 6 });
		} else {
			circ.attr({ 'stroke': '#dddddd', 'stroke-width': 3 });
		}
	}
};

GraphEdge = function (graph, sourceVertex, targetVertex, options) {
	this.graph = graph;
	this.source = sourceVertex;
	this.target = targetVertex;
	this.options = options;
	this.element = null;
	this.enabled = options.disabled ? false : true;
	this.visibility = { 0: options.visible ? true : false };
};

GraphEdge.prototype = {
	hide: function (order) {
		if (order == -1) {
			this.visibility = { 0: false };
		} else {
			this.visibility[order || 0] = false;
		}

		if (!this.isVisible() && this.element != null) {
			this.element.hide();
		}
	},

	show: function (order) {
		if (order == -1) {
			this.visibility = { 0: true };
		} else {
			this.visibility[order || 0] = true;
		}
		
		if (this.isVisible() && this.element != null) {
			this.element.show();
		}
	},
	
	isVisible: function () {
		if (!this.enabled) return false;
		
		var result = true;
		
		$.each(this.visibility, function (order, value) {
			if (!value) {
				result = false;
			}
		});
		
		return result;
	},
	
	enable: function () {
		if (!this.enabled) {
			this.enabled = true;
			this.draw();
		}
	},
	
	disable: function () {
		this.enabled = false;
		
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
	},
	
	highlight: function () {
		if (!this.options.highlighted) {
			this.options.highlighted = true;
			
			if (this.element) {
				this.element.insertBefore(this.graph.verticesAnchor);
			}
			
			this.draw();
		}
	},
	
	unhighlight: function () {
		if (this.options.highlighted) {
			this.options.highlighted = false;
			this.draw();
		}
	},

	draw: function () {
		var edge = this;
		var graph = edge.graph;
		var canvas = graph.canvas;
		
		if (!edge.enabled) return;
		
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
			line.insertBefore(graph.verticesAnchor);
		}

		line.attr('path', 'M' + x1 + ',' + y1 + 'Q' + x3 + ',' + y3 + ' ' + x2 + ',' + y2);
		line.attr({ 'fill-opacity': edge.options.opacity, 'stroke-opacity': edge.options.opacity });
		if (edge.options.type == 0) {
			line.attr({ 'stroke-dasharray': '- ' });
		}
		if (edge.options.color) {
			line.attr({ 'stroke': edge.options.color });
		}
		edge.element = line;
		if (!edge.isVisible()) edge.element.hide();
		
		if (edge.options.highlighted) {
			line.attr({ 'stroke-width': 6 });
		} else {
			line.attr({ 'stroke-width': 3 });
		}
	}
};
