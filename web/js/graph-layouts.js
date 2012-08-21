GraphLayout = {};
GraphLayout.WeakOrdering = {
	layout: function (graph) {
		var levels = {};
		var size = [0, 0];
		var doubleEdges = [];

		for (var i = 0; i < graph.edges.length - 1; i++) {
			if (graph.edges[i].source == graph.edges[i + 1].source &&
				graph.edges[i].target == graph.edges[i + 1].target)
			{
				console.log()
				graph.edges[i].options.bending = -1;
				graph.edges[i + 1].options.bending = 1;
			}
		}
		
		$.each(graph.vertices, function(i, v) {
			if (!levels[v.options.twistedLength]) {
				levels[v.options.twistedLength] = [];
			}

			levels[v.options.twistedLength].push(i);
			
			if (size[0] < levels[v.options.twistedLength].length) size[0] = levels[v.options.twistedLength].length;
			if (size[1] < v.options.twistedLength) size[1] = v.options.twistedLength;
		});
		
		$.each(levels, function(twistedLength, vertexIndices) {
			$.each(vertexIndices, function (i, vertexIndex) {
				graph.vertices[vertexIndex].positionX = parseFloat((size[0] - vertexIndices.length) / 2 - (size[0] - 1) / 2 + i) * 75;
				graph.vertices[vertexIndex].positionY = -parseFloat(twistedLength) * 150;
			});
		});
	}
};
