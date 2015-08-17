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
