// http://codereview.stackexchange.com/questions/77614/capitalize-the-first-character-of-all-words-even-when-following-a
String.prototype.capitalize = function() {
    return this.toLowerCase().replace( /\b\w/g, function(m) {
        return m.toUpperCase();
    });
};


function egoGraphVis(data) {
	var self = this;
	self.data = data;
	self.notEgoNodes = self.data.nodes.slice(1);
	console.log(self.data);

	// Defaults
	// Graph SVG Dimensions
    // self.graphDimensions = {
    //     width: 960,
    //     height: 500
    // };
	self.graphDimensions;  // imported in self.importDefaultOptions below
	
	self.colorScheme;

    // Node placement options:
    // "force1": nodes placed by running the force layout and then freezing
    // "spiral" places the nodes in a spiral formation with the ego node at the center
	// "spiral2": alternate spiral algorithm
    // ADD MORE
    self.nodePlacementOptions = ["force1",
                                 "spiral",
								 "spiral2"];
	self.nodePlacement = self.nodePlacementOptions[1];
	
	self.zoomable = true;

	self.svg;
    self.group;
	self.node;
	self.link;
	self.egoNode;

	self.eigenFactorScale;

	self.loadingText;

	self.domainsThisGraph;
    self.legend;

    self.yearTextDisplay;

    self.authorImageDiv;

    self.tooltip;

	self.tick;
	self.force;

    // See http://colorbrewer2.org/?type=qualitative&scheme=Set1&n=8
    // self.colorScheme = ['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)',
	// 	'rgb(152,78,163)','rgb(255,127,0)','rgb(255,255,51)',
	// 	'rgb(166,86,40)','rgb(247,129,191)']
    // // I liked the blue better for the main color, so the next line just moves
    // // the blue color (originally self.colorScheme[1]) to the front (self.colorScheme[0])
    // self.colorScheme.splice(0, 0, self.colorScheme.splice(1, 1)[0])
	self.colorScheme;  // imported in importDefaultOptions below

    // Opacity values
    self.opacityVals = {
		node: 1, 
		nodePrevYear: .6,
		linkToEgo: .12,
		linkNotToEgo: .12,
		linkPrevYear: .04
	};

    // Put everything into a graphParams object:
    self.graphParams = {
		opacityVals: {value: self.opacityVals},
		colorScheme: {value: self.colorScheme},
		// transitionTimePerYear: {value: 2000},  //in milliseconds
		maxNodes: {value: 100},
		nodePlacement: {value: self.nodePlacement},
		doAnnotations: {value: false}
    };
    // Set all the params to 'updated' = false:
    for (var p in self.graphParams) {
		if (self.graphParams.hasOwnProperty(p)) {
			self.graphParams[p]['updated'] = false;
		}
    }

    self.animationState;  // "forward", "rewind", "stopped"
	self.transitionTimePerYear;
	self.transitionTimePerNode = 100;  // TEST
    // self.nodeAppearDuration = self.transitionTimePerNode * 4;
	// I haven't actually gotten it to work having different transitionTimePerNode and nodeAppearDuration
	self.linkAppearDuration = 500;
    self.currNodeIndex;  // Index of node currently being annotated
    self.destinationNodeIndex;  // Index of node to which the animation is currently moving
    self.destinationYear;
    self.currYear;

	// self.destinationNodeIndex = 200;  // TEST
	self.destinationNodeIndex = self.data.nodes.length-1;  // TEST

	//testing
	self.c = 0;
	self.tt = 0;

	// self.init();

	return self;

}

