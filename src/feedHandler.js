/*
 * Handles the setup and HTML rendering of the feeds.
 *
 * @param {Function} feedHandler
 * @param {Object} feedHandler.element: The jQuery element that hold the feed
 * @param {Object} feedHandler.settings: Defines all of the settings associated with a feed
 * @param {Boolean} feedHandler.status: Maintains the current status of a feed
 */

function FeedHandler( element, settings ) {
	this.element = element;
	this.settings = settings;
	this.status = null;
}

FeedHandler.prototype = {

    render: function( feed ) {
		var self = this, // Register 'this' to keep scope
			classes = null,
			fragment = document.createDocumentFragment(),
			m, map, title,
			ul = document.createElement("ul");

		title = self.buildDOMElement("div", {'className': 'strava-title', 'innerHTML': feed.name });
		fragment.appendChild(title);

		// Attach the ul after other elements e.g: title
		fragment.appendChild(ul);

		// Convert various data points
		var average_speed = self.convertUnit(feed.average_speed, 'meterssec-mileshr', 1);
		var max_speed = self.convertUnit(feed.max_speed, 'meterssec-mileshr', 1);
		var moving_time = self.secToTime(feed.moving_time);
		var distance = self.convertUnit(feed.distance, 'meters-miles', 1);
		var total_elevation_gain = self.convertUnit(feed.total_elevation_gain, 'meters-feet', 0);

		var group = [];

		group.push( self.buildDOMElement("li", {'className': 'strava-average_speed', 'innerHTML': average_speed }) );
		group.push( self.buildDOMElement("li", {'className': 'strava-max_speed', 'innerHTML': max_speed }) );
		group.push( self.buildDOMElement("li", {'className': 'strava-moving_time', 'innerHTML': moving_time }) );
		group.push( self.buildDOMElement("li", {'className': 'strava-distance', 'innerHTML': distance }) );
		group.push( self.buildDOMElement("li", {'className': 'strava-elevation', 'innerHTML': total_elevation_gain }) );
		group.push( self.buildDOMElement("li", {'className': 'strava-calories', 'innerHTML': feed.kilojoules }) );
		
		map = self.buildDOMElement("div", {'className':'strava-map'});
		fragment.appendChild(map);

		//li = self.buildDOMElement("li", {'title': title, 'className':classes});
		//ol.appendChild(li);

		//link = self.buildDOMElement("a", {'href': val.url, 'target':'_blank'});
		//li.appendChild(link);

		//var src = val.image[self.getImageKey(self.settings.size)]['#text'],
		//	img = self.buildDOMElement("img", {'src': src, 'className':'cover', 'width':self.settings.size, 'height':self.settings.size}, self.settings.cover);
		//link.appendChild(img);

		each(group, function(i, el){
			ul.appendChild(el);
		});

		// Write to the DOM
		var evt = new CustomEvent('stravafeeds:attachelement');
		window.dispatchEvent(evt);
		this.element.appendChild(fragment);

		// Build the map element
		m = new mapper();
		map = m.init( feed );

	},

	buildDOMElement: function(el, attrs, check) {
		if( check !== false ) {
			var node = document.createElement(el);
			each(attrs, function(key, val){
				node[key] = val;
			});
			return node;
		}
	},

	convertUnit: function( org, unit, dp ){
		var con = null;

		switch( unit ){
			case 'meterssec-mileshr':
				con = 2.236936;
				break;
			case 'meters-miles':
				con = 0.0006213711922;
				break;
			case 'meters-feet':
				con = 3.280839895;
				break;
			default:
				console.log("Conversion not defined!");
		}

		var output = org * con;

		return output.toFixed(dp);
	},

	secToTime: function( time ){
		// Hours, minutes and seconds
		var hrs = ~~(time / 3600);
		var mins = ~~((time % 3600) / 60);
		var secs = time % 60;

		// Output like "1:01" or "4:03:59" or "123:03:59"
		ret = "";

		if (hrs > 0)
			ret += "" + hrs + ":" + (mins < 10 ? "0" : "");

		ret += "" + mins + ":" + (secs < 10 ? "0" : "");
		ret += "" + secs;
		return ret;
	}
	
};
