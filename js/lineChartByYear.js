function lineChartByYear(data) {
	var self = this;
	self.data = data.values;
	self.pew_Class = data.pew_Class;
	self.hra_funding = data.funding;
	// if there is only one funding record:
	// if (self.hra_funding.length == 1) {
	// 	self.hra_funding = self.hra_funding[0];
	// }
	
	// testing:
	// self.hra_funding = self.hra_funding[0];
	// console.log(self.hra_funding);

	// Defaults
	// Graph SVG Dimensions
    // self.lineChartDimensions = {
	// 	margin: {top: 30, right: 20, bottom: 30, left: 50}
	// };
	// self.lineChartDimensions.width = 960 * 3/4 - self.lineChartDimensions.margin.left - self.lineChartDimensions.margin.right;
	// self.lineChartDimensions.height = 110 - self.lineChartDimensions.margin.top - self.lineChartDimensions.margin.bottom;
	self.lineChartDimensions;  // imported in self.importDefaultOptions below
	
	self.colorScheme;
	// // Colors:
    // // See http://colorbrewer2.org/?type=qualitative&scheme=Set1&n=8
    // self.colorScheme = ['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)',
    //         'rgb(152,78,163)','rgb(255,127,0)','rgb(255,255,51)',
    //         'rgb(166,86,40)','rgb(247,129,191)']
    // // I liked the blue better for the main color, so the next line just moves
    // // the blue color (originally self.colorScheme[1]) to the front (self.colorScheme[0])
    // self.colorScheme.splice(0, 0, self.colorScheme.splice(1, 1)[0])

    // self.x = d3.time.scale().range([0, self.lineChartDimensions.width]);

	self.x;
	self.y;
	self.chartDiv;
    self.svg;
    self.svgDefs;
	self.title;
    self.clipPath;
    self.currYearIndicator;
	self.yearArea;
	self.yearAreaOpacity = .1;
    self.xAxis;
    self.yAxis;
    self.line;  // line drawing function
    self.area;  // area drawing function
	self.chartLine;  // actual line element
	self.chartArea;  // actual area element
	self.linearGradient;

	self.animationState;
	self.currYear;
	self.transitionTimePerYear;
	self.yearRange = d3.extent(self.data, function(d) { return d.year; });
	
	self.fundingTime
	if (typeof self.pew_Class != 'undefined') {
		self.fundingTime = 4;  // funding period for Pew
	}
	if (typeof self.hra_funding != 'undefined') {
		self.hra_funding = self.hra_funding[0];
		self.fundingTime = self.hra_funding.duration_in_years;
		// this is a hack that will work for now
		// TODO: fix this
		self.pew_Class = self.hra_funding.start_date;
	}

	// self.init();

	return self;

}

