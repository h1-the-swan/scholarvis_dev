// https://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0; i<vars.length; i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable) {return pair[1];}
    }
    return(false);
}

// var json_fname = 'static/data.json';
var json_fname = 'static/cached_data/data.json';
// http://stackoverflow.com/questions/13053096/avoid-data-caching-when-using-d3-text
json_fname = json_fname + '?' + Math.floor(Math.random() * 1000);
var selectedID = getQueryVariable('id');
console.log(selectedID);
if (window.location.pathname === "/pewscholars") {
	if (!selectedID) {
		selectedID = "11";
	}
	json_fname = 'static/pewdata/data_' + selectedID + '.json';
	if (getQueryVariable('extendedData')) {
		// json_fname = 'static/pewdata/alldata/' + json_fname;
		json_fname = 'static/pewdata/alldata/data_' + selectedID + '.json';
	}
}
if (window.location.pathname === "/healthra") {
	if (!selectedID) {
		selectedID = "0";
	}
	json_fname = 'static/healthra/data/data_' + selectedID + '.json';
}

// json_fname = 'static/healthra/org_3_visdata.json'
if (window.location.pathname === "/healthra-org-view") {
	if (!selectedID) {
		selectedID = "3";
	}
	json_fname = 'static/healthra/visdata_org_' + selectedID + '.json';
	console.log(json_fname);
}
console.log(json_fname);

var citationVis = citationVis || {};

citationVis.getTransitionTimePerYear= function(graph, longestYearTransitionTime) {
	// This will let us vary the transition time per year
	var transitionTimePerYear = {};
	var emptyYearTransitionTime = 300;
	// var longestYearTransitionTime = 4000;
	// Set default value:
	// http://stackoverflow.com/questions/894860/set-a-default-parameter-value-for-a-javascript-function
	var longestYearTransitionTime = typeof longestYearTransitionTime !== 'undefined' ? longestYearTransitionTime : 4000;
	// This scale takes the number of nodes for a given year as input
	// and outputs the transition time, based on a threshold mapping
	var thresholdScale = d3.scale.threshold()
		.domain([1, 3, 10, 20, 30])
		.range([
				emptyYearTransitionTime,  // zero nodes
				longestYearTransitionTime * .2,  // one or two nodes
				longestYearTransitionTime * .5, // 3 to 9
				longestYearTransitionTime * .7,  // 10 to 19
				longestYearTransitionTime * .85,  // 20 to 29
				longestYearTransitionTime  // 30+
				]);
	var yearRange = graph.graph.yearRange;
	
	// Put the transition time for each year into an object
	for (var i=yearRange[0]; i<=yearRange[1]; i++) {
		if (citationVis.graph_data.unavailable === true) {
			transitionTimePerYear[i] = 100;
		} else {
			transitionTimePerYear[i] = thresholdScale(graph.graph.nodeCountsPerYear[i]);
		}
	}
	return transitionTimePerYear;
};

citationVis.yearTickClickEventListener = function() {
    // Add click listeners to line chart axis tick labels (years).
    // On click, a new destination node will be set.
    d3.selectAll('.yearTick')
        .on('click', function(d) {
            // Get the year (as integer)
            var destinationYear = this.getAttribute('data-year');
            // Stop all transitions on nodes and links
            d3.selectAll('.node, .link').transition().duration(0);

			citationVis.egoGraphVis.newDestinationNode(destinationYear);
        });
};

d3.select('#infoDiv').append('p').text('Loading...');