egoGraphVis.prototype.init = function() {
	var self = this;

    self.tick = self.makeTick();
    self.force = self.makeForce();
	if (self.zoomable === true) {
		self.zoom = self.makeZoom();
	}
    // self.drag = self.makeDrag();
	
	self.animationState = 'init';

	self.getDomainsThisGraph();

	self.svg = d3.select('#graphDiv').append('svg')
		.attr('id', 'graphSvg')
		.attr('width', self.graphDimensions.width)
		.attr('height', self.graphDimensions.height);
    // Let the user know that it is loading:
	// self.loadingText = self.svg.append('text')
	// 	.attr('id', 'loadingText')
	// 	.attr('text-anchor', 'middle')
	// 	.attr('x', self.graphDimensions.width/2)
	// 	.attr('y', self.graphDimensions.height/2)
	// 	.attr('pointer-events', 'none')
	// 	.attr('font-size', '3em')
	// 	.style('opacity', .5)
	// 	.text('Loading...');

    self.group = self.svg.append('g')
		            .attr('class', 'graphContainer')
    self.link = self.group.append('svg:g')
                    .attr('class', 'links')
                    .selectAll('.link');
    self.node = self.group.append('svg:g')
                    .attr('class', 'nodes')
                    .selectAll('.node');
	
    // Initialize tooltip for nodes (which will be visible on mouseover of nodes)
    self.tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'nodeTooltip')
                    .style('position', 'absolute')
                    .style('width', self.graphDimensions.width / 4 + 'px')
                    .style('z-index', '10')
                    .style('visibility', 'hidden');

	// Add special properties to the ego node:
	self.data.nodes[0].fixed = true;
	// position in center
	self.data.nodes[0].x = self.graphDimensions.width/2;
	self.data.nodes[0].y = self.graphDimensions.height/2;
	self.data.nodes[0].color = self.colorScheme[0];
	self.egoNode = self.data.nodes[0];
	
	// Set up a scale for Eigenfactor in order to encode size of nodes by Eigenfactor (influence)
	var eigenFactorMax = d3.max(self.data.nodes, function(d) { return d.EF; });
	self.eigenFactorScale = d3.scale.linear()
		.domain([0, eigenFactorMax])
		.range([0, 1]);
	self.data.nodes.forEach(function(d) {
		if (d.nodeType === 'paper') {
			d.radius = 4.5 + (self.eigenFactorScale(d.EF) * 10);
		} else {
			d.radius = 10;
		}
	});

    // add graph properties
	self.force.nodes(self.data.nodes);
	
    // update node elements
    self.node = self.node.data(self.data.nodes);
    //self.node.exit().remove();
    var newNode = self.node.enter();

    newNode = newNode.append('svg:circle')
		//test
		.attr('class', 'node')
		.attr('r', function(d) { return d.radius; })
        // .attr('class', 'node hidden')
        // "T" attribute will keep track of the transition time elapsed
        .attr('T', 0)
        // Start with the node invisible
        .attr('r',1e-9)
        // Color by different categories of how similar the node's cluster is to the ego node
        .attr('fill', function(d) {
            // The commented out code below uses the (infomap) clusters to color the nodes.
            // For now, I will use the MAS Domains (loaded in domains.tsv above) instead.
            //
            // var clusterSplit = d.cluster.split(':');
            // if (clusterSplit.slice(0,-1).join('') === self.egoNode.cluster.split(':').slice(0,-1).join('')) {
            //     var thisColor = self.clusters[0].color;
            // } else {
            // // otherwise, color based on top level cluster
            //         var clusterTopLevel = clusterSplit[0];
            //         for (var i=1; i<self.clusters.length; i++) {
            //                 if (self.clusters[i].cluster.split(':')[0] === clusterSplit[0])
            //                     { var thisColor = self.clusters[i].color; }
            //         }
            // }
            //
            // d.color = thisColor;
            // return thisColor;
            //

            // color the nodes based on DomainID
			if (d.color) {
				return d.color;
			} else {
				for (var i=0; i<self.domainsThisGraph.length; i++) {
					var thisDomain = self.domainsThisGraph[i].key
					if (thisDomain==d.DomainID) {
						// var thisColor = self.colorScheme[i];
						var thisColor = self.domainsThisGraph[i].color;
						d.color = thisColor;
						return thisColor;
					}
				}
			}
        })
        .style('opacity', self.graphParams.opacityVals.value.node);

    newNode.call(self.force.drag);

	// self.egoNode = self.node.filter(function(d) { return d.idx === 0; });
	
    // update link elements
	self.force.links(self.data.links);

    self.link = self.link.data(self.data.links);
    //self.link.exit().remove();
	var newLink = self.link
		.enter()
		.append('svg:line')
		.attr('class', function(d) {
			// if (d.target === 0) { return 'link toEgo linkToEgo'; }
			// else { return 'link notToEgo linkNotToEgo'; }
			if (d.target === 0) { return 'link hidden toEgo linkToEgo'; }
			else { return 'link hidden notToEgo linkNotToEgo'; }
		})
		// "T" attribute will keep track of the transition time elapsed
		.attr('T', 0)
		// Links to the ego node are darker than links between the others
		.style('opacity', function(d) {
			var opVals = self.graphParams.opacityVals.value;
			if (d.linkToEgo) {
				return opVals.linkToEgo;
			} else {
				return opVals.linkNotToEgo;
			}
			// return .5;
			// if (d.target === 0) { return self.graphParams.opacityVals.value.linkToEgo; }
			// else { return self.graphParams.opacityVals.value.linkNotToEgo; }
		});

	function placeNodes() {
		// This function will determine the final spatial placement of all of the nodes.

		switch (self.graphParams.nodePlacement.value) {
			case self.nodePlacementOptions[0]:
				// Place the nodes using the force layout.
				// Uses the force layout parameters in self.makeForce
				self.force.start();
				// Execute force a bit, then stop
				for (var i = 0; i<100000; ++i) self.force.tick();
				self.force.stop();
				newNode.each(function(d) { d.fixed = true; });
				break;

			case self.nodePlacementOptions[1]:
				// Place the nodes in spiral formation.
				var cx = self.egoNode.x,
			        cy = self.egoNode.y,
			        // initialRad = 60;
			        initialRad = 20;
				var numNodes = self.data.nodes.length;
				// console.log(numNodes);
				newNode.each(function(d, i) {
					if (d.idx != 0) {
						d.fixed = true;
						// var thisRad = i * 2 + initialRad;
						// var thisSpacing = i * (Math.PI/(8.5+.1*i));

						var thisRad = Math.pow(i, 1) * .95 + initialRad;
						var thisSpacing = i * (Math.PI/(8.5+.05*i));
						d.x = cx + (thisRad * Math.cos(thisSpacing));
						d.y = cy + (thisRad * Math.sin(thisSpacing));
						// var angle = 0.1 * i;
						// d.x = cx + thisRad * Math.cos(angle);
						// d.y = cy + thisRad * Math.sin(angle);

					}
				});
				self.force.start();
				self.force.tick();
				self.force.stop();
				break;

			case self.nodePlacementOptions[2]:
				// Alternate spiral algorithm
				//
				// http://gamedev.stackexchange.com/questions/16745/moving-a-particle-around-an-archimedean-spiral-at-a-constant-speed
				function computeAngle(alpha, arcLength, epsilon) {
					// alpha: distance between successive turnings
					// arcLength: desired arcLength
					// epsilon: (value >0) indicates the precision of the approximation
					// returns: angle at which the desired arcLength is achieved
					var angleRad = Math.PI + Math.PI;
					while (true) {
						var d = computeArcLength(alpha, angleRad) - arcLength;
						if (Math.abs(d) <= epsilon) {
							return angleRad;
						}
						var da = alpha * Math.sqrt(angleRad * angleRad + 1);
						angleRad = angleRad - (d / da);
					}
				}
				function computeArcLength(alpha, angleRad) {
					var u = Math.sqrt(1 + angleRad * angleRad);
					var v = Math.log(angleRad + u);
					return 0.5 * alpha * (angleRad * u + v);
				}
				function computePoint(alpha, angleRad) {
					var distance = angleRad * alpha;
					var x = Math.sin(angleRad) * distance;
					var y = Math.cos(angleRad) * distance;
					return [x, y];
				}
				function getAngles(numNodes, alpha) {
					var pointArcDistance = 5;
					var epsilon = .00005;
					var totalArcLength = 0.0;
					var previousAngleRad = 0.0;
					var angles = [];
					for (var i = 0, len = numNodes; i < len; i++) {
						var angleRad = computeAngle(alpha, totalArcLength, epsilon);
						angles.push(angleRad);
						totalArcLength = totalArcLength + pointArcDistance;
						previousAngleRad = angleRad;
						if (i>10) { pointArcDistance = 10;}
						if (i>50) { pointArcDistance = 15;}
					}
					return angles;
				}
				var numNodes = self.data.nodes.length;
				var angles = getAngles(numNodes, 7);
				// console.log(angles);
				var cx = self.egoNode.x,
			        cy = self.egoNode.y,
			        // initialRad = 60;
			        initialRad = 20;
				var numNodes = self.data.nodes.length;
				console.log(numNodes);
				newNode.each(function(d, i) {
					if (d.idx != 0) {
						d.fixed = true;
						var thisRad = i * 2 + initialRad;
						var thisSpacing = i * (Math.PI/(8.5+.1*i));

						// var thisRad = Math.pow(i, 1) * .95 + initialRad;
						// var thisSpacing = i * (Math.PI/(8.5+.05*i));
						// d.x = cx + (thisRad * Math.cos(thisSpacing));
						// d.y = cy + (thisRad * Math.sin(thisSpacing));
						// var angle = 0.1 * i;
						// d.x = cx + thisRad * Math.cos(angle);
						// d.y = cy + thisRad * Math.sin(angle);
						var powScale = d3.scale.pow().exponent(.7).domain([1,numNodes]).range([0,60]);
						var powScale = d3.scale.linear().domain([1,Math.pow(numNodes, .3)]).range([0,60]);
						var powScale = d3.scale.log().domain([100, numNodes+100]).range([0,60]);
						// var thisPos = Math.pow(i+1, .7) * 1;
						// console.log(thisPos);
						var newi = Math.pow(i+1, .3);
						var newi = (i)+100;
						var thisPos = powScale(newi);
						// console.log(thisPos)
						var b = 7;
						var thisPos = angles[i];
						d.x = cx + (initialRad + b * thisPos) * Math.cos(thisPos);
						d.y = cy + (initialRad + b * thisPos) * Math.sin(thisPos);

					}
				});
				self.force.start();
				self.force.tick();
				self.force.stop();
				break;
		}
	}
    placeNodes();

	self.legendInit();
	self.addAuthorImage();
	self.addEventListeners();

    self.yearTextDisplay = self.svg.append('svg:text')
                    .attr('x', self.graphDimensions.width * 8/9)
                    .attr('y', self.graphDimensions.height * 12/13)
                    .attr('dy', '-.3em')
                    .attr('font-size', '10em')
                    .attr('text-anchor', 'end')
                    .style('pointer-events', 'none')
                    .style('opacity', 1e-9)
					.text(self.data.graph.yearRange[0]);

	self.revealEgoNode();

};

