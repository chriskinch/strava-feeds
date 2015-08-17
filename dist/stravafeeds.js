(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory();
    }
    else if(typeof define === 'function' && define.amd) {
        define('stravafeeds', [], factory);
    }
    else {
        root['stravafeeds'] = factory();
    }
}(this, function() {

  /*
   * Controls the setup and JSON loading of each feed.
  	* @param {Function} feedLoader
  * @param {Function} feedLoader.init (Required)
  *
  * @param {String} selector: ID or class that will contain the feed
  * @param {String} user: The user name to fetch top albums for.
  * @param {String} access_token: Your Strava API key.
  * @param {String} method: The type of API to call to be made. (e.g: user.gettopalbums|user.getrecenttracks)
  *
  * @param {Object} options: Options object (Optional) 
  * @param {Number} options.limit: The number of results to fetch per page. Defaults to 10.
  * @param {Number} options.size: The size of the albumb art to return.
  * @param {String} options.period: The time period over which to retrieve top albums for (e.g: overall|7day|1month|3month|6month|12month)
  * @param {Boolean} options.cover: Toggles the rendering of the cover image
  * @param {Boolean} options.album: Toggles the rendering of the album name
  * @param {Boolean} options.artist: Toggles the rendering of the artist name
  * @param {Boolean} options.plays: Toggles the rendering of the play count
  * @param {Boolean} options.date: Toggles the rendering of the date played
  * @param {Boolean} options.playing: Toggles the rendering of the current playing track (note: user.getrecenttracks only)
  */

  // All currently instantiated instances of feeds
  var ALL_INSTANCES = {};

  function Feed() {}

  Feed.prototype = {

  	init: function( selector, user, access_token, method, options ){
  		var instance = {};
  		// reference to the jQuery version of DOM element.
  		instance.selector = selector;
  		instance.element = document.querySelector(selector);
  		
  		// Setup variables and defaults.
  		var defaults = {
  			per_page:	1,
  		};

  		// Final properties and options are merged to default.
  		instance.settings = extend({}, defaults, options);  //TO DO

  		// Setting up JSOM config from provided params and settings.
  		instance.config = {
  			url:'http://www.strava.com/api' + method,
  			params: {
  				//user: user,
  				access_token: access_token,
  				per_page: instance.settings.per_page,
  				callback: '?'
  			}
  		};
  		
  		//JSON load
  		var evt = new CustomEvent('stravafeeds:init');
  		window.dispatchEvent(evt);

  		var feed = new FeedLoader( instance.element, instance.settings );
  			feed.loadFeed( instance.config.url, instance.config.params );

  		// Saving instance to array for later use.
  		ALL_INSTANCES[selector] = instance;
  	},

  	destroy: function( selectors ) {
  		// Loop through selectors provided. If undefined destroy all.
  		if(selectors === undefined) selectors = Object.keys(ALL_INSTANCES);

  		each(selectors, function(index, value) {
  			var instance = ALL_INSTANCES[value];
  			var element = document.querySelectorAll(value);
  			if(instance !== undefined) {
  				var evt = new CustomEvent('stravafeeds:destroy');
  				window.dispatchEvent(evt);
  				element[0].innerHTML = null;
  				delete ALL_INSTANCES[value];
  			}
  		});
  	},

  	refresh: function( selectors ) {
  		var self = this;
  		// Loop through selectors provided. If null refresh all.
  		if(selectors === undefined) selectors = Object.keys(ALL_INSTANCES);
  		
  		each(selectors, function(index, value) {
  			var instance = ALL_INSTANCES[value];
  			var element = document.querySelectorAll(value);
  			if(instance !== undefined) {
  				var evt = new CustomEvent('stravafeeds:refresh');
  				window.dispatchEvent(evt);
  				var feed = new FeedLoader( element, instance.settings );
  					feed.loadFeed( instance.config.url, instance.config.params );
  				self.destroy([value]);
  				ALL_INSTANCES[value] = instance;
  			}
  		});
  	},

  	update: function( selector, options) {
  		var instance = ALL_INSTANCES[selector];
  		var defaults = instance.settings;
  		// Final properties and options are merged to default.
  		instance.settings = extend({}, defaults, options);
  		var evt = new CustomEvent('stravafeeds:update');
  		window.dispatchEvent(evt);
  		this.refresh([selector]);
  	},

  	feeds: function() {
  		return ALL_INSTANCES;
  	}

  };
  /*
   * Controls the setup and JSON loading of each feed.
  	* @param {Function} feedLoader
  * @param {Function} feedLoader.init (Required)
  *
  * @param {String} selector: ID or class that will contain the feed
  */



  function FeedLoader( element, settings ) {
  	this.element = element;
  	this.settings = settings;
  	this.status = null;
  }

  FeedLoader.prototype = {

  	loadFeed: function( url, params ){
  		var self = this;

  		var evt = new CustomEvent('stravafeeds:getjson');
  		window.dispatchEvent(evt);

  		var prm = objToParams(params);

  		$.getJSON(url, prm, function(data){
  			console.log(data);
  			var handler = new FeedHandler( self.element, self.settings );
  				handler.render( data[0] );
  		});
  	}

  };
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
  /*
   * Handles the setup and HTML rendering of the feeds.
   *
   * @param {Function} feedHandler
   * @param {Object} feedHandler.element: The jQuery element that hold the feed
   * @param {Object} feedHandler.settings: Defines all of the settings associated with a feed
   * @param {Boolean} feedHandler.status: Maintains the current status of a feed
   */

  function mapper( ) {
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
  String.prototype.cleanup = function() {
  	return this.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-');
  };

  Array.prototype.clean = function(del) {
  	for (var i = 0; i < this.length; i++) {
  		if (this[i] === del) {
  			this.splice(i, 1);
  			i--;
  		}
  	}
  	return this;
  };

  function setClassesArray(item, key, limit) {
  	var first = (key === 0) ? 'first' : '';
  	var last = (key === limit-1) ? 'last' : '';
  	var classes_array = [item, first, last];
  	var classes = classes_array.clean('').join(' ').trim();

  	return classes;
  }

  function timeAgo(date){
  	var m = 60;
  	var h = m * 60;
  	var d = new Date();
  	var n = d.getTime();
  	var now = String(n).substr(0,date.uts.length);
  	var elapsed = now - date.uts;
  	var elapsed_string = (elapsed/m < 60) ? Math.round(elapsed/m) + ' minute' : (elapsed/h < 24) ? Math.round(elapsed/h) + ' hour' : null;
  	var plural = (elapsed > 1) ? 's' : '';

  	var when = (elapsed_string) ? elapsed_string + plural + ' ago' : date['#text'];
  	return when;
  }

  /**
  * Helper function for iterating over a collection
  *
  * @param list
  * @param fn
  */
  function each(list, fn) {
  	for (var key in list) {
  		if( list.hasOwnProperty(key) ) {
  			cont = fn(key, list[key]);
  			if(cont === false) {
  				break; //allow early exit
  			}
  		}
  	}
  }

  function extend(){
  	for(var i=1; i<arguments.length; i++)
  		for(var key in arguments[i])
  			if(arguments[i].hasOwnProperty(key))
  				arguments[0][key] = arguments[i][key];
  	return arguments[0];
  }

  /**
  * Helper function for turning object into a string of params
  *
  * @param obj
  */
  function objToParams(obj) {
  	var str = "";
  	for (var key in obj) {
  		if (str !== "") {
  			str += "&";
  		}
  		str += key + "=" + obj[key];
  	}
  	return str;
  }

  /**
   * CustomEvent polyfill
   */
  if (typeof window.CustomEvent !== 'function') {
    (function() {
      function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
       }

      window.CustomEvent = CustomEvent;

      CustomEvent.prototype = window.CustomEvent.prototype;
    })();
  }

  return new Feed();

}));