lineChartByYear.prototype.init = function() {
	var self = this;

	self.animationState = 'init';
	self.currYear = self.yearRange[0];  // Initialize year

    self.x = d3.scale.linear().range([0, self.lineChartDimensions.width]);
    self.y = d3.scale.linear().range([self.lineChartDimensions.height, 0]);

	self.chartDiv = d3.select('#chartsDiv').append('div')
		.attr('class', 'chartDiv');

	self.svg = self.chartDiv.append('svg')
	    .attr('width', self.lineChartDimensions.width + self.lineChartDimensions.margin.left + self.lineChartDimensions.margin.right)
	    .attr('height', self.lineChartDimensions.height + self.lineChartDimensions.margin.top + self.lineChartDimensions.margin.bottom)
	    // .attr('id', 'chart2Svg')
	    .attr('class', 'lineChart')
	    .append('g')
	    .attr('transform', 'translate(' + self.lineChartDimensions.margin.left + ',' + self.lineChartDimensions.margin.top + ')');
	self.svgDefs = self.svg.append('defs');
	
	// The strategy is to draw the entire line, but use a clip path to only
	// display up to the current year.
	// var chart2ClipPath = self.svgDefs
	// 	.append('clipPath')
	// 	.attr('class', 'clip')
	// 	.append('rect')
	// 	.attr('width', 0)
	// 	.attr('height', self.lineChartDimensions.height);

    // self.x.domain([self.strToYear("1968"), self.strToYear("2013")]);
	self.x.domain(self.yearRange);
	// Hack to cut off x axis at 2010:
	// self.x.domain([self.yearRange[0], 2010]);
	// self.y.domain([0, d3.max(self.data, function(d) { return d.count+5; })]);
	self.y.domain([0, d3.max(self.data, function(d) { return d.count; })]);

	self.xAxis = d3.svg.axis().scale(self.x)
		.orient('bottom')
		.tickFormat(d3.format("d"))
		// .ticks(16);
		.ticks(Math.min(self.data.length, 20));
	
	self.yAxis = d3.svg.axis().scale(self.y)
		.orient('left')
		.ticks(2)
		.tickSize(0);
	
    // Define line drawing function
    self.line = d3.svg.line()
		.x(function(d) { return self.x(d.year); })
		.y(function(d) { return self.y(d.count); });
    
    // Define the area drawing function
    self.area = d3.svg.area()
		.x(function(d) { return self.x(d.year); })
		.y0(self.lineChartDimensions.height)
		.y1(function(d) { return self.y(d.count); });

	// Draw x axis
    self.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + self.lineChartDimensions.height + ')')
            .call(self.xAxis);

    // Put the year for each axis tick label into a data attribute
    // to be able to get it more easily later
    var yearLabels = self.svg.select('.x.axis')
        .selectAll('.tick')
        .attr('class','yearTick')
        // .attr("data-year", function(d) {return self.yearToStr(d); })
        .attr("data-year", function(d) {return d; })
		.style('font-size', '.75em');
	
    // Add a rect for each year label so we can highlight it later
	var yearLabel = self.svg.selectAll('.yearTick')
		.append('svg:rect')
		.attr('fill', self.colorScheme[4])
		.style('opacity', 0)
		.attr('class', 'highlightRect')
		.each(function(d) {
			var bbox = this.parentNode.getBBox();
			var padding = bbox.width/4;
			d3.select(this)
				.attr('x', bbox.x - padding)
			.attr('y', bbox.y)
			.attr('width', bbox.width + padding*2)
			.attr('height', bbox.height);
		});

	// Draw y axis
	self.svg.append('g')
		.attr('class', 'y axis')
		.call(self.yAxis)
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', -self.lineChartDimensions.margin.left/2)
		.attr('x', -(self.lineChartDimensions.height + self.lineChartDimensions.margin.top + self.lineChartDimensions.margin.bottom)/2)
		.attr('class', 'axisLabel')
		.text('Num citations')
		.attr('font-size', '.5em');

	// var maxX = self.x(self.yearRange[1]);
	// console.log(self.yearRange[0]);
	// self.linearGradient = self.svg.append('linearGradient')
	//     .attr('id', 'line-gradient')
	//     .attr('gradientUnits', 'userSpaceOnUse')
	//     .attr('x1', 0).attr('y1', self.x(self.yearRange[0]))
	//     .attr('x2', maxX)
	//     .attr('y2', 0)
	//     .selectAll('stop')
	//     .data([
	// 	{offset: self.x(self.yearRange[0])/maxX, color: d3.rgb(self.colorScheme[7]).darker()},
	// 	{offset: self.x(1985)/maxX, color: d3.rgb(self.colorScheme[7]).darker()},
	// 	{offset: self.x(1987)/maxX, color: self.colorScheme[2]},
	// 	{offset: self.x(1989)/maxX, color: self.colorScheme[2]},
	// 	{offset: self.x(1991)/maxX, color: self.colorScheme[0]},
	// 	{offset: 1, color: self.colorScheme[0]}
	//     ])
	//     .enter().append('stop')
	//     .attr('offset', function(d) { return d.offset; })
	//     .attr('stop-color', function(d) { return d.color; });
	// console.log(self.linearGradient);
	self.linearGradient = d3.select('#line-gradient');
	// if (self.linearGradient.empty()) {
	// 	// self.linearGradient = self.makeColorGradient(1989);
	// 	self.linearGradient = self.makeColorGradient(self.pew_Class);
	// }
	self.linearGradient = self.makeColorGradient(self.pew_Class);

	self.chartArea = self.svg.append('g')
		// .attr('clip-path', 'url(#clip)')
		.append('path')
		.datum(self.data)
		.attr('class', 'area')
		// .style('fill', self.graphParams.colorScheme.value[0])
		.style('fill', 'url(#line-gradient)')
		.attr('d', self.area);

	self.chartLine = self.svg.append('g')
		// .attr('clip-path', 'url(#clip)')
		.append('path')
		.datum(self.data)
		.attr('class', 'line')
		// .style('stroke', self.graphParams.colorScheme.value[0])
		.style('stroke', 'url(#line-gradient)')
		.attr('d', self.line);

	self.currYearIndicator = self.svg.append('svg:line')
		// .attr('class', 'verticalLine yearIndicator')
		.attr('class', 'verticalLine yearIndicator hidden') // turn it off for now (testing other things)
		// Keep track of transition timing:
		.attr('T', 0)
		.attr('x1', self.x(self.currYear))
		.attr('x2', self.x(self.currYear))
		.attr('y1', self.lineChartDimensions.height)
		// .attr('y2', self.lineChartYScale(currVal))
		.attr('y2', 0)
		.attr('stroke-width', 2)
		.attr('stroke', 'black')
		.attr('stroke-dasharray', ('5, 2'))
		.style('opacity', .25);

	// self.svg.select('.yearTick').select('.highlightRect')
	// 	.attr('class', 'currYear')
	// 	.transition()
	// 	.duration(500)
	// 	.style('opacity', .1);

	self.yearArea = self.svg.selectAll('.yearArea')
		.data(self.data)
		.enter().append('svg:rect')
		.attr('class', 'yearArea hidden')
		.attr('data-year', function(d) { return d.year; })
		.attr('x', function(d) { return self.x(d.year); })
		.attr('y', 0)
		.attr('width', function(d) { return self.x(d.year+1)-self.x(d.year); })
		.attr('height', self.lineChartDimensions.height)
		.attr('fill', self.colorScheme[4])
		.style('opacity', 0);


	if (typeof self.pew_Class != 'undefined') {
		self.makeFundingLines(self.pew_Class);
	}

};

