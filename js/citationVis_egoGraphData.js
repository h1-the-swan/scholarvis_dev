var citationVis = citationVis || {};

citationVis.egoGraphData = (function(maxNodes) {
	function prepare_egoGraphData(graph) {
		for (i=0; i<graph.nodes.length; i++) {
			graph.nodes[i].oldIdx = i;
		}
		var newGraph = {};
		// Copy properties to newGraph that won't change:
		var propsToCopy = ['graph', 'directed', 'multigraph'];
		for (i=0; i<propsToCopy.length; i++) {
			var prop = propsToCopy[i];
			if (graph.hasOwnProperty(prop)) { newGraph[prop] = graph[prop]; }
		}

		newGraph.nodes = [];
		newGraph.nodes.push(graph.nodes[0]);
		newGraph.nodes[0].idx = 0;
		// // this is a test:
		// for (i=10; i<20; i++) {
		// 	var newNode = graph.nodes[i];
		// 	newNode.idx = newGraph.nodes.length;
		// 	newGraph.nodes.push(newNode);
		// }
		var notEgoNodes = [];
		// Filter out nodes that have year of 0
		for (var i=1; i<graph.nodes.length; i++) {
			// if ( (graph.nodes[i].EF > 0) && (graph.nodes[i].Year>0) ) {
			if (graph.nodes[i].Year>0) {
				notEgoNodes.push(graph.nodes[i]);
			}
		}
		// Start by randomizing the order of all the nodes
		d3.shuffle(notEgoNodes);
		// order descending by Eigenfactor
		// notEgoNodes.sort(function(a,b) { return b.EF - a.EF; });
		notEgoNodes.sort(function(a,b) { return d3.descending(a.EF, b.EF); });
		// // I don't want to remove any nodes that have a different DomainID than the ego,
		// // so I'll move those to the front to protect them.
		// // ACTUALLY there are too many to do this
		// var egoDomain = graph.nodes[0].DomainCounts[0].key;  // This is the most common domain id for the ego author's papers
		// var c = [];
		// for (var i=0; i<notEgoNodes.length; i++) {
		// 	if ( notEgoNodes[i].DomainID != egoDomain ) {
		// 		c.push(notEgoNodes[i].DomainID);
		// 		notEgoNodes.splice(0, 0, notEgoNodes.splice(i, 1)[0]);
		// 	}
		// }
		// Move papers that have a DomainID to the front
		function DomainIDToFront(arr) {
			var hasDomainID = [];
			var noDomainID = [];
			for (var i = 0, len = arr.length; i < len; i++) {
				if ( arr[i].DomainID != 0 ) {
					hasDomainID.push(arr[i]);
				} else {
					noDomainID.push(arr[i]);
				}
			}
			console.log(arr);
			var newArr = hasDomainID.concat(noDomainID);
			console.log(newArr);
			return newArr;
		}
		notEgoNodes = DomainIDToFront(notEgoNodes);
		// for (var i = notEgoNodes.length-1; i>=0; i--) {
		// 	if ( notEgoNodes[i].DomainID != 0 ) {
		// 		notEgoNodes.splice(0, 0, notEgoNodes.splice(i, 1)[0]);
		// 	}
		// }
		// console.log(c);
		// Take the first n items, where n = maxNodes
		// console.log(maxNodes);
		if (typeof maxNodes == 'undefined') {
			var maxNodes = 274;  // TODO: implement this better (so it's not hard coded here)
		}
		// var maxNodes = 5000;  // TODO: implement this better (so it's not hard coded here)
		if (notEgoNodes.length > maxNodes) {
			// self.allNodes = self.allNodes.slice(0, self.graphParams.maxNodes.value);
			notEgoNodes = notEgoNodes.slice(0, maxNodes);
		}
        // sort by Year
        // then sort by EF (size) so that larger nodes tend to appear first.
        // (this somewhat reduces the problem of sending out 
        // links to nodes that haven't appeared yet.
        // maybe try a better solution later.)
		notEgoNodes.sort(function(a,b) {
			return d3.ascending(a.Year, b.Year) || d3.descending(a.EF, b.EF);
		});

		// Append these to newGraph.nodes
		for (i=0; i<notEgoNodes.length; i++) {
			var newNode = notEgoNodes[i];
			newNode.idx = newGraph.nodes.length;
			newGraph.nodes.push(newNode);
		}

		newGraph.links = recalculateLinks(newGraph.nodes, graph.links);

		function recalculateLinks(nodes, links) {
			var newLinks = [];
			for (i=0; i<links.length; i++) {
				var thisSource = nodes.filter(function(d) { return d.oldIdx === links[i].source; });
				var thisTarget = nodes.filter(function(d) { return d.oldIdx === links[i].target; });
				if ( thisSource.length>0 && thisTarget.length>0 ) {
					if ( (thisTarget[0].nodeType === 'paper') && (thisSource[0].Year < thisTarget[0].Year) ) {
						// exclude the link in this case (i.e. if the source year is less than the target year
					} else {
						var newLink = links[i];
						newLink.source = thisSource[0].idx;
						newLink.target = thisTarget[0].idx;
						newLinks.push(links[i]);
					}
				}
			}
			newLinks.forEach(function(d) {
				if ( typeof d.target != 'number' ) console.log(d);
			});

			return newLinks;
		}

		var yearRange = newGraph.graph.yearRange;
		function getNodeCountsPerYear(nodes, yearRange) {
			var yearsNest = d3.nest()
				.key(function(d) { return d.Year; }).sortKeys(d3.ascending)
				.rollup(function(leaves) { return leaves.length; })
				// .entries(nodes.slice(1));  // all except ego node (node[0])
				.map(nodes.slice(1));

			var nodeCountsPerYear = {};
			for (var i=yearRange[0]; i<=yearRange[1]; i++) {
				var countThisYear = yearsNest[i];
				if (typeof countThisYear === 'undefined') {
					nodeCountsPerYear[i] = 0;
				} else {
					nodeCountsPerYear[i] = countThisYear;
				}
			}
			return nodeCountsPerYear;
		}
		newGraph.graph.nodeCountsPerYear = getNodeCountsPerYear(newGraph.nodes, yearRange);


		return newGraph;
	}

	return {
		prepare_egoGraphData: prepare_egoGraphData
	};
}());

