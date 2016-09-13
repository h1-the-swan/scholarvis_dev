var citationVis = citationVis || {};

citationVis.eventListeners = (function() {
	// Event listeners that act across different visualization objects go here
	
	// function tooltipListener() {
	// 	// Add event listener to nodes for tooltip:
	// 	d3.selectAll('.node')
	// 		.on('mouseover', function(d) {
	// 			var tooltipHtml = self.makeTooltip(d);
	// 			self.tooltip = self.tooltip
	// 				.html(tooltipHtml)
	// 				.style('visibility', 'visible')
	// 				.style('border-style', 'solid')
	// 				.style('border-color', d.color);
	// 		})
	// 		.on('mousemove', function() {
	// 			self.tooltip = self.tooltip
	// 				.style('visibility', 'visible')
	// 				.style('top', (d3.event.pageY-10)+'px')
	// 				.style('left', (d3.event.pageX+10)+'px');
	// 		})
	// 		.on('mouseout', function() {
	// 			self.tooltip = self.tooltip.style('visibility', 'hidden'); });
	// }

	return {
		// tooltipListener: tooltipListener
	};
}());