lineChartByYear.prototype.importDefaultOptions = function(options) {
	var self = this;

	self.colorScheme = options.colorScheme;

	self.lineChartDimensions = options.dimensions.lineChart;

	self.transitionTimePerYear = options.transitionTimePerYear;

};

lineChartByYear.prototype.makeColorGradient = function(fundingYear) {
	var self = this;
	console.log(fundingYear);

	// This method should be called by the main app (e.g. Main.js)
	// It makes a linear gradient for the line charts based on funding period
	// fundingYear is the Pew Scholar's class year
	// The Pew funding lasts for five years
	// Maybe this method should be modified at some point to be able to have different lengths of funding
	
	// THIS DIDN'T WORK because the width depends on self.init, but this needs to be called before self.init
	//
	// instead call it in self.init()
	

	var maxX = self.x(self.yearRange[1]);
	var linearGradient = self.svg.append('linearGradient')
	    .attr('id', 'line-gradient')
	    .attr('gradientUnits', 'userSpaceOnUse')
	    .attr('x1', 0).attr('y1', self.x(self.yearRange[0]))
	    .attr('x2', maxX)
	    .attr('y2', 0)
	    .selectAll('stop')
	    .data([
		{offset: self.x(self.yearRange[0])/maxX, color: d3.rgb(self.colorScheme[7]).darker()},
		{offset: self.x(fundingYear-1)/maxX, color: d3.rgb(self.colorScheme[7]).darker()},
		{offset: self.x(fundingYear+1)/maxX, color: self.colorScheme[2]},
		{offset: self.x(fundingYear + (self.fundingTime)-1)/maxX, color: self.colorScheme[2]},
		{offset: self.x(fundingYear + (self.fundingTime)+1)/maxX, color: self.colorScheme[0]},
		{offset: 1, color: self.colorScheme[0]}
	    ])
	    .enter().append('stop')
	    .attr('offset', function(d) { return d.offset; })
	    .attr('stop-color', function(d) { return d.color; });

	return linearGradient;

};

lineChartByYear.prototype.makeFundingLines = function(fundingYear) {
	var self = this;

	// Make the vertical lines that show funding period


	self.svg.append('svg:line')
		.attr('class', 'verticalLineStatic verticalLineFundingBegin')
		.attr('x1', self.x(fundingYear))
		.attr('x2', self.x(fundingYear))
		.attr('y1', self.lineChartDimensions.height)
		.attr('y2', 0)
		.attr('stroke-width', 2)
		.attr('stroke', self.colorScheme[2])
		.style('stroke-dasharray', ('5, 2'))
		.style('opacity', .8);
	self.svg.append('svg:line')
		.attr('class', 'verticalLineStatic verticalLineFundingEnd')
		.attr('x1', self.x(fundingYear + self.fundingTime))
		.attr('x2', self.x(fundingYear + self.fundingTime))
		.attr('y1', self.lineChartDimensions.height)
		.attr('y2', 0)
		.attr('stroke-width', 2)
		.attr('stroke', self.colorScheme[0])
		.style('stroke-dasharray', ('5, 2'))
		.style('opacity', .8);
};

