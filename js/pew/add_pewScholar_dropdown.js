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

// http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
function updateQueryStringParameter(uri, key, value) {
	var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	if (uri.match(re)) {
		return uri.replace(re, '$1' + key + "=" + value + '$2');
	}
	else {
		return uri + separator + key + "=" + value;
	}
}



var pewScholarSelectDiv = d3.select('#mainDiv').append('div')
                              .attr('id', 'selectDiv');
pewScholarSelectDiv.append('p').text('Select a different Pew Scholar:');
var pewScholarSelect = pewScholarSelectDiv.append('select')
                           .attr('id', 'pewScholarSelect');
pewScholarSelect.on('change', function() {
	var slct = d3.select(this);
	var selectedIndex = d3.select(this).property('selectedIndex');
	var opt = slct.selectAll('option')[0][selectedIndex].__data__;
	// refresh with new url
	var currentURL = window.location;
	var newURL = currentURL.pathname;
	newURL = updateQueryStringParameter(newURL, 'id', opt.PewScholarID);
	console.log(opt.PewScholarID);
	window.location.href = newURL;
});

var currPewScholarID = getQueryVariable('id');
d3.csv('static/js/directory.csv', function(error, data) {
	console.log(data);
	var option = pewScholarSelect.selectAll('option')
	    .data(data)
	    .enter().append('option')
	    .text(function(d) { return d.Name; })
	    .attr('value', function(d) { return d.PewScholarID; });

	// Change current dropdown selection to the correct pew scholar
	if (currPewScholarID) {
		option.each(function(d, i) {
			if (d.PewScholarID == currPewScholarID) {
				pewScholarSelect.property('selectedIndex', i);
			}
		});
	}
});