egoGraphVis.prototype.makeZoom = function () {
	var self = this;
	return d3.behavior.zoom()
		.center([self.graphDimensions.width/2, self.graphDimensions.height/2])
		.scaleExtent([0.2, 10])
		.on('zoom', function() {
			self.group.attr(
				'transform',
				'translate(' + d3.event.translate + ')' +
					'scale(' + d3.event.scale + ')'
			);
		});
};

egoGraphVis.prototype.makeTick = function () {
    var self = this;
    // cache function creation for tiny optimization
    function x1(d) { return d.source.x; }
    function y1(d) { return d.source.y; }
    function x2(d) { return d.target.x; }
    function y2(d) { return d.target.y; }
    // function transform(d) {
    //     d.x = Math.max(4.5, Math.min(self.graphDimensions.width - 4.5, d.x));
    //     d.y = Math.max(4.5, Math.min(self.graphDimensions.height - 4.5, d.y));
    //     return 'translate(' + d.x + ',' + d.y + ')';
    // }
    function transform(d) {
		// The below lines constrain the nodes to stay within the bounds of the original display.
		if (self.zoomable === false) {
			d.x = Math.max(4.5, Math.min(self.graphDimensions.width - 4.5, d.x));
			d.y = Math.max(4.5, Math.min(self.graphDimensions.height - 4.5, d.y));
		}
        return 'translate(' + d.x + ',' + d.y + ')';
    }
    return function () {
        self.link
            .attr('x1', x1)
            .attr('y1', y1)
            .attr('x2', x2)
            .attr('y2', y2);
        self.node
            .attr('transform', transform);
    };
};

egoGraphVis.prototype.makeForce = function () {
    var self = this;
    return d3.layout.force()
        .size([self.graphDimensions.width, self.graphDimensions.height])
        .linkDistance(225)
        //.linkDistance(function(d) { console.log(self.ldScl(d.source.Year)); return self.ldScl(d.source.Year) ? 75 + self.ldScl(d.source.Year) : 0;})
        //.linkStrength(function(d) { return self.lsScl(d.source.Year) ? self.lsScl(d.source.Year) : 0;})
        // .charge(-15)
        // .gravity(0.03)
        // .friction(0.8)
        // .theta(0.9)
        // .alpha(0.1)
        .on('tick', this.tick);
};

