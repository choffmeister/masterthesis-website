ColorHelper = {
	hsvToRgb: function (h, s, v) {
		  var h_i = Math.floor(h*6);
		  var f = h*6 - h_i;
		  var p = v * (1 - s);
		  var q = v * (1 - f*s);
		  var t = v * (1 - (1 - f) * s);
		  
		  var rgb = [];
		  if (h_i == 0) rgb = [v, t, p];
		  if (h_i == 1) rgb = [q, v, p];
		  if (h_i == 2) rgb = [p, v, t];
		  if (h_i == 3) rgb = [p, q, v];
		  if (h_i == 4) rgb = [t, p, v];
		  if (h_i == 5) rgb = [v, p, q];

		  rgb = [Math.floor(rgb[0]*256), Math.floor(rgb[1]*256), Math.floor(rgb[2]*256), '#'];
		  rgb[3] += rgb[0] < 16 ? '0' + rgb[0].toString(16) : rgb[0].toString(16);
		  rgb[3] += rgb[1] < 16 ? '0' + rgb[1].toString(16) : rgb[1].toString(16);
		  rgb[3] += rgb[2] < 16 ? '0' + rgb[2].toString(16) : rgb[2].toString(16);
		  
		  return rgb;
	},
	
	colorList: function(n, s, v) {
		var goldenRatioConjugate = 0.618033988749895;
		var h = 0.1; //Math.random();

		var colors = [];
		
		for (var i = 0; i < n; i++) {
			h += goldenRatioConjugate;
			h = h - Math.floor(h);
			
			colors.push(this.hsvToRgb(h, s, v));
		}
		
		return colors;
	}
};

Graph = function (element, width, height) {
	var graph = this;
	
	graph.element = element;
	graph.width = width;
	graph.height = height;
	graph.vertices = {};
	graph.edges = [];
	graph.scale = new GraphScale.Linear(graph, 0, 100, 0, 100);
	
	$(graph.element).dblclick(function () {
		$(graph.element).toggleClass('graph-fullscreen');
	});
};

Graph.prototype = {
	addVertex: function(id, options) {
		options = $.extend({
			label: id,
			highlighted: false,
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
			highlighted: false,
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
		source.edges.push(edge);
		target.edges.push(edge);
		return edge;
	},
	
	draw: function() {
		var graph = this;
		var colors = ColorHelper.colorList(25, 0.8, 0.99);
		
		$(graph.element).html('');
		var canvas = Raphael(graph.element, graph.width, graph.height);
		
		$.each(this.edges, function(i, edge) {
			if (!edge.options.visible || !edge.source.options.visible || !edge.target.options.visible) return;

			var x1 = graph.scale.scaleX(edge.source.positionX);
			var y1 = graph.scale.scaleY(edge.source.positionY);
			var x2 = graph.scale.scaleX(edge.target.positionX);
			var y2 = graph.scale.scaleY(edge.target.positionY);
			
			var line = canvas.path('M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2);
			line.attr({ 'stroke-width': 1 });
			if (edge.options.type == 0) {
				line.attr({ 'stroke-dasharray': '- ' });
			}
			
			line.attr({ 'stroke': colors[edge.options.label][3], 'title': edge.options.label });
		});
		
		$.each(this.vertices, function(id, vertex) {
			if (!vertex.options.visible) return;
			
			var x = graph.scale.scaleX(vertex.positionX);
			var y = graph.scale.scaleY(vertex.positionY);
			
			var circ = canvas.circle(x, y, 10);
			circ.attr({ 'fill': '#ffffff', 'stroke': '#dddddd', 'stroke-width': 3, 'title': vertex.options.label });
		});
	},
	
	walk: function(options) {
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
			}
		}, options);
		
		var stack = new Array();
		var walkedVertices = new Array();
		var walkedEdges = new Array();
		stack.push(this.vertices["e"]);
		
		while (stack.length > 0) {
			var v = stack.pop();
			
            if ($.inArray(v, walkedVertices) != -1) continue;
            walkedVertices.push(v);
			
        	if (!options.vertexSelector(v)) return;
        	options.vertexCallback(v);
            
            $.each(v.edges, function (i, e) {
                if (e.source != v) return;
                if ($.inArray(e, walkedEdges) != -1) return;
                walkedEdges.push(e);
                
                if (!options.edgeSelector(e)) return;
                
                options.edgeCallback(e);
                stack.push(e.target);
            });
		}
	}
};

GraphVertex = function (id, options) {
	this.id = id;
	this.positionX = 0.0;
	this.positionY = 0.0;
	this.edges = [];
	this.options = options;
};

GraphVertex.prototype = {
	hide: function () {
		this.options.visible = false;
	},
	
	show: function () {
		this.options.visible = true;
	},
	
	unhighlight: function () {
		this.options.highlighted = false;
	},
	
	highlight: function () {
		this.options.highlighted = true;
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
	},
	
	unhighlight: function () {
		this.options.highlighted = false;
	},
	
	highlight: function () {
		this.options.highlighted = true;
	}
};

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
}
