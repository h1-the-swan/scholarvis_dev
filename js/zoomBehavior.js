var citationVis = citationVis || {};

$( document ).on( "initComplete", function() {
	var egoGraphVis = citationVis.egoGraphVis;
	if (egoGraphVis.zoomable == false) {
		return;
	}
	var zoom = egoGraphVis.zoom;
	egoGraphVis.zoomTranslate = zoom.translate();

	egoGraphVis.checkZoom = function(d) {
		var zoomThresholdMin = coordinates([0, 0])[1];  // minimum y value
		var zoomThresholdMax = coordinates([egoGraphVis.graphDimensions.width, egoGraphVis.graphDimensions.height])[1];  // maximum y value
		if (d.y < zoomThresholdMin || d.y > zoomThresholdMax) {
			console.log(zoom.translate());
			console.log(zoom.scale());
			console.log(coordinates([d.x, d.y]));
	console.log(coordinates([egoGraphVis.graphDimensions.width, egoGraphVis.graphDimensions.height]));
	console.log(coordinates([0,0]));
			// http://bl.ocks.org/mbostock/7ec977c95910dd026812
			egoGraphVis.group.call(zoom.event);

			// Record the coordinates (in data space) of the center (in screen space).
			var center0 = zoom.center();
			var translate0 = zoom.translate();
			var coordinates0 = coordinates(center0);
			zoom.scale(zoom.scale() * .9);

			// Translate back to the center.
			var center1 = point(coordinates0);
			zoom.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);

			egoGraphVis.group.transition().duration(500).call(zoom.event);
			// egoGraphVis.group.call(zoom.event);
		}
	};

	function coordinates(point) {
		var scale = zoom.scale();
		var translate = zoom.translate();
		return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
	}

	function point(coordinates) {
		var scale = zoom.scale();
		var translate = zoom.translate();
		return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
	}

	function testrecord() {
		var t = [300, 501];
		console.log('coordinates');
		console.log(t);
		console.log(coordinates(t));
	console.log(coordinates([egoGraphVis.graphDimensions.width, egoGraphVis.graphDimensions.height]));
	}

	$( document ).on( "animationFinished", function() {
		testrecord();
		console.log(zoom.translate());
		console.log(zoom.scale());
	});
	testrecord();
			// // Record the coordinates (in data space) of the center (in screen space).
			// var center0 = zoom.center();
			// var translate0 = zoom.translate();
			// var coordinates0 = coordinates(center0);
			// zoom.scale(zoom.scale() * .5);
            //
			// // Translate back to the center.
			// var center1 = point(coordinates0);
			// zoom.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);
            //
			// // egoGraphVis.group.transition().duration(200).call(zoom.event);
			// egoGraphVis.group.call(zoom.event);
			// testrecord();
});