egoGraphVis.prototype.importDefaultOptions = function(options) {
	var self = this;

	self.colorScheme = options.colorScheme;

	self.graphDimensions = options.dimensions;

	self.transitionTimePerYear = options.transitionTimePerYear;

	console.log(options);

};

egoGraphVis.prototype.getDomainsThisGraph = function() {
	var self = this;

	var domains = self.data.graph.Domains;
	console.log(domains);

	var maxDomains = self.colorScheme.length;
	
	// self.domainsThisGraph will be an array of {key: "DomainID", values: count}
	self.domainsThisGraph = d3.nest()
		.key(function(d) { return d.DomainID; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(self.notEgoNodes);
	self.domainsThisGraph.sort(function(a,b) { return d3.descending(a.values, b.values); });
	// Add a few more variables to the domainsThisGraph data:
	for (var i=0; i<self.domainsThisGraph.length; i++) {
		var key = +self.domainsThisGraph[i].key;
		self.domainsThisGraph[i].DomainID = key;
		if (i<maxDomains-1) {
			self.domainsThisGraph[i].DomainName = domains[key];
			self.domainsThisGraph[i].color = self.colorScheme[i];
		} else {
			self.domainsThisGraph[i].DomainName = "Other";
			self.domainsThisGraph[i].color = self.colorScheme[maxDomains-1];
		}
	}
	console.log(self.domainsThisGraph);
};

egoGraphVis.prototype.legendInit = function() {
	var self = this;

	var squareSize = self.graphDimensions.width / 70;
    var padding = squareSize / 3;
    var sqrPlusPadding = squareSize + padding;

    self.legend = self.svg.append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate('+padding+','+padding+')');
        // .style('opacity', 1e-9);
	console.log(self.domainsThisGraph);

    var legendItem = self.legend.selectAll('g')
        .data(self.domainsThisGraph)
        .enter()
        .append('g')
        .attr('class', 'legendItem')
        .attr('id', function(d) {
            // return 'legendCluster' + d.cluster; })
            // Use Domain instead of cluster
            return 'legendDomain' + d.DomainID; })
		.attr("display", function(d, i) {
				// hide all "other" domain objects except the first one
				if (i<self.colorScheme.length) {
					return "";
				} else {
					return "none";
				}
			});
        // // start off hidden if not the same domain as the ego node
        // .style('opacity', function(d) {
        //     // var thisTopCluster = d.cluster.split(':')[0];
        //     // if (thisTopCluster === egoNodeTopCluster) return 1; else return 0;
        //     if (d.DomainID===self.egoNode.DomainID) return 1; else return 0;
        // });
    // // Don't hide the legend if annotations are turned off
    // // maybe try a different approach later
    // if ( !self.graphParams.doAnnotations.value ) legendItem.style('opacity', 1);

    legendItem.append('svg:rect')
        .attr('width', squareSize)
        .attr('height', squareSize)
        .attr('transform', function(d, i) {
            return 'translate(0,' + (sqrPlusPadding * i) + ')';
        })
        .attr('fill', function(d) {
            return d.color; });
    legendItem.append('svg:text')
        .attr('transform', function(d, i) {
                return 'translate(' + (sqrPlusPadding) + ',' + (sqrPlusPadding * i) + ')';
        })
        .attr('dy', '1em')
        .text(function(d) {
                // return 'Papers in category "' + d.DomainName + '" (domain ' + d.DomainID + ')';
				if (d.DomainID != 0 && d.DomainName.toLowerCase()=="other") {
					return "Papers in other categories";
				} else {
					return 'Papers in category "' + d.DomainName + '"';
				}
        })
		.style('font-size', '.9em');


};

egoGraphVis.prototype.addAuthorImage = function() {
	var self = this;
	if (self.egoNode.hasOwnProperty('name')) {
		self.egoNode.AuthorName = self.egoNode.name;
	}
	if (self.egoNode.hasOwnProperty('AuthorName')) {
		
		self.authorImageDiv = self.svg.append('foreignObject').attr('class', 'externalObject')
			.attr('x', 0)
			.attr('y', self.graphDimensions.height/2 - 50)
			// .attr('height', self.graphDimensions.height/5)
			.attr('height', '100%')
			.attr('width', self.graphDimensions.height/5)
			.append('xhtml:div')
			.attr('id', 'authorImageDiv');
		self.authorImageDiv
			.append('xhtml:p')
			.html('<p>' + self.data.nodes[0].AuthorName.capitalize() + '</p>');

		var authorImageContainer = self.authorImageDiv
			.append('xhtml')
			.attr('id', 'authorImageContainer');

		// Add content for HRA authors
		var authorOrg = self.data.nodes[0].organization;
		console.log(authorOrg);
		if (typeof authorOrg != 'undefined') {
			d3.tsv("static/healthra/orgs_with_links.tsv", function(error, org_data) {
				if (error) throw error;
				var pstyle = 'style="margin: 0; padding: 0; font-size: .85em"'
				console.log(org_data);
				for (var i = 0, len = org_data.length; i < len; i++) {
					if (org_data[i]['org_name'] == authorOrg) {
						var nameFromTSV = org_data[i]['match_name'];
						if ( (typeof nameFromTSV != 'undefined') && (nameFromTSV != '') ) {
							var orgLink = org_data[i]['link'];
							var orgImgUrl = org_data[i]['img_url'];
							self.authorImageDiv
								.append('xhtml:p')
								.html('<a href="' + orgLink + '" target="_blank"><p ' + pstyle + '>' + nameFromTSV + '</p>');
							var authorImage = addImage(orgImgUrl);
							authorImage.style('cursor', 'pointer');
							authorImage.on('click', function() { console.log(orgLink); window.open(orgLink, '_blank')});
						} else {
							self.authorImageDiv
								.append('xhtml:p')
								.html('<p style="margin: 0; padding: 0; font-size: .85em">' + authorOrg + '</p>');
						}
					}
				}
			});
	}
	}

	function addImage(authorImageSrc) {
		var authorImage = authorImageContainer
			.append('xhtml:img')
			.attr('src', authorImageSrc)
			.attr('id', 'authorImage')
			.attr('width', '85px');
		return authorImage;
	}

	// If an image URL is included in the data:
	var AuthorImgUrl = self.data.nodes[0].AuthorImgUrl || self.data.nodes[0].ImgURL;
	console.log(AuthorImgUrl);
	if (typeof AuthorImgUrl != 'undefined') {
		addImage(AuthorImgUrl);
		return;
	}

	// Pew method of getting author image:
	// Try some filename extensions and attempt to insert the image
	var pewid_str = self.data.nodes[0].PewScholarID;
	if (typeof pewid_str === 'undefined') {
		return;
	}
	var pewid_str = pewid_str.toString();
	// zero-pad the pew id
	pewid_str = ('000' + pewid_str);
	pewid_str = pewid_str.substr(pewid_str.length-3);
	var fname_root = "static/img/pew_photos/" + pewid_str;
	var possibleExtensions = ['.png', '.jpg', '.jpeg', '.JPG', '.JPEG', '.PNG'];
	
	// recursive function that loops through the different possible file extensions above
	function tryImageFilenames(fname_root, possibleExtensions, iter) {
		var authorImageFilename = fname_root + possibleExtensions[iter];
		if (iter >= possibleExtensions.length) {
			return false;
		}
		$.get(authorImageFilename)
			.done(function() {
				addImage(authorImageFilename);
			}).fail(function() {
				// recurse
				var c = iter + 1;
				tryImageFilenames(fname_root, possibleExtensions, c);
			});
	}
	tryImageFilenames(fname_root, possibleExtensions, 0);


	var pewClass = self.data.nodes[0].pew_Class;
	if (typeof pewClass != 'undefined') {
		self.authorImageDiv
			.append('xhtml:p')
			.html('<p style="margin: 0; padding: 0; font-size: .85em">Pew Scholar ' + pewClass + '</p>');
	}


};

egoGraphVis.prototype.addEventListeners = function() {
	// Only add event listeners here that don't act across different vis objects
	// Otherwise they need to be added to (e.g.) citationVis_Main.js
	
	var self = this;

	if (self.zoomable === true) {
		self.group.call(self.zoom);
	}

    // Add event listener to nodes for tooltip:
    d3.selectAll('.node')
        .on('mouseover', function(d) {
			self.makeTooltip(d, function(tooltipHtml) {
				self.tooltip = self.tooltip
					.html(tooltipHtml)
					.style('visibility', 'visible')
					.style('border-style', 'solid')
					.style('border-color', d.color);
			});
			// going to try to use the method of getting the citation text. but not working yet
			// getCitation(d.PaperID, this);
        })
        .on('mousemove', function() {
            self.tooltip = self.tooltip
                .style('visibility', 'visible')
                .style('top', (d3.event.pageY-10)+'px')
                .style('left', (d3.event.pageX+10)+'px');
        })
        .on('mouseout', function() {
            self.tooltip = self.tooltip.style('visibility', 'hidden'); })
		.on('click', function(d) {
			var doi = getDOI(d.PaperID, this);
		})

	function getDOI(paperid, nodeObj) {
		var thisNode = d3.select(nodeObj);
		$.ajax({
			dataType: 'json',
			url: $SCRIPT_ROOT + '/_vis_get_doi',
			data: {paperid: paperid},
			success: function(result) {
				console.log(result['doi']);
				var doi = result['doi'];
				if (doi) {
					var url = 'https://doi.org/' + doi;
					window.open(url, '_blank');
				}

			}
		});
		
	}
	function getCitation(paperid, nodeObj) {
		//
		var thisNode = d3.select(nodeObj);
		$.ajax({
			dataType: 'json',
			url: $SCRIPT_ROOT + '/_vis_get_citation',
			data: {paperid: paperid},
			success: function(result) {
				console.log(result['citation']);
				thisNode.attr('title', result['citation']);
			}
		});
	}

};

egoGraphVis.prototype.makeTooltip = function(d, callback) {
    var self = this;

	// Account for author node:
	if (d.nodeType === 'author' || d.nodeType === '' || d.nodeType === 'venue') {
		var tooltipHtml = '<p class="authorName">Author: ' + d.AuthorName + '</p>';
		if (d.pew_Class) {
			tooltipHtml = tooltipHtml + '<p class="pewClass">Pew Class: ' + d.pew_Class + '</p>';
		}
		var numberOfPubs = d.papers.length;
		tooltipHtml = tooltipHtml + '<p class="numberOfPubs">Number of Publications: ' + numberOfPubs + '</p>';
		// return tooltipHtml;
		callback(tooltipHtml);
	}

	// Otherwise: make a tooltip for a paper node
	function getAuthorList(authors) {
		var authorList = [];
		authors.forEach(function(a) {
			var thisAuthorStrList = a[1].split(' ');
			// thisAuthorStrList = thisAuthorStrList.map(function(x) { return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); });
			// thisAuthorStrList = thisAuthorStrList.map(function(x) { if (x === x.toUpperCase()) return x.capitalize(); else return x;});
			thisAuthorStrList = thisAuthorStrList.map(function(x) { if (x != x.toUpperCase()) return x.capitalize(); else return x;});
			// var thisAuthor = a.Name.charAt(0).toUpperCase() + a.Name.slice(1).toLowerCase();
			var thisAuthor = thisAuthorStrList.join(' ');
			authorList.push(thisAuthor);
		});
		return authorList;
	}
	function getTitle(paperid, callback) {
		//
		$.ajax({
			dataType: 'json',
			url: $SCRIPT_ROOT + '/_vis_get_title',
			data: {paperid: paperid},
			success: function(result) {
				callback(result['title']);
			}
		});
	}
	function makeHtml() {
		// var tooltipHtml = '<p class="paperID">pID: ' + d.id + '</p>';
		var tooltipHtml = '';
		tooltipHtml = tooltipHtml + '<p class="paperTitle">';
		tooltipHtml = tooltipHtml + d.Title;
		tooltipHtml = tooltipHtml + '</p>';
		tooltipHtml = tooltipHtml + '<p class="paperYear">' + d.Year + '</p>';
		var authorStrList = [];
		d.authorList.forEach(function(a) {
			authorStrList.push(a)
		});
		var authorList = authorStrList.join(', ');
		tooltipHtml = tooltipHtml + '<p class="paperAuthor">Authors: ' + authorList + '</p>';
		return tooltipHtml;
	}
	if ( d.hasOwnProperty('authors') ) {
		var authorList = getAuthorList(d.authors);
		d.authorList = authorList;
		if ( d.hasOwnProperty('Title') ){
			var tooltipHtml = makeHtml();
			callback(tooltipHtml);
		} else {
			getTitle(d.id, function(title) {
				d.Title = title;
				var tooltipHtml = makeHtml();
				callback(tooltipHtml);
			});
		}
	} else {
		$.ajax({
			dataType: 'json',
			url: $SCRIPT_ROOT + '/_vis_get_authorinfo',
			data: {authorids: JSON.stringify(d.AuthorIDList)},
			success: function(result) {
				d.authors = result['authors'];
				var authorList = getAuthorList(d.authors)
				d.authorList = authorList;
				if ( d.hasOwnProperty('Title') ){
					var tooltipHtml = makeHtml();
					callback(tooltipHtml);
				} else {
					getTitle(d.id, function(title) {
						d.Title = title;
						var tooltipHtml = makeHtml();
						callback(tooltipHtml);
					});
				}
			}
		});

	}
    
};

egoGraphVis.prototype.revealEgoNode = function() {
    var self = this;

    self.currNodeIndex = 0;  // Index of current node (ego node)
	self.currYear = self.data.graph.yearRange[0];

    // Reveal ego node
	d3.selectAll('.node').filter(function(d) { return d.id === self.egoNode.id; })
        .classed('hidden', false)
        .classed('visible', true)
        .transition()
        // .delay(self.graphParams.transitionTimePerYear.value/4)
        .duration(2000)
        .attr('r', function(d) {
                //return 4.5 + (self.eigenFactorScale(d.EF) * 10);
                return d.radius;
        })
        .attr('T', 1)
		.each('start', function() {
			self.yearTextDisplay.transition()
			    .delay(1000)
			    .duration(1000)
			    .style('opacity', .15);
		})
        .each('end', function() {
            // reveal legend
            // self.legend.transition()
            //     .delay(4000)
            //     .duration(1000)
            //     .style('opacity', 1);

            // reveal the display of current year
            // self.yearTextDisplay.transition()
            //     .duration(1000)
            //     .style('opacity', .15);

			// notify everyone (i.e. the Main.js and the line charts)
			$.event.trigger({
				type: "yearChange",
			});
            self.animateToDestinationNode();
        });
};

egoGraphVis.prototype.animateToDestinationNode = function() {
    var self = this;



    // Check if we're moving forward or backward
        // if currNodeIndex < destinationNodeIndex:
        //     currNodeIndex++;
        //     check for year
        //     drawNode();
    if (self.currNodeIndex === self.destinationNodeIndex) {
        console.log('goto finish');
        self.finishAnimation();
    } else if (self.currNodeIndex < self.destinationNodeIndex) {
		self.animationState = 'forward';
        self.currNodeIndex++;
        self.checkYear();
        // self.drawNode();
    } else if (self.currNodeIndex > self.destinationNodeIndex) {
		self.animationState = 'rewind';
        self.currNodeIndex--;
        self.checkYear();
        // self.removeNode();
    }
};

egoGraphVis.prototype.continue = function() {
	var self = this;

    // if (self.currNodeIndex === self.destinationNodeIndex) {
    //     console.log('goto finish');
    //     self.finishAnimation();
    // if (self.currNodeIndex < self.destinationNodeIndex) {
    //     self.drawNode();
    // } else if (self.currNodeIndex > self.destinationNodeIndex) {
    //     self.removeNode();
    // }
	if (self.animationState === 'forward') {
		self.drawNode();
	} else if (self.animationState === 'rewind') {
		self.removeNode();
	}
};

egoGraphVis.prototype.checkYear = function() {
	var self = this;
	
	// if we are on the last node, just max out the year.
	if (self.currNodeIndex == self.data.nodes.length-1) {
		self.currYear = self.data.graph.yearRange[1];
		self.yearTextDisplay.text(self.currYear);

		// jQuery custom event, so that Main.js can listen for it and advance the year on the line charts
		$.event.trigger({
			type: "yearChange",
		});
		self.continue();
		return;
	}

	var currNode = self.data.nodes.filter(function(d) { return d.idx === self.currNodeIndex; });
	var oldYear = self.currYear;
	var newYear = currNode[0].Year;
	// if the year is the same as it was, do nothing
	if (newYear == oldYear) {
		self.continue();
	} else if (newYear > oldYear) {
		// trying to debug timing issues
		// looks like timing is just inherently inconsistent. there seems to be a delay with this method (calling the next node drawing in transition.each('end') )
		// console.log(self.currYear);
		// console.log('c '+self.c);
		// console.log('tt '+self.tt);
		// console.log('tt over c '+self.tt/self.c);
		// console.log('transitionTimePerNode '+self.transitionTimePerNode);
		// console.log('error '+(self.transitionTimePerNode)/(self.tt/self.c));
		self.c=0;
		self.tt=0;
		self.currYear++;
		self.beginNewYear();
	} else if (newYear < oldYear) {
		self.currYear--;
		self.beginNewYear();
	}
	// self.currYear = currNode[0].Year;

	// TODO: come back to this
	//
    // // Check the year of the current node, and if it is different than currYear:
    // //     update currYear;
    // //     update yearTextDisplay;
    // //     fade nodes and links from previous year;
    // //     recalculate transition times;
    //
    // var self = this;
    //
    // var yearOfCurrNode = self.allNodes[self.currNodeIndex].Year
    // if ( yearOfCurrNode != self.currYear ) {
    //     self.currYear = yearOfCurrNode;
    //
    //     self.updateLineChart();
    //
    //     // Update the year display
    //     self.yearTextDisplay.text(self.currYear);
    //     // I may need to do something about this (that the year text display starts off hidden):
    //     // if (self.currYear == self.egoNode.Year) 
    //     //         {self.yearTextDisplay.transition()
    //     //                 .duration(1000)
    //     //                 .style('opacity', .15);
    //
    //     // Only fade previous year if going forward in time
    //     if (self.currNodeIndex < self.destinationNodeIndex) self.fadeNodesAndLinksPrevYear();
    //
    //     self.calculateTransitionTime();
    // }
	return self.currYear;
};

egoGraphVis.prototype.beginNewYear = function() {
	var self = this;

	
	self.yearTextDisplay.text(self.currYear);

	// jQuery custom event, so that Main.js can listen for it and advance the year on the line charts
	$.event.trigger({
		type: "yearChange",
	});

	self.calculateTransitionTime();
	var nodesThisYear = self.notEgoNodes.filter(function(d) { return d.Year == self.currYear; });

	// If this year has no nodes, delay, then continue
	if ( nodesThisYear.length === 0 ) {
		setTimeout(function() {
			self.checkYear();
		}, self.transitionTimePerYear[self.currYear])
	} else {
		self.continue();
	}


};

egoGraphVis.prototype.drawNode = function() {
    var self = this;

    // self.animationState = 'forward';

    // self.fadeNodesAndLinksPrevYear();

    var currNode = d3.selectAll('.node').filter(function(d) { return d.idx === self.currNodeIndex; });

    function drawLinks(nodeObj) {
        // This function will draw the link out from the source to the target.
        // We'll call it after each node appears.
        nodeObj.linksThisNodeIsSource = d3.selectAll('.link').filter(function(l) { return l.source === nodeObj; });
        nodeObj.linksThisNodeIsSource.classed('hidden', false)
            .classed('visible', true)
            .each(function(d) { d.inTransition = true; })
            .attr('x2', function(d) { return d.source.x; })
            .attr('y2', function(d) { return d.source.y; })
            .style('visibility', 'visible')
            .transition()
            .ease('linear')
            .delay(0)
            .duration(self.linkAppearDuration)
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; })
            // .attr('x2', 0)
            // .attr('y2', 0)
            .attr('T', 1)
            .each('end', function(d) { d.inTransition = false; });
    }
    // Make the nodes appear:
	// var t0 = performance.now();
    currNode.classed('hidden', false)
        .classed('visible', true)
        .transition()
        .ease('linear')
        //.delay(function(d, i) { return (i-currIndex) * timePerNode; })
        // .delay(function(d, i) { return i * self.transitionTimePerNode; })
        .duration(self.transitionTimePerNode)
        .attr('r', function(d) {
            //return 4.5 + (self.eigenFactorScale(d.EF) * 10);
            return d.radius;
        })
        .attr('T', 1)
		.each('end', function(d) {
			// var t1 = performance.now();
			// self.tt = self.tt + (t1-t0);
			self.c++;
			if (self.zoomable === true) {
				self.checkZoom(d);
			}
			// console.log(t1-t0 + "milliseconds");
			self.animateToDestinationNode();
			drawLinks(d);
        // .each(function(d) {
            // Put up annotation if a node comes from a new domain.
            // Must satisfy the conditions:
            // -graph paramater doAnnotations is true
            // -the domain has not already been annotated
            // -the domain is different than the ego node's domain
            var thisDomain = self.domainsThisGraph.filter(function(domain) {return domain.DomainID==d.DomainID;});
            // The above returned an array. Take the first element to get the object representing the Domain.
            thisDomain = thisDomain[0]
            if ( (self.graphParams.doAnnotations.value) && (!thisDomain.alreadyAnnotated) && (thisDomain.DomainID != self.egoNode.DomainID) ) {
                self.annotationNewCluster(d);
                d3.select('#legendDomain' + d.DomainID)
                    .transition().delay(1000).duration(2000)
                    .style('opacity', 1);
                thisDomain.alreadyAnnotated = true;
            } // else {

            // I can use else if statements for the other annotations.
            // (or other if statements? what if one node trips two annotations?)

            // var clusterSplit = d.cluster.split(':');
            // // Put up annotation if a node comes from a new cluster
            // // Also reveal this cluster in the legend
            // var clusterIndex = self.clustersToAnnotate.indexOf(clusterSplit[0])
            // if (clusterIndex > -1)
            //         { if ( (self.graphParams.doAnnotations.value ) && ( !self.clusters[clusterIndex].alreadyAnnotated ))
            //                 { self.annotationNewCluster(d);
            //                 d3.select('#legendCluster' + clusterSplit[0])
            //                         .transition().delay(1000).duration(2000)
            //                         .style('opacity', 1);
            //                 self.clusters[clusterIndex].alreadyAnnotated = true; } }

            // Put up annotation when the highest Eigenfactor node appears
            // Commented out because it happens too early for this paper and interferes with flow
            //if (d.EF === d3.max(self.allNodes, function(dd) { return dd.EF; }))
                    //{ console.log('highest EF'); self.annotationHighestEF(d); }

            // else self.animateToDestinationNode();

        });
};

