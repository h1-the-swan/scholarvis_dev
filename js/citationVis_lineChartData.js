var citationVis = citationVis || {};

citationVis.lineChartData = (function() {
	// Take in graph data and prepare it for line charts
	
	function getPewClassYear(graph) {
		var egoNode = graph.nodes[0];
		return egoNode.pew_Class;
	}

	function getFunding(graph) {
		var egoNode = graph.nodes[0];
		return egoNode.funding;
	}

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

	function getYearRange(cleanedLinks) {
		// Make sure all our data fall within the appropriate time span.
		// The minimum year is the earliest publication by the ego author (there will likely be no citations within this year, but this chart needs to line up with the other charts).
		// The maximum year is the last year that a paper cited one of the ego author's paper (checking to make sure it is not in the future, which would mean bad data).
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

	function prepareData_allCitations(graph) {
		// var data = {};
		var data = {};
		data['pew_Class'] = getPewClassYear(graph);
		data['funding'] = getFunding(graph);
		data['values'] = [];

		var cleanedLinks = cleanLinks(graph.links);
		var yearRange = getYearRange(cleanedLinks);

		// for (var i=yearRange[0]; i<=yearRange[1]; i++) {
		// 	// data[i] = 0;
		// 	data.push({year: i, count: 0});
		// }
		// cleanedLinks.forEach(function(d) {
		// 	data[d.sourceYear]++;
		// });
		data.values = getEmptyCountData(yearRange);
		cleanedLinks.forEach(function(d) {
			var thisSourceYear = d.sourceYear;
			var dataThisYear = data.values.filter(function(dd) { return dd.year===thisSourceYear; })[0];
			dataThisYear.count++;
		});

		return data;
	}

	function prepareData_egoAuthorPublications(graph) {
		var data = {};
		data['pew_Class'] = getPewClassYear(graph);
		data['funding'] = getFunding(graph);
		data['values'] = [];

		var cleanedLinks = cleanLinks(graph.links);
		var yearRange = getYearRange(cleanedLinks);
		data.values = getEmptyCountData(yearRange);
		var egoPapers = graph.nodes[0].papers;
		egoPapers = egoPapers.filter(function(d) {
			return ( (d.Year >= yearRange[0]) && (d.Year <= yearRange[1]) );
		})
		egoPapers.forEach(function(d) {
			var dataThisYear = data.values.filter(function(dd) { return dd.year==d.Year; })[0];
			dataThisYear.count++;
		});

		return data;
	}

	function prepareData_authorEigenfactorSum(graph) {
		// For each year, sum the eigenfactor (EF) of the ego author's paper's
		var data = {};
		data['pew_Class'] = getPewClassYear(graph);
		data['funding'] = getFunding(graph);
		data['values'] = [];

		var cleanedLinks = cleanLinks(graph.links);
		var yearRange = getYearRange(cleanedLinks);
		data.values = getEmptyCountData(yearRange);
		var egoPapers = graph.nodes[0].papers;
		egoPapers = egoPapers.filter(function(d) {
			return ( (d.Year >= yearRange[0]) && (d.Year <= yearRange[1]) );
		})
		egoPapers.forEach(function(d) {
			var dataThisYear = data.values.filter(function(dd) { return dd.year==d.Year; })[0];
			dataThisYear.count = dataThisYear.count + d.EF;
		});

		return data;
	}

	return {
		prepareData_allCitations: prepareData_allCitations,
		prepareData_egoAuthorPublications: prepareData_egoAuthorPublications,
		prepareData_authorEigenfactorSum: prepareData_authorEigenfactorSum
	};
}());