d3.json(json_fname, function(error, graph) {
	if (error) throw error;

	console.log(graph);
	// // Get the most common Domain IDs for the ego author's papers
	// var domainsNest = d3.nest()
	// 	.key(function(d) { return d.DomainID; }).sortValues(d3.descending)
	// 	.rollup(function(leaves) { return leaves.length; })
	// 	.entries(graph.nodes[0].papers);
	// domainsNest.sort(function(a,b) { return d3.descending(a.values, b.values); });
	// // store as a node property
	// graph.nodes[0].DomainCounts = domainsNest;
	// console.log(graph);
	// // d3.select('#infoDiv').append('p').text(graph.nodes[0].AuthorName);
	// d3.select('#infoDiv').select('p').text(graph.nodes[0].AuthorName);
    //
    //
	var default_options = citationVis.default_options;
	// 	summaryStatistics = citationVis.summaryStatistics,
	// 	egoGraphData = citationVis.egoGraphData,
	//     lineChartData = citationVis.lineChartData,
	// 	eventListeners = citationVis.eventListeners;

	var options = default_options.defaults;
	console.log(options);

	// graph = summaryStatistics.addSummaryStatistics(graph);
	// citationVis.graph_data = egoGraphData.prepare_egoGraphData(graph);
	// citationVis.publications_data = lineChartData.prepareData_egoAuthorPublications(graph);
	// citationVis.all_citations_data = lineChartData.prepareData_allCitations(graph);
	// citationVis.eigenfactor_sum_data = lineChartData.prepareData_authorEigenfactorSum(graph);
	citationVis.graph_data = graph['graph_data'];
	citationVis.graph_data.nodes[0].organization = citationVis.graph_data.nodes[0].orgName;
	citationVis.graph_data.nodes[0].AuthorName = citationVis.graph_data.nodes[0].orgName;
	citationVis.publications_data = graph['publications_data'];
	citationVis.all_citations_data = graph['all_citations_data'];
	citationVis.eigenfactor_sum_data = graph['eigenfactor_sum_data'];
	console.log(citationVis);
	// var alldata = {
	// 	'graph_data': citationVis.graph_data,
	// 	'publications_data': citationVis.publications_data,
	// 	'all_citations_data': citationVis.all_citations_data,
	// 	'eigenfactor_sum_data': citationVis.eigenfactor_sum_data
	// }
	// var _json = JSON.stringify(alldata);
	// console.log(_json);
	// var blob = new Blob([_json], {type: "application/json"});
	// var _url = window.URL.createObjectURL(blob);
	// console.log(_url);
	// window.location=_url;


	// Visualization objects go here
	if (citationVis.graph_data.unavailable === true) {
		console.log('true');
	} else {
		citationVis.egoGraphVis = new egoGraphVis(citationVis.graph_data);
	}
	// citationVis.publicationsLineChart = new lineChartByYear(citationVis.publications_data);
	// citationVis.citationsLineChart = new lineChartByYear(citationVis.all_citations_data);
	// citationVis.eigenfactorSumLineChart = new lineChartByYear(citationVis.eigenfactor_sum_data);
	citationVis.lineCharts = [];
	citationVis.lineCharts.push(new lineChartByYear(citationVis.publications_data));
	citationVis.lineCharts.push(new lineChartByYear(citationVis.all_citations_data));
	citationVis.lineCharts.push(new lineChartByYear(citationVis.eigenfactor_sum_data));

	// graph.graph = {};
	// graph.graph.yearRange = [1958, 2012];
	options.transitionTimePerYear = citationVis.getTransitionTimePerYear(citationVis.graph_data);

	citationVis.egoGraphVis.importDefaultOptions(options);
	// citationVis.publicationsLineChart.importDefaultOptions(options);
	// citationVis.citationsLineChart.importDefaultOptions(options);
	// citationVis.eigenfactorSumLineChart.importDefaultOptions(options);
	for (var i=0; i<citationVis.lineCharts.length; i++) {
		citationVis.lineCharts[i].importDefaultOptions(options);
	}

	citationVis.egoGraphVis.init();
	// citationVis.publicationsLineChart.init();
	// citationVis.citationsLineChart.init();
	// citationVis.eigenfactorSumLineChart.init();
	for (var i=0; i<citationVis.lineCharts.length; i++) {
		citationVis.lineCharts[i].init();
	}
	$.event.trigger({
		type: "initComplete",
	});

	citationVis.lineCharts[0].addTitle("Number of publications");
	citationVis.lineCharts[1].addTitle("Number of citations received");
	citationVis.lineCharts[2].addTitle("Sum of eigenfactor for this organization's publications by year");


	// var animationState = 'init';
	// var test = citationVis.egoGraphVis.animationState;
	// console.log(test);
	// var checkAnimationInterval = setInterval(function() {
	// 	                             var currAnimationState = citationVis.egoGraphVis.animationState;
	// 								 if (currAnimationState != animationState) {
	// 									 animationState = currAnimationState;
	// 									 for (var i=0; i<citationVis.lineCharts.length; i++) {
	// 										 citationVis.lineCharts[i].changeAnimationState(animationState);
	// 									 }
    //
	// 								 }
	// }, 100);
	$( document ).on( "yearChange", function() {
		var currYear = citationVis.egoGraphVis.currYear;
		for (var i=0; i<citationVis.lineCharts.length; i++) {
			citationVis.lineCharts[i].moveYearIndicator(currYear);
		}
	});

	// Hack to label the publications line chart. TODO: Fix this later
	// var pubs = d3.select(citationVis.publicationsLineChart.chartDiv[0][0]);
	var pubs = d3.select(citationVis.lineCharts[0].chartDiv[0][0]);
	// console.log(pubs);
	// console.log(d3.select('#chartsDiv'));
	// console.log(citationVis.publicationsLineChart.chartDiv[0]);
	// console.log(pubs.select('.y.axis').select('.axisLabel'));
	var pubsAxisLabel = pubs.select('.y.axis').select('.axisLabel');
	pubsAxisLabel.text('Num publications');
	// Hack to alter eigenfactor line chart. TODO: Fix this later
	// citationVis.eigenfactorSumLineChart.yAxis.tickFormat(d3.format('e'));
	citationVis.lineCharts[2].yAxis.tickFormat(d3.format('e'));
	// var EFChart = d3.select(citationVis.eigenfactorSumLineChart.chartDiv[0][0]);
	var EFChart = d3.select(citationVis.lineCharts[2].chartDiv[0][0]);
	EFChart.select('.y.axis')
		// .call(citationVis.eigenfactorSumLineChart.yAxis)
		.call(citationVis.lineCharts[2].yAxis)
		.select('.axisLabel').text('Sum of Eigenfactor');


	// Event listeners
	// Event listeners that act across different visualization objects go here
	citationVis.yearTickClickEventListener();
	
});