egoGraphVis.prototype.removeNode = function() {
    var self = this;

    self.animationState = 'rewind';

    // self.calculateTransitionTime();

    var currNode = d3.selectAll('.node').filter(function(d) { return d.index === self.currNodeIndex; });
    var currLinks = d3.selectAll('.link').filter(function(d) { return d.source.index === self.currNodeIndex; });

    // var retractDuration = self.linkAppearDuration;
    var retractDuration = self.transitionTimePerNode;
    currLinks.transition()
        .each('start', function(d) { d.inTransition=true; })
        .duration(retractDuration)
        .ease('quad')
        .attr('x2', function(d) { return d.source.x; })
        .attr('y2', function(d) { return d.source.y; })
        .call(function(d) {
		// .each('end', function(d) {
            d.inTransition=false;
            var currNode = d3.selectAll('.node').filter(function(d) { return d.idx === self.currNodeIndex; });
            currNode.transition()
                .duration(self.transitionTimePerNode)
                .ease('quad')
                .attr('r',0)
                .attr('T',1)
                .each('end', function(dd) {
                    d3.select(this).classed('hidden', true)
                        .classed('visible', false);
                    self.animateToDestinationNode();
                });
        });
};

egoGraphVis.prototype.finishAnimation = function() {
	var self = this;

	self.animationState = 'stopped';
	$.event.trigger({
		type: "animationFinished",
	});
	console.log('finished');
	console.log(self.currNodeIndex);
};

