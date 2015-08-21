/*
 * Handles the setup and HTML rendering of the feeds.
 *
 * @param {Function} feedHandler
 * @param {Object} feedHandler.element: The jQuery element that hold the feed
 * @param {Object} feedHandler.settings: Defines all of the settings associated with a feed
 * @param {Boolean} feedHandler.status: Maintains the current status of a feed
 */

function mapper( element, settings ) {
	this.element = element;
	this.settings = settings;
	this.status = null;
}

mapper.prototype = {

    init: function( data ) {
		var self = this; // Register 'this' to keep scope
		var mapData = data.map;

		// Get new bounds object start and end long/lat from data
		var bound = new google.maps.LatLngBounds();
		var start = new google.maps.LatLng(data.start_latlng[0], data.start_latlng[1]);
		var end = new google.maps.LatLng(data.end_latlng[0], data.end_latlng[1]);
			bound.extend( start ); //Adding the start and end to the bounds
			bound.extend( end );
		var mapSq = 400; 
		var mapDim = { height: mapSq, width: mapSq };

		var map = new google.maps.Map(document.querySelector('.strava-map'), {
			zoom: self.getBoundsZoomLevel(bound, mapDim),
			center: bound.getCenter(),  // Center the map on ride.
			disableDefaultUI: true,
            zoomControl: false,
            scrollwheel: false,
		});

		var polyline = google.maps.geometry.encoding.decodePath(data.map.summary_polyline);

		poly = new google.maps.Polyline({
			strokeColor: '#fc4c02',
			strokeOpacity: 0.75,
			strokeWeight: 5
		});
		poly.setMap(map);

		var path;

		path = poly.getPath();
		path.push(start);
		each(polyline, function(index, value) {
			path = poly.getPath();
			path.push(value);
		});

		path = poly.getPath();
		path.push(end);

		new google.maps.Marker({ position: start, title: 'start', map: map });
		new google.maps.Marker({ position: end, title: 'end', map: map });

		// Write to the DOM
		var evt = new CustomEvent('stravafeeds:attachmap');
		window.dispatchEvent(evt);
		
		return map;
	},

	getBoundsZoomLevel: function(bounds, mapDim) {
		var WORLD_DIM = { height: 256, width: 256 };
		var ZOOM_MAX = 21;

		function latRad(lat) {
			var sin = Math.sin(lat * Math.PI / 180);
			var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
			return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
		}

		function zoom(mapPx, worldPx, fraction) {
			return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
		}

		var ne = bounds.getNorthEast();
		var sw = bounds.getSouthWest();

		var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

		var lngDiff = ne.lng() - sw.lng();
		var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

		var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
		var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

		return Math.min(latZoom, lngZoom, ZOOM_MAX);
	}
	
};
