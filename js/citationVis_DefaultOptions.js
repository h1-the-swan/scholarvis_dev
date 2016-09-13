var citationVis = citationVis || {};

citationVis.default_options = (function() {
	// Dimensions of the largest part of the visualization (the graph)
	var dimensions = {
		width: 960,
		height: 500
	};
	// Dimensions of the line charts:
	dimensions.lineChart = {
		margin: {top: 30, right: 20, bottom: 30, left: 50}
	};
	dimensions.lineChart.width = dimensions.width * 3/4 - dimensions.lineChart.margin.left - dimensions.lineChart.margin.right;
	dimensions.lineChart.height = 110 - dimensions.lineChart.margin.top - dimensions.lineChart.margin.bottom;


	// Colors:
	// See http://colorbrewer2.org/?type=qualitative&scheme=Set1&n=8
	var colorScheme = ['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)',
			'rgb(152,78,163)','rgb(255,127,0)','rgb(255,255,51)',
			'rgb(166,86,40)','rgb(247,129,191)'];
	// I liked the blue better for the main color, so the next line just moves
	// the blue color (originally self.colorScheme[1]) to the front (self.colorScheme[0])
	colorScheme.splice(0, 0, colorScheme.splice(1, 1)[0]);

	var DEFAULT_OPTIONS = {
		colorScheme: colorScheme,
		dimensions: dimensions
	};

	return {
		defaults: DEFAULT_OPTIONS
	};
}());