egoGraphVis.prototype.newDestinationNode = function(destinationYear) {
	var self = this;

	self.destinationYear = destinationYear;
	console.log(self.destinationYear);
	self.getDestinationNode();
	
	// make sure the current node is included:
	if ( !(self.currNodeIndex === self.destinationNodeIndex) ) {  // don't do anything if this is true
		if (self.currNodeIndex < self.destinationNodeIndex) {
			self.animationState = 'forward';
			self.drawNode();
		} else {
			self.animationState = 'rewind';
			self.removeNode();
		}
	}
};

egoGraphVis.prototype.getDestinationNode = function() {
	var self = this;

	// Get the destination node index from the destination year
	var maxYear = self.data.graph.yearRange[1];
	function getNodesThisYear() {
		var nodesThisYear = self.notEgoNodes.filter(function(d) { return d.Year == self.destinationYear; });
		return nodesThisYear;
	}
	var nodesThisYear = getNodesThisYear();
	if (nodesThisYear.length > 0) {
		var lastNodeThisYear = nodesThisYear[nodesThisYear.length-1];
		self.destinationNodeIndex = lastNodeThisYear.idx;
	} else {
		if (self.destinationYear == maxYear) {
			rewindSearch();
		} else {
			self.destinationYear++;
			self.getDestinationNode();  // recurse
		}
	}

	function rewindSearch() {
		self.destinationYear--;
		var nodesThisYear = getNodesThisYear();
		if (nodesThisYear.length > 0) {
			self.getDestinationNode();
		} else {
			rewindSearch();  // recurse
		}
	}

};

