var citationVis = citationVis || {};

citationVis.summaryStatistics = (function() {

	function addSummaryStatistics(graph) {

		function cleanLinks(links) {
			var cleanedLinks = [];
			links.forEach(function(d) {
				if ( (typeof d.linkToEgo != 'undefined') && (d.linkToEgo === true) ) {
					var sourceYear = +d.sourceYear;
					var targetYear = +d.targetYear;
					if ( (sourceYear > 0) && (targetYear > 0) && (sourceYear >= targetYear) ) {
						cleanedLinks.push(d);
					}
				}
			});
			return cleanedLinks;
		}

		function getYearRange(links) {
			// A lot of this code was copied from lineChartData
			// May need to clean this up (TODO)

			// Make sure all our data fall within the appropriate time span.
			// The minimum year is the earliest publication by the ego author (there will likely be no citations within this year, but this chart needs to line up with the other charts).
			// The maximum year is the last year that a paper cited one of the ego author's paper (checking to make sure it is not in the future, which would mean bad data).
			var cleanedLinks = cleanLinks(links);
			var minYear = d3.min(cleanedLinks, function(d) { return d.targetYear>0 ? d.targetYear : null; });
			// Get current year (using today's date):
			var todayYear = new Date().getFullYear();
			var maxYear = d3.max(cleanedLinks, function(d) { return d.sourceYear<=todayYear ? d.sourceYear : null; });
			return [minYear, maxYear];
		}


		function getEmptyCountData(yearRange) {
			var emptyCountData = [];
			for (var i=yearRange[0]; i<=yearRange[1]; i++) {
				emptyCountData.push({year: i, count: 0});
			}
			return emptyCountData;
		}

		function getCitationCountsPerYear(graph) {
			var citationCountsPerYear = getEmptyCountData(graph.graph.yearRange);
			var cleanedLinks = cleanLinks(graph.links);
			cleanedLinks.forEach(function(d, i) {
				var thisSourceYear = d.sourceYear;
				var dataThisYear = citationCountsPerYear.filter(function(dd) { return dd.year===thisSourceYear; })[0];
				dataThisYear.count++;
			});

			return citationCountsPerYear;
		}

		graph.graph.yearRange = getYearRange(graph.links);
		graph.graph.citationCountsPerYear = getCitationCountsPerYear(graph);
		return graph;
	}

	return {
		addSummaryStatistics: addSummaryStatistics
	};
}());