lineChartByYear.prototype.changeAnimationState = function(animationState) {
	var self = this;

	self.animationState = animationState;
	console.log(self.animationState);
	function advanceLine() {
		var timeElapsed = self.currYearIndicator.attr('T');
		self.currYearIndicator
			.attr('data-state', 'forward')
			// .attr('T', 0)
			.classed('hidden', false)
			.transition()
			// .duration(self.transitionTimePerYear[self.currYear] - timeElapsed)
			.duration(self.transitionTimePerYear[self.currYear])
			.ease('linear')
			.attr('x1', self.x(self.currYear))
			.attr('x2', self.x(self.currYear))
			// .attr('y2', self.lineChartYScale(currVal))
			.attr('data-state', 'stopped')
			.attr('T', 1)
			.each('end', function() {
				d3.select(this).attr('T', 0);
				self.currYear++;
				// advanceLine()
			});
		// // Update the clip path to show the part of the line we want (with transition)
		// self.lineChartClipPath
		// 	.attr('data-state', 'forward')
		// 	// .attr('T', 0)
		// 	.transition()
		// 	.duration(self.graphParams.transitionTimePerYear.value - timeElapsed)
		// 	.ease('linear')
		// 	.attr('width', self.lineChartXScale(currYearDateFormat))
		// 	.attr('data-state', 'stopped')
		// 	.attr('T', 1)
		// 	.each('end', function() { d3.select(this).attr('T', 0); });
	}
	if (self.animationState === 'forward') {
		advanceLine();
	}
};

lineChartByYear.prototype.correctYear = function(currYear) {
	var self = this;
	if (currYear != self.currYear) {
		self.currYear = currYear;
		self.currYearIndicator
			.attr('x1', self.x(self.currYear))
			.attr('x2', self.x(self.currYear));
		self.changeAnimationState();
	}
};

lineChartByYear.prototype.moveYearIndicator = function(currYear) {
	var self = this;

	self.currYear = currYear;
	self.currYearIndicator
		.attr('T', 0)
		.transition()
		.duration(self.transitionTimePerYear[self.currYear])
		.ease('linear')
		.attr('x1', self.x(self.currYear))
		.attr('x2', self.x(self.currYear))
		// .attr('y2', self.lineChartYScale(currVal))
		// .attr('data-state', 'stopped')
		.attr('T', 1)
		.each('end', function() {
			d3.select(this).attr('T', 0);
		});
	function highlightCurrYearTick() {
		self.svg.selectAll('.yearTick').selectAll('.highlightRect')
			.filter(function(d) { return d == self.currYear; })
			.attr('class', 'currYear')
			.transition()
			.duration(self.transitionTimePerYear[self.currYear]/4)
			.style('opacity', .1);
	}
	self.svg.selectAll('.yearTick').selectAll('.currYear')
		.classed('.currYear', false)
		.transition()
		.duration(self.transitionTimePerYear[self.currYear]/4)
		.style('opacity', 0);
	// highlightCurrYearTick();

	self.svg.selectAll('.yearArea.currYear')
		.classed('currYear', false)
		.transition()
		.duration(self.transitionTimePerYear[self.currYear]/4)
		// .style('opacity', self.yearAreaOpacity/2);
		.style('opacity', function(d) {
			if (d.year < self.currYear) {
				return self.yearAreaOpacity/2;
			} else {
				return 0;
			}
		});
	self.yearArea.filter(function(d) { return d.year == self.currYear; })
		.classed('currYear', true)
		.classed('hidden', false)
		.style('opacity', self.yearAreaOpacity*2)
		.transition()
		.duration(self.transitionTimePerYear[self.currYear]/2)
		.style('opacity', self.yearAreaOpacity);

	// make sure that everything is in order... i.e. that years before currYear are highlighted
	// and years after currYear are not
	self.yearArea.filter(function(d) { return d.year < self.currYear; })
		.classed('hidden', false)
		.style('opacity', self.yearAreaOpacity/2);
	self.yearArea.filter(function(d) { return d.year > self.currYear; })
		.style('opacity', 0);
	console.log(self.currYear);

};

lineChartByYear.prototype.addTitle = function(title) {
	var self = this;

	self.title = self.svg.append('text')
	    .attr('class', 'lineChartTitle')
	    .attr('x', self.lineChartDimensions.width/2)
	    .attr('y', 0 - (self.lineChartDimensions.margin.top / 2) )
	    .attr('text-anchor', 'middle')
	    .text(title);

};