egoGraphVis.prototype.calculateTransitionTime = function() {
	// Method to calculate the transition time for each node based on the number of nodes in the current year
	
	var self = this;

	// SPEED UP FOR TESTING PURPOSES
	// KEEP THIS COMMENTED OUT
	// self.transitionTimePerYear[self.currYear] = 100;

	var countThisYear = self.data.graph.nodeCountsPerYear[self.currYear];
	self.transitionTimePerNode = countThisYear ? self.transitionTimePerYear[self.currYear] / countThisYear : 0;
	self.transitionTimePerNode = self.transitionTimePerNode - 10;


};

egoGraphVis.prototype.revealFinalState = function() {
	// cancel all transitions and reveal the final state of the vis

	var self = this;
	
	d3.selectAll('.node, .link').transition().duration(0);

	self.node
		.classed('hidden', false)
		.attr('r', function(d) {
			return d.radius;
		})
		.each(function(d) {
			if (self.zoomable === true) {
				self.checkZoom(d)
			}
		});

	self.link
		.classed('hidden', false)
		.classed('visible', true)
		.style('visibility', 'visible')
		.attr('x2', function(d) { return d.target.x; })
		.attr('y2', function(d) { return d.target.y; })
		.each(function(d) { d.inTransition = false; });

	self.currNodeIndex = self.data.nodes.length-1;
	self.currYear = self.data.graph.yearRange[1];
	self.yearTextDisplay.text(self.currYear);
	$.event.trigger({
		type: "yearChange",
	})

	self.finishAnimation();

	return
}

		



