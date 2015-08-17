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
