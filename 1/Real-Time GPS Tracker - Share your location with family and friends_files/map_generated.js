if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.maps === 'undefined') {
	com.greenalp.maps = {};
}

// Map

com.greenalp.maps.Map = function(divId, options) {
	this._mapNative = null;
	this.googleEarth = null;

	var mapType = google.maps.MapTypeId.ROADMAP;
	var pMapType = options.mapTypeId;
	if (pMapType == "terrain") {
		mapType = google.maps.MapTypeId.TERRAIN;
	} else if (pMapType == "satellite") {
		mapType = google.maps.MapTypeId.SATELLITE;
	} else if (pMapType == "hybrid") {
		mapType = google.maps.MapTypeId.HYBRID;
	}

	var zoomLevel = options.zoom;

	var myOptions = {
		zoom : zoomLevel,

		mapTypeControlOptions : {
			// overwritten in google earth code
			mapTypeIds : [ google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN ]
		// style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
		},
		scaleControl : true,
		center : new google.maps.LatLng(options.center.lat, options.center.lon),
		mapTypeId : mapType
	};

	var that = this;

	var initEarth = null;
	initEarth = function() {
		if (that._mapNative == null) {
			window.setTimeout(initEarth, 10);
			return;
		}
		that.googleEarth = new GoogleEarth(that._mapNative);
	};

	google.load('earth', '1', {
		callback : initEarth
	});

	this._mapNative = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
};

com.greenalp.maps.Map.prototype.enableZoomControl = function() {
	this._mapNative.setOptions({
		zoomControl : true
	});
};
com.greenalp.maps.Map.prototype.setCenter = function(trackpoint) {
	this._mapNative.setCenter(new google.maps.LatLng(trackpoint.lat, trackpoint.lon));
};

com.greenalp.maps.Map.prototype.setZoom = function(zoomLevel) {
	this._mapNative.setZoom(zoomLevel);
};

com.greenalp.maps.Map.prototype.getZoom = function() {
	return this._mapNative.getZoom();
};

com.greenalp.maps.Map.prototype.addKmlLayer = function(kmlurl) {
	if (kmlurl != null) {
		new google.maps.KmlLayer(encodeURI(kmlurl), {
			preserveViewport : true,
			map : this._mapNative
		});
	}
};

com.greenalp.maps.Map.prototype.fitFriends = function(friends) {
	var bounds = new google.maps.LatLngBounds();

	for (var i = 0; i < friends.length; i++) {
		var friend = friends[i];
		if (friend.data != null && friend.data.lastposition != null) {
			bounds.extend(new google.maps.LatLng(friend.data.lastposition.lat, friend.data.lastposition.lon));
		}
	}
	this._mapNative.fitBounds(bounds);
};

com.greenalp.maps.Map.prototype.setEventListener = function(eventtype, handler) {
	if (eventtype == "dragstart") {
		google.maps.event.addListener(this._mapNative, "dragstart", function() {
			handler();
		});
	}
};

com.greenalp.maps.Map.prototype.configureContextMenu = function(handler) {
	google.maps.event.addListener(this._mapNative, 'rightclick', function(event) {
		handler({
			"lat" : event.latLng.lat(),
			"lon" : event.latLng.lng()
		});
	});
};

// Icon

com.greenalp.maps.Icon = function(options) {
	var anchor = options.anchor;
	if (anchor == "center") {
		anchor = [ 10, 16 ];
	}
	var scaledSize = options.scaledSize;
	if (scaledSize != null) {
		scaledSize = new google.maps.Size(options.scaledSize[0], options.scaledSize[1]);
	}
	this._iconNative = {
		url : options.url,
		// iconRetinaUrl: 'my-icon@2x.png',
		scaledSize : scaledSize,
		"anchor" : new google.maps.Point(anchor[0], anchor[1])
	// popupAnchor: [-3, -76],
	// shadowUrl: 'my-icon-shadow.png',
	// shadowRetinaUrl: 'my-icon-shadow@2x.png',
	// shadowSize: [68, 95],
	// shadowAnchor: [22, 94]
	};

};

// Marker

com.greenalp.maps.Marker = function(options) {
	this._map = options.map;
	this._trackpoint = options.position;
	this._icon = (options.icon != null ? options.icon : null);
	this._popup = null;
	this._friend = options.friend;
	this._polyline = null;

	var markeroptions = {
		position : new google.maps.LatLng(this._trackpoint.lat, this._trackpoint.lon)
	};
	if (this._map != null) {
		markeroptions.map = this._map._mapNative;
	}

	if (this._icon != null) {
		markeroptions.icon = this._icon._iconNative;
	}

	this._markerNative = new google.maps.Marker(markeroptions);

	this._markerNative.greenalpObjectId = "marker" + this._friend.data.userId; // for

};

com.greenalp.maps.Marker.prototype.setMap = function(map) {
	this._map = map;
	this._markerNative.setMap(map != null ? map._mapNative : null);
};

com.greenalp.maps.Marker.prototype.getMap = function() {
	return this._markerNative.getMap();
};

com.greenalp.maps.Marker.prototype.setPosition = function(trackpoint) {
	this._trackpoint = trackpoint;
	this._markerNative.setPosition(new google.maps.LatLng(this._trackpoint.lat, this._trackpoint.lon));

	// for google earth:
	this._markerNative.alt = this._trackpoint.alt;

	var popup = this._popup;
	if (popup != null) {
		popup.setPosition(trackpoint);
	}
};

com.greenalp.maps.Marker.prototype.getPosition = function() {
	return this._trackpoint;
};

com.greenalp.maps.Marker.prototype.setPolyline = function(polyline) {
	this._polyline = polyline;
};

com.greenalp.maps.Marker.prototype.getPolyline = function() {
	return this._polyline;
};

com.greenalp.maps.Marker.prototype.setIcon = function(icon) {
	this._icon = icon;
	this._markerNative.setIcon(this._icon._iconNative);
};

com.greenalp.maps.Marker.prototype.setOnClickListener = function(handler) {
	var that = this;
	google.maps.event.addListener(this._markerNative, 'click', function() {
		handler(that._polyline);
	});
};

// Polyline
com.greenalp.maps.Polyline = function(options) {
	this._map = null;
	// make model for google polyline
	this._trackpointsMvc = new google.maps.MVCArray();

	this._trackId = options.trackId;

	var polylineoptions = {
		"path" : this._trackpointsMvc,
		strokeColor : options.strokeColor,
		strokeOpacity : options.strokeOpacity,
		strokeWeight : options.strokeWeight
	};

	this._polylineNative = new google.maps.Polyline(polylineoptions);

	// bug workaround
	this._trackpointsMvc = this._polylineNative.getPath();

	// make a copy
	for (var i = 0; i < options.path.length; i++) {
		// use insert instead push to trigger event on Google Earth
		this._trackpointsMvc.insertAt(this._trackpointsMvc.getLength(), new google.maps.LatLng(options.path[i].lat, options.path[i].lon));
	}

	// make a copy
	this._trackpoints = [];
	for (var i = 0; i < options.path.length; i++) {
		this._trackpoints.push(options.path[i]);
	}

	// for google earth
	this._polylineNative.greenalpObjectId = this._trackId;

};

com.greenalp.maps.Polyline.prototype.addTrackpoint = function(trackpoint) {
	this._trackpoints.push(trackpoint);

	// set alt for google earth
	var latlng = new google.maps.LatLng(trackpoint.lat, trackpoint.lon);
	latlng.alt = trackpoint.alt;

	// use insert instead push to trigger event on Google Earth
	this._trackpointsMvc.insertAt(this._trackpointsMvc.getLength(), latlng);
};

com.greenalp.maps.Polyline.prototype.size = function() {
	return this._trackpoints.length;
};

com.greenalp.maps.Polyline.prototype.pop = function() {
	this._trackpoints.pop();
	this._trackpointsMvc.pop();
};

com.greenalp.maps.Polyline.prototype.getAt = function(idx) {
	return this._trackpoints[idx];
};

com.greenalp.maps.Polyline.prototype.removeAt = function(index) {
	this._trackpointsMvc.removeAt(index);
	this._trackpoints.splice(index, 1);
};

com.greenalp.maps.Polyline.prototype.setMap = function(map) {
	this._map = map;
	this._polylineNative.setMap(map != null ? map._mapNative : null);
};

com.greenalp.maps.Polyline.prototype.setOnClickListener = function(handler) {
	google.maps.event.addListener(this._polylineNative, 'click', function(event) {
		handler({
			"latLng" : {
				"lat" : event.latLng.lat(),
				"lon" : event.latLng.lng()
			}
		});
	});
};

com.greenalp.maps.Polyline.prototype.setOnMouseMoveListener = function(handler) {
	google.maps.event.addListener(this._polylineNative, 'mousemove', function(event) {
		handler({
			"latLng" : {
				"lat" : event.latLng.lat(),
				"lon" : event.latLng.lng()
			}
		});
	});
};

// Circle

com.greenalp.maps.Circle = function(options) {
	this._map = null;
	this._friend = options.friend;

	this._circleNative = new google.maps.Circle({
		fillOpacity : options.fillOpacity,
		strokeOpacity : options.strokeOpacity,
		strokeWeight : options.strokeWeight,
		clickable : false
	// ,
	// map : trackingInstance.map
	});

	this._circleNative.greenalpObjectId = "acccircle" + this._friend.data.userId;

};

com.greenalp.maps.Circle.prototype.setMap = function(map) {
	this._map = map;
	this._circleNative.setMap(map != null ? map._mapNative : null);
};

com.greenalp.maps.Circle.prototype.setRadius = function(radius) {
	this._circleNative.setRadius(radius);
};

com.greenalp.maps.Circle.prototype.setOptions = function(options) {
	this._circleNative.setOptions({
		"strokeColor" : options.strokeColor,
		"fillColor" : options.fillColor
	// weight : 1.0
	});

	this._circleNative.setCenter(new google.maps.LatLng(options.center.lat, options.center.lon));
	this._circleNative.setRadius(options.radius);

	if (typeof options.map !== "undefined") {
		this.setMap(options.map);
	}

	if (this.googleEarth != null) {
		this.googleEarth.updateCircle(this._circleNative);
	}
};

// InfoWindow
com.greenalp.maps.InfoWindow = function(options) {
	this._popupNative = new google.maps.InfoWindow({
		content : options.content
	});
};

com.greenalp.maps.InfoWindow.prototype.setContent = function(content) {
	this._popupNative.setContent(content);
};

com.greenalp.maps.InfoWindow.prototype.setContentDom = function(dom) {
	this._popupNative.setContent(dom);
};

com.greenalp.maps.InfoWindow.prototype.open = function(map, marker) {
	// close before open to force on the fresh open an automatic map pan, so info window is in visible part of the map.
	this._popupNative.close();
	this._popupNative.open(map._mapNative, marker != null ? marker._markerNative : null);
};

com.greenalp.maps.InfoWindow.prototype.setPosition = function(trackpoint) {
	this._popupNative.setPosition(new google.maps.LatLng(trackpoint.lat, trackpoint.lon));
};

com.greenalp.maps.InfoWindow.prototype.close = function() {
	this._popupNative.close();
};if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.maps === 'undefined') {
	com.greenalp.maps = {};
}

com.greenalp.maps.MapExtension = function(map, options) {
	this.trafficOverlay = null;
	this.bicycleOverlay = null;
	this.panoramioOverlay = null;

	var controlDiv = document.createElement('DIV');

	controlDiv.index = 1;
	map._mapNative.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

	// Set CSS styles for the DIV containing the control
	// Setting padding to 5 px will offset the control
	// from the edge of the map
	controlDiv.style.padding = '5px';

	// Set CSS for the control border
	var controlUI = document.createElement('DIV');
	controlUI.style.backgroundColor = 'white';
	controlUI.style.borderStyle = 'solid';
	controlUI.style.borderWidth = '2px';
	controlUI.style.cursor = 'pointer';
	controlUI.style.textAlign = 'center';
	controlUI.style.padding = '2px';
	controlUI.title = 'Click to set control overlays.';
	controlDiv.appendChild(controlUI);

	// Set CSS for the control interior
	var controlText = document.createElement('DIV');
	controlText.style.fontFamily = 'Arial,sans-serif';
	controlText.style.fontSize = '12px';
	controlText.innerHTML = "Options";
	controlUI.appendChild(controlText);

	var childDiv = document.createElement('DIV');
	childDiv.style.display = 'none';
	controlUI.appendChild(childDiv);

	var that = this;
	function enableTrafficLayer() {
		if (that.trafficOverlay == null) {
			that.trafficOverlay = new google.maps.TrafficLayer();
		}

		that.trafficOverlay.setMap(map._mapNative);
	}

	var o = this.createControlCheckbox("cbOptionTraffic", "Traffic", options.showTraffic, function() {
		if (this.checked) {
			enableTrafficLayer();
		} else {
			if (that.trafficOverlay != null) {
				that.trafficOverlay.setMap(null);
			}
		}
	});
	childDiv.appendChild(o);
	if (options.showTraffic) {
		enableTrafficLayer();
	}

	o = this.createControlCheckbox("cbOptionBicycle", "Bicycle", false, function() {
		if (this.checked) {
			if (that.bicycleOverlay == null) {
				that.bicycleOverlay = new google.maps.BicyclingLayer();
			}
			that.bicycleOverlay.setMap(map._mapNative);
		} else {
			if (that.bicycleOverlay != null) {
				that.bicycleOverlay.setMap(null);
			}
		}
	});
	childDiv.appendChild(o);

	o = this.createControlCheckbox("cbOptionPanoramio", "Panoramio", false, function() {
		if (this.checked) {
			if (that.panoramioOverlay == null) {
				that.panoramioOverlay = new google.maps.panoramio.PanoramioLayer();
			}

			that.panoramioOverlay.setMap(map._mapNative);
		} else {
			if (that.panoramioOverlay != null) {
				that.panoramioOverlay.setMap(null);
			}

		}
	});
	childDiv.appendChild(o);

	o = this.createMainItem("Additional options", true, function() {
		if (jQuery("#configDiv").size() != 0) {
			return;
		}

		var mapDiv = jQuery(map._mapNative.getDiv());
		var configDiv = jQuery('<div id="configDiv" class="roundedBorderDiv" style="position:absolute;top:0px;left:70px;background:white"  />');
		mapDiv.append(configDiv);

		jQuery.get('js/html/mapconfig.html', function(data) {

			configDiv.append(data);

		});

	});
	childDiv.appendChild(o);

	o = this.createMainItem("Open Street Maps", true, function() {
		var pMapengine = com.greenalp.tracking.util.getURLParameter("mapengine");
		var url;
		if (pMapengine == null) {
			url = window.location.href;
			if (url.indexOf("?") < 0) {
				url = url + "?";
			} else if ((url.lastIndexOf("?") != url.length - 1) && (url.lastIndexOf("&") != url.length - 1)) {
				url = url + "&";
			}
			url = url + "mapengine=leaflet";
		} else {
			url = window.location.href.replace(/mapengine=[^&]*/, "mapengine=leaflet");
			if (url.lastIndexOf("&") == url.length - 1) {
				url = url.substring(0, url.length - 1);
			}
		}

		window.location.href = url;

	});
	childDiv.appendChild(o);

	// controlDiv.style.zIndex=99999999;
	// childDiv.style.zIndex=99999999;

	// Setup the click event listeners: simply set the map to Chicago
	google.maps.event.addDomListener(controlUI, 'mouseover', function() {
		childDiv.style.display = 'block';
	});

	// Setup the click event listeners: simply set the map to Chicago
	google.maps.event.addDomListener(controlUI, 'mouseout', function() {
		childDiv.style.display = 'none';
	});

};

com.greenalp.maps.MapExtension.prototype.createMainItem = function(title, linkify, clickHandler) {
	var titletag = title;
	if (linkify) {
		titletag = "<a>" + title + "</a>";
	}
	var divcode = '<div style="color: rgb(0, 0, 0); font-family: Arial, sans-serif; -moz-user-select: none; font-size: 12px; background-color: rgb(255, 255, 255); line-height: 160%; padding: 0pt 8px 0pt 6px; direction: ltr; text-align: left; white-space: nowrap;" title="'
			+ title + '">' + titletag + '</div>';

	var c = jQuery(divcode);

	c.click(clickHandler);

	return c[0];
};

com.greenalp.maps.MapExtension.prototype.createControlCheckbox = function(id, title, checked, clickHandler) {
	var divcode = '<div style="color: rgb(0, 0, 0); font-family: Arial, sans-serif; -moz-user-select: none; font-size: 12px; background-color: rgb(255, 255, 255); line-height: 160%; padding: 0pt 8px 0pt 6px; direction: ltr; text-align: left; white-space: nowrap;" title="'
			+ title
			+ '">'
			+ '<input id="'
			+ id
			+ '" type="checkbox" '
			+ (checked ? 'checked="checked"' : '')
			+ '" style="vertical-align: middle;"/><label style="margin-left: 4px; vertical-align: middle; cursor: pointer;">' + title + '</label>' + '</div>';
	var c = jQuery(divcode);

	c.find("input:checkbox").change(clickHandler);

	return c[0];
};
if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.maps === 'undefined') {
	com.greenalp.maps = {};
}

// Map

com.greenalp.maps.OverlayHandler = function() {
};

com.greenalp.maps.OverlayHandler.prototype = new google.maps.OverlayView();

com.greenalp.maps.OverlayHandler.prototype.init = function(map, contentDom, refreshFunction) {
	this._map = map;
	this._refreshFunction = refreshFunction;
	this._contentDom = jQuery('<div style="position:absolute;padding:0px;margin:0px" />').append(contentDom)[0];
	this.setMap(map != null ? map._mapNative : null);
};

com.greenalp.maps.OverlayHandler.prototype.onAdd = function() {
	this.getPanes().overlayMouseTarget.appendChild(this._contentDom);
	this._refreshFunction();
};

com.greenalp.maps.OverlayHandler.prototype.draw = function() {
	this._refreshFunction();
};

com.greenalp.maps.OverlayHandler.prototype.onRemove = function() {
	// this.getPanes().overlayMouseTarget.removeChild(this._contentDom);
	this._contentDom.parentNode.removeChild(this._contentDom);
};

com.greenalp.maps.OverlayHandler.prototype.setPosition = function(trackpoint) {
	if (this.getProjection() != null) {
		var c = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(trackpoint.lat, trackpoint.lon));

		// Resize the image's DIV to fit the indicated dimensions.
		var div = jQuery(this._contentDom);
		div.css("left", c.x + 'px');
		div.css("top", c.y + 'px');
	}
};

com.greenalp.maps.OverlayHandler.prototype.removeOverlayFromMap = function() {
	this.setMap(null);
};
// Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Earth API library for Maps v3.
 * usage:  var ge = new GoogleEarth(map);.
 * @author jlivni@google.com (Josh Livni).
 */

/**
 * @constructor
 * @param {google.maps.Map}
 *            map the Map associated with this Earth instance.
 */
function GoogleEarth(map) {
	if (!google || !google.earth) {
		throw 'google.earth not loaded';
	}

	if (!google.earth.isSupported()) {
		throw 'Google Earth API is not supported on this system';
	}

	if (!google.earth.isInstalled()) {
		throw 'Google Earth API is not installed on this system';
	}

	/**
	 * @const
	 * @private
	 * @type {string}
	 */
	this.RED_ICON_ = 'http://maps.google.com/mapfiles/kml/paddle/red-circle.png';

	/**
	 * @private
	 * @type {google.maps.Map}
	 */
	this.map_ = map;

	/**
	 * @private
	 * @type {Node}
	 */
	this.mapDiv_ = map.getDiv();

	/**
	 * @private
	 * @type {boolean}
	 */
	this.earthVisible_ = false;

	/**
	 * @private
	 * @type {string}
	 */
	this.earthTitle_ = 'Earth';

	/**
	 * @private
	 * @type {Object}
	 */
	this.moveEvents_ = [];

	/**
	 * @private
	 * @type {Object}
	 */
	this.overlays_ = {};

	/**
	 * @private
	 * @type {?Object}
	 */
	this.lastClickedPlacemark_ = null;

	this.trackOnGround = true;
	this.gpsAltitudeOffset = 0;

	/**
	 * Keep track of each time the 3D view is reloaded/refreshed
	 * 
	 * @private
	 * @type {number}
	 */
	this.displayCounter_ = 0;

	this.addEarthMapType_();
	this.addEarthControl_();
}
window['GoogleEarth'] = GoogleEarth;

/**
 * @const
 * @type {string}
 */
GoogleEarth.MAP_TYPE_ID = 'GoogleEarthAPI';
GoogleEarth['MAP_TYPE_ID'] = GoogleEarth.MAP_TYPE_ID;

/**
 * @const
 * @private
 * @type {string}
 */
GoogleEarth.INFO_WINDOW_OPENED_EVENT_ = 'GEInfoWindowOpened';

/**
 * @const
 * @private
 * @type {number}
 */
GoogleEarth.MAX_EARTH_ZOOM_ = 27;

/**
 * @return {?google.earth.GEPlugin} The Earth API Instance.
 */
GoogleEarth.prototype.getInstance = function() {
	return this.instance_;
};
GoogleEarth.prototype['getInstance'] = GoogleEarth.prototype.getInstance;

/**
 * @private
 */
GoogleEarth.prototype.addEarthMapType_ = function() {
	var map = this.map_;

	var earthMapType = /** @type {google.maps.MapType} */
	({
		tileSize : new google.maps.Size(256, 256),
		maxZoom : 19,
		name : this.earthTitle_,
		// The alt helps the findMapTypeControlDiv work.
		alt : this.earthTitle_,
		getTile :
		/**
		 * @param {google.maps.Point}
		 *            tileCoord the tile coordinate.
		 * @param {number}
		 *            zoom the zoom level.
		 * @param {Node}
		 *            ownerDocument n/a.
		 * @return {Node} the overlay.
		 */
		function(tileCoord, zoom, ownerDocument) {
			var div = ownerDocument.createElement('DIV');
			return div;
		}
	});

	map.mapTypes.set(GoogleEarth.MAP_TYPE_ID, earthMapType);

	var options = /** @type {google.maps.MapTypeControlOptions} */
	({
		mapTypeControlOptions : {
			// style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			mapTypeIds : [ google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.TERRAIN,
					GoogleEarth.MAP_TYPE_ID ]
		}
	});

	map.setOptions(options);

	var that = this;
	google.maps.event.addListener(map, 'maptypeid_changed', function() {
		that.mapTypeChanged_();
	});
};

/**
 * @private
 */
GoogleEarth.prototype.mapTypeChanged_ = function() {
	if (this.map_.getMapTypeId() == GoogleEarth.MAP_TYPE_ID) {
		this.showEarth_();
	} else {
		this.switchToMapView_();
	}
};

/**
 * @private
 */
GoogleEarth.prototype.showEarth_ = function() {
	var mapTypeControlDiv = this.findMapTypeControlDiv_();
	this.setZIndexes_(mapTypeControlDiv);
	this.addShim_(mapTypeControlDiv);

	this.controlDiv_.style.display = '';

	this.earthVisible_ = true;
	if (!this.instance_) {
		this.initializeEarth_();
		return;
	}
	this.refresh_();
};

/**
 * @private
 */
GoogleEarth.prototype.refresh_ = function() {
	this.trackOnGround = $.jStorage.get("config_trackheightmode", "onground") == "onground";
	this.gpsAltitudeOffset = parseInt($.jStorage.get("config_gpsaltoffset", 0), 10);

	this.overlays_ = {};
	this.flyToMapView_(true);
	this.clearPlacemarks_();
	this.displayCounter_++;
	this.clearMoveEvents_();
	this.addMapOverlays_();
};

/**
 * Clear all marker position_changed events
 * 
 * @private
 */
GoogleEarth.prototype.clearMoveEvents_ = function() {
	for ( var i = 0, evnt; evnt = this.moveEvents_[i]; i++) {
		google.maps.event.removeListener(evnt);
	}
};

/**
 * Clear all features on this instance.
 * 
 * @private
 */
GoogleEarth.prototype.clearPlacemarks_ = function() {
	var features = this.instance_.getFeatures();
	while (features.getFirstChild()) {
		features.removeChild(features.getFirstChild());
	}
};

/**
 * Fly to the current map zoom, add slight tilt.
 * 
 * @private
 * @param {boolean}
 *            tilt whether to teleport and tilt, or just flyto.
 */
GoogleEarth.prototype.flyToMapView_ = function(tilt) {
	var center = this.map_.getCenter();
	var lookAt = this.instance_.createLookAt('');
	var range = Math.pow(2, GoogleEarth.MAX_EARTH_ZOOM_ - this.map_.getZoom());
	lookAt.setRange(range);
	lookAt.setLatitude(center.lat());
	lookAt.setLongitude(center.lng());
	lookAt.setHeading(0);
	lookAt.setAltitude(0);

	testlookat = lookAt;
	if (!this.trackOnGround) {
		lookAt.setAltitudeMode(this.instance_.ALTITUDE_ABSOLUTE);
	}

	var ge = this.instance_;
	if (tilt) {
		// Teleport to the pre-tilt view immediately.
		ge.getOptions().setFlyToSpeed(5);
		ge.getView().setAbstractView(lookAt);
		lookAt.setTilt(15);
		// Fly to the tilt at regular speed in 200ms
		ge.getOptions().setFlyToSpeed(0.75);
		window.setTimeout(function() {
			ge.getView().setAbstractView(lookAt);
		}, 200);
		// Set the flyto speed back to default after the animation starts.
		window.setTimeout(function() {
			ge.getOptions().setFlyToSpeed(1);
		}, 250);
	} else {
		// Fly to the approximate map view at regular speed.
		ge.getView().setAbstractView(lookAt);
	}
};

/**
 * @param {string|*}
 *            hex color value in rgb.
 * @param {string|*=}
 *            opacity -- in percentage.
 * @return {string} abgr KML style color.
 * @private
 */
GoogleEarth.getKMLColor_ = function(hex, opacity) {
	if (hex[0] == '#') {
		hex = hex.substring(1, 9);
	}
	if (typeof opacity == 'undefined') {
		opacity = 'FF';
	} else {
		opacity = parseInt(parseFloat(opacity) * 255, 10).toString(16);
		if (opacity.length == 1) {
			opacity = '0' + opacity;
		}
	}
	var R = hex.substring(0, 2);
	var G = hex.substring(2, 4);
	var B = hex.substring(4, 6);
	var abgr = [ opacity, B, G, R ].join('');
	return abgr;
};

/**
 * @param {google.maps.MVCObject}
 *            overlay the map overlay.
 * @return {String} ID for the Placemark.
 * @private
 */
GoogleEarth.prototype.generatePlacemarkId_ = function(overlay) {
	// this.displayCounter_++;
	var objId = "";

	if ("greenalpObjectId" in overlay) {
		objId = overlay.greenalpObjectId + "";
	} else {
	}

	var placemarkId = objId + this.displayCounter_ + 'GEV3_' + overlay['__gme_id'];

	return placemarkId;
};

lastflo = null;
/**
 * @param {google.maps.MVCObject}
 *            overlay the map overlay.
 * @return {google.earth.KmlPlacemark} placemark the placemark.
 * @private
 */
GoogleEarth.prototype.createPlacemark_ = function(overlay) {
	if (lastflo != null && lastflo != this.instance_) {
		alert("debug");
	}

	lastflo = this.instance_;

	var placemarkId = this.generatePlacemarkId_(overlay);
	this.overlays_[placemarkId] = overlay;
	var placemark = this.instance_.createPlacemark(placemarkId);

	return placemark;
};

/**
 * @param {google.maps.Rectangle}
 *            rectangle the rectangle overlay.
 * @private
 */
GoogleEarth.prototype.createRectangle_ = function(rectangle) {
	var ge = this.instance_;
	var bounds = rectangle.getBounds();
	var ne = bounds.getNorthEast();
	var sw = bounds.getSouthWest();

	var placemark = this.createPlacemark_(rectangle);

	placemark.setGeometry(ge.createPolygon(''));
	var ring = ge.createLinearRing('');

	// set the style
	var style = this.createStyle_(rectangle);
	placemark.setStyleSelector(style);

	// create the rectangle
	var coords = ring.getCoordinates();
	coords.pushLatLngAlt(ne.lat(), ne.lng(), 0);
	coords.pushLatLngAlt(ne.lat(), sw.lng(), 0);
	coords.pushLatLngAlt(sw.lat(), sw.lng(), 0);
	coords.pushLatLngAlt(sw.lat(), ne.lng(), 0);
	coords.pushLatLngAlt(ne.lat(), ne.lng(), 0);

	placemark.getGeometry().setOuterBoundary(ring);
	placemark.setName('placemark');
	ge.getFeatures().appendChild(placemark);
};

/**
 * @param {google.maps.GroundOverlay}
 *            groundOverlay the GroundOverlay.
 * @private
 */
GoogleEarth.prototype.addGroundOverlay_ = function(groundOverlay) {
	var bounds = groundOverlay.getBounds();
	var ne = bounds.getNorthEast();
	var sw = bounds.getSouthWest();

	var ge = this.instance_;
	var overlay = ge.createGroundOverlay('');

	overlay.setLatLonBox(ge.createLatLonBox(''));
	var latLonBox = overlay.getLatLonBox();
	latLonBox.setBox(ne.lat(), sw.lat(), ne.lng(), sw.lng(), 0);

	overlay.setIcon(ge.createIcon(''));
	overlay.getIcon().setHref(groundOverlay.getUrl());

	ge.getFeatures().appendChild(overlay);
};

/**
 * @param {string}
 *            url for kml.
 * @private
 */
GoogleEarth.prototype.addKML_ = function(url) {
	var ge = this.instance_;
	google.earth.fetchKml(ge, url, function(kml) {
		if (!kml) {
			// wrap alerts in API callbacks and event handlers
			// in a window.setTimeout to prevent deadlock in some browsers
			window.setTimeout(function() {
				alert('Bad or null KML.');
			}, 0);
			return;
		}
		ge.getFeatures().appendChild(kml);
	});
};

/**
 * @param {String}
 *            placemarkId the id of the placemark.
 * @private
 */
GoogleEarth.prototype.updatePlacemark_ = function(placemarkId) {
	// TODO(jlivni) generalize to work with more than just Markers/Points
	var marker = this.overlays_[placemarkId];
	var placemark = this.instance_.getElementById(placemarkId);
	var geom = placemark.getGeometry();
	var position = marker.getPosition();
	geom.setLatitude(position.lat());
	geom.setLongitude(position.lng());
	if ("alt" in marker) {
		geom.setAltitude(marker.alt + this.gpsAltitudeOffset);
	}
};

GoogleEarth.prototype.updateCircle = function(circle) {
	if (this.instance_ != null) {
		var placemarkId = this.generatePlacemarkId_(circle);
		var placemark = this.instance_.getElementById(placemarkId);
		if (placemark != null) {
			var features = this.instance_.getFeatures();
			features.removeChild(placemark);
		}
		this.createCircle_(circle);
	}
};
/**
 * @param {google.maps.Marker}
 *            marker The map marker.
 * @private
 */
GoogleEarth.prototype.createPoint_ = function(marker) {
	if (!marker.getPosition()) {
		return;
	}
	var ge = this.instance_;
	var placemark = this.createPlacemark_(marker);
	if (marker.getTitle()) {
		placemark.setName(marker.getTitle());
	}

	// Create style map for placemark
	var icon = ge.createIcon('');
	if (marker.getIcon()) {
		// TODO(jlivni) fix for if it's a markerImage
		icon.setHref(this.RED_ICON_);
	} else {
		icon.setHref(this.RED_ICON_);
	}

	var style = ge.createStyle('');
	style.getIconStyle().setIcon(icon);
	placemark.setStyleSelector(style);

	// Create point
	var point = ge.createPoint('');
	point.setLatitude(marker.getPosition().lat());
	point.setLongitude(marker.getPosition().lng());
	if (!this.trackOnGround) {
		point.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
	}

	if ("alt" in marker) {
		point.setAltitude(marker.alt + this.gpsAltitudeOffset);
	}

	placemark.setGeometry(point);

	ge.getFeatures().appendChild(placemark);

	// add listener for marker move on Map
	var that = this;
	testmarker = marker;
	var moveEvent = google.maps.event.addListener(marker, 'position_changed', function() {
		var placemarkId = that.generatePlacemarkId_(marker);
		that.updatePlacemark_(placemarkId);
	});
	this.moveEvents_.push(moveEvent);

	google.earth.addEventListener(placemark, 'click', function(event) {
		var text = 'Click:';
		// Prevent the default balloon from appearing.
		// event.preventDefault();
		var content = placemark.getDescription();
		var balloon = ge.createHtmlDivBalloon('');
		balloon.setFeature(placemark);

		window.setTimeout(function() {
			balloon.setContentDiv(com.greenalp.tracking.overlay.innerdiv[0]);
			ge.setBalloon(balloon);
		}, 500);

		marker.onNewTrackpoint = function(friend) {
			// alert(tp);

			return;
			var p = friend.data.lastposition;

			var lat = parseFloat(p.lat);
			var lon = parseFloat(p.lon);
			var timediffClient = com.greenalp.tracking.roundNumber((friend.data.curServerTime - p.clientTime) / 1000, 1);

			var message = friend.data.nickname + "<br/>" + com.greenalp.tracking.getAge(timediffClient, false) + " ago" + "<br/>Time: "
					+ com.greenalp.tracking.formatDateTime(new Date(eval(p.clientTime))) + "<br/>Accuracy: " + com.greenalp.tracking.roundNumber(p.acc, 1)
					+ " m<br/>Altitude: " + com.greenalp.tracking.getElevationString(p.alt) + "<br/>Direction: " + com.greenalp.tracking.roundNumber(p.bea, 1)
					+ " (" + com.greenalp.tracking.getDirection(p.bea) + ")<br/>Speed: " + com.greenalp.tracking.getSpeedString(p.speed);// +
			// com.greenalp.common.escapeHtml(userMsg)

			balloon.setContentString(message);
		};

	});

};

/**
 * @param {google.maps.Polygon}
 *            polygon the polygon overlay.
 * @private
 */
GoogleEarth.prototype.createPolygon_ = function(polygon) {
	var ge = this.instance_;
	var placemark = this.createPlacemark_(polygon);

	// Create polygon
	var poly = ge.createPolygon('');
	placemark.setGeometry(poly);

	// set the style
	var style = this.createStyle_(polygon);
	placemark.setStyleSelector(style);

	// assume single linearRing
	var outer = ge.createLinearRing('');
	poly.setOuterBoundary(outer);
	var coords = outer.getCoordinates();
	var path = polygon.getPath().getArray();

	// TODO(jlivni) use getPaths and multiple rings
	for ( var i = 0, latLng; latLng = path[i]; i++) {
		coords.pushLatLngAlt(latLng.lat(), latLng.lng(), 0);
	}

	ge.getFeatures().appendChild(placemark);
};

/**
 * Computes the LatLng produced by starting from a given LatLng and heading a given distance.
 * 
 * @see http://williams.best.vwh.net/avform.htm#LL
 * @param {google.maps.LatLng}
 *            from The LatLng from which to start.
 * @param {number}
 *            distance The distance to travel.
 * @param {number}
 *            heading The heading in degrees clockwise from north.
 * @return {google.maps.LatLng} The result.
 * @private
 */
GoogleEarth.computeOffset_ = function(from, distance, heading) {
	var radius = 6378137;
	distance /= radius;
	heading = heading * (Math.PI / 180); // convert to radians
	var fromLat = from.lat() * (Math.PI / 180);
	var fromLng = from.lng() * (Math.PI / 180);
	var cosDistance = Math.cos(distance);
	var sinDistance = Math.sin(distance);
	var sinFromLat = Math.sin(fromLat);
	var cosFromLat = Math.cos(fromLat);
	var sinLat = cosDistance * sinFromLat + sinDistance * cosFromLat * Math.cos(heading);
	var dLng = Math.atan2(sinDistance * cosFromLat * Math.sin(heading), cosDistance - sinFromLat * sinLat);
	return new google.maps.LatLng((Math.asin(sinLat) / (Math.PI / 180)), (fromLng + dLng) / (Math.PI / 180));
};

/**
 * @param {google.maps.Circle}
 *            circle The circle overlay.
 * @private
 */
GoogleEarth.prototype.createCircle_ = function(circle) {
	// disable circle because position cannot be updated
	return;
	var ge = this.instance_;
	var center = circle.getCenter();
	var radius = circle.getRadius();
	var placemark = this.createPlacemark_(circle);
	placemark.setGeometry(ge.createPolygon(''));
	var ring = ge.createLinearRing('');

	// set the style
	var style = this.createStyle_(circle);
	placemark.setStyleSelector(style);

	// create a circle
	var vertices = 25;
	for ( var i = 0; i < vertices; i++) {
		var heading = 360 / vertices * i;
		var offset = GoogleEarth.computeOffset_(center, radius, heading);
		ring.getCoordinates().pushLatLngAlt(offset.lat(), offset.lng(), 0);
	}
	placemark.getGeometry().setOuterBoundary(ring);
	placemark.setName('placemark');
	ge.getFeatures().appendChild(placemark);
};

/**
 * @param {google.maps.Polyline}
 *            polyline The map polyline overlay.
 * @private
 */
GoogleEarth.prototype.createPolyline_ = function(polyline) {
	var ge = this.instance_;
	var placemark = this.createPlacemark_(polyline);

	// Create linestring
	var lineString = ge.createLineString('');
	lineString.setTessellate(true);

	if (!this.trackOnGround) {
		lineString.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
	}
	placemark.setGeometry(lineString);

	// set the style
	var style = this.createStyle_(polyline);
	placemark.setStyleSelector(style);

	var coords = lineString.getCoordinates();
	var path = polyline.getPath().getArray();
	// TODO(jlivni) use getPaths for case of multiple rings
	for ( var i = 0, latLng; latLng = path[i]; i++) {
		var alt = 0;
		if ("alt" in latLng) {
			alt = latLng.alt;
		}
		coords.pushLatLngAlt(latLng.lat(), latLng.lng(), alt + this.gpsAltitudeOffset);
	}

	google.maps.event.addListener(polyline.getPath(), 'insert_at', function(number) {
		var latLng = polyline.getPath().getAt(number);
		coords.pushLatLngAlt(latLng.lat(), latLng.lng(), 0);
	});

	ge.getFeatures().appendChild(placemark);
};

/**
 * @param {google.maps.MVCObject}
 *            overlay the map overlay.
 * @return {google.earth.KmlStyle} the style.
 * @private
 */
GoogleEarth.prototype.createStyle_ = function(overlay) {
	var style = this.instance_.createStyle('');
	var polyStyle = style.getPolyStyle();
	var lineStyle = style.getLineStyle();

	lineStyle.setWidth(this.getMVCVal_(overlay, 'strokeWeight', 3));

	var strokeOpacity = this.getMVCVal_(overlay, 'strokeOpacity', 1);
	var fillOpacity = this.getMVCVal_(overlay, 'fillOpacity', 0.3);
	var strokeColor = this.getMVCVal_(overlay, 'strokeColor', '#000000');
	var fillColor = this.getMVCVal_(overlay, 'fillColor', '#000000');

	lineStyle.getColor().set(GoogleEarth.getKMLColor_(strokeColor, strokeOpacity));
	polyStyle.getColor().set(GoogleEarth.getKMLColor_(fillColor, fillOpacity));

	return style;
};

/**
 * Gets the property value from an mvc object.
 * 
 * @param {google.maps.MVCObject}
 *            mvcObject The object.
 * @param {string}
 *            property The property.
 * @param {string|number}
 *            def The default.
 * @return {string|number} The property, or default if property undefined.
 * @private
 */
GoogleEarth.prototype.getMVCVal_ = function(mvcObject, property, def) {
	var val = mvcObject.get(property);
	if (typeof val == 'undefined') {
		return def;
	} else {
		return val;
	}
};

/**
 * Add map overlays to Earth.
 * 
 * @private
 */
GoogleEarth.prototype.addMapOverlays_ = function() {
	var overlays = this.getOverlays_();
	for ( var i = 0, marker; marker = overlays['Marker'][i]; i++) {
		this.createPoint_(marker);
	}
	for ( var i = 0, polygon; polygon = overlays['Polygon'][i]; i++) {
		this.createPolygon_(polygon);
	}
	for ( var i = 0, polyline; polyline = overlays['Polyline'][i]; i++) {
		this.createPolyline_(polyline);
	}
	for ( var i = 0, rectangle; rectangle = overlays['Rectangle'][i]; i++) {
		this.createRectangle_(rectangle);
	}
	for ( var i = 0, circle; circle = overlays['Circle'][i]; i++) {
		this.createCircle_(circle);
	}
	for ( var i = 0, kml; kml = overlays['KmlLayer'][i]; i++) {
		this.addKML_(kml.getUrl());
	}
	for ( var i = 0, overlay; overlay = overlays['GroundOverlay'][i]; i++) {
		this.addGroundOverlay_(overlay);
	}
};

/**
 * @private
 */
GoogleEarth.prototype.initializeEarth_ = function() {
	var that = this;
	google.earth.createInstance(this.earthDiv_, function(instance) {
		that.instance_ = /** @type {google.earth.GEPlugin} */
		(instance);
		that.addEarthEvents_();
		that.refresh_();
	}, function(e) {
		that.hideEarth_();
		// TODO(jlivni) record previous maptype
		that.map_.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		throw 'Google Earth API failed to initialize: ' + e;
	});
};

/**
 * @private
 */
GoogleEarth.prototype.addEarthEvents_ = function() {
	var ge = this.instance_;
	ge.getWindow().setVisibility(true);

	// add a navigation control
	var navControl = ge.getNavigationControl();
	navControl.setVisibility(ge.VISIBILITY_AUTO);

	var screen = navControl.getScreenXY();
	screen.setYUnits(ge.UNITS_INSET_PIXELS);
	screen.setXUnits(ge.UNITS_PIXELS);

	// add some layers
	var layerRoot = ge.getLayerRoot();
	layerRoot.enableLayerById(ge.LAYER_BORDERS, true);
	layerRoot.enableLayerById(ge.LAYER_ROADS, true);

	var that = this;
	google.maps.event.addListener(this.map_, GoogleEarth.INFO_WINDOW_OPENED_EVENT_, function(infowindow) {
		// If Earth is open, create balloon
		if (!that.earthVisible_) {
			return;
		}
		var balloon = that.instance_.createHtmlStringBalloon('');
		// TODO assuming anchor == marker == lastclicked
		var placemark = that.lastClickedPlacemark_;
		balloon.setFeature(placemark);

		var contentstring = jQuery(infowindow.getContent()).html();
		balloon.setContentString(contentstring);
		that.instance_.setBalloon(balloon);
	});

	// On click of a placemark we want to trigger the map click event.
	google.earth.addEventListener(ge.getGlobe(), 'click', function(event) {
		var target = event.getTarget();
		var overlay = that.overlays_[target.getId()];
		if (overlay) {
			event.preventDefault();
			// Close any currently opened map info windows.
			var infoWindows = that.getOverlaysForType_('InfoWindow');
			for ( var i = 0, infoWindow; infoWindow = infoWindows[i]; i++) {
				infoWindow.close();
			}
			that.lastClickedPlacemark_ = target;
			google.maps.event.trigger(overlay, 'click');
		}
	});

};

/**
 * Set the Map view to match Earth.
 * 
 * @private
 */
GoogleEarth.prototype.matchMapToEarth_ = function() {
	var lookAt = this.instance_.getView().copyAsLookAt(this.instance_.ALTITUDE_RELATIVE_TO_GROUND);
	var range = lookAt.getRange();
	var zoom = Math.round(GoogleEarth.MAX_EARTH_ZOOM_ - (Math.log(range) / Math.log(2)));
	if (!this.map_.getZoom() == zoom) {
		this.map_.setZoom(zoom - 1);
	} else {
		this.map_.setZoom(zoom);
	}
	var center = new google.maps.LatLng(lookAt.getLatitude(), lookAt.getLongitude());
	this.map_.panTo(center);
};

/**
 * Animate from Earth to Maps view.
 * 
 * @private
 */
GoogleEarth.prototype.switchToMapView_ = function() {
	if (!this.earthVisible_) {
		return;
	}

	// First, set map to match current earth view.
	this.matchMapToEarth_();

	// Now fly Earth to match the map view.
	var that = this;

	window.setTimeout(function() {
		// Sometimes it takes a few ms before the map zoom is ready.
		that.flyToMapView_();
	}, 50);

	window.setTimeout(function() {
		// And switch back to maps once we've flown.
		that.hideEarth_();
	}, 2200);
};

/**
 * Hide the Earth div.
 * 
 * @private
 */
GoogleEarth.prototype.hideEarth_ = function() {
	this.unsetZIndexes_();
	this.removeShim_();

	this.controlDiv_.style.display = 'none';
	this.earthVisible_ = false;
};

/**
 * Sets the z-index of all controls except for the map type control so that they appear behind Earth.
 * 
 * @param {Node}
 *            mapTypeControlDiv the control div.
 * @private
 */
GoogleEarth.prototype.setZIndexes_ = function(mapTypeControlDiv) {
	var oldIndex = mapTypeControlDiv.style.zIndex;
	var siblings = this.controlDiv_.parentNode.childNodes;
	for ( var i = 0, sibling; sibling = siblings[i]; i++) {
		sibling['__gme_ozi'] = sibling.style.zIndex;
		// Sets the zIndex of all controls to be behind Earth.
		sibling.style.zIndex = -1;
	}

	mapTypeControlDiv['__gme_ozi'] = oldIndex;
	this.controlDiv_.style.zIndex = mapTypeControlDiv.style.zIndex = 0;
};

/**
 * @private
 */
GoogleEarth.prototype.unsetZIndexes_ = function() {
	var siblings = this.controlDiv_.parentNode.childNodes;
	for ( var i = 0, sibling; sibling = siblings[i]; i++) {
		// Set the old zIndex back
		sibling.style.zIndex = sibling['__gme_ozi'];
	}
};

/**
 * @param {Node}
 *            mapTypeControlDiv the control div.
 * @private
 */
GoogleEarth.prototype.addShim_ = function(mapTypeControlDiv) {
	var iframeShim = this.iframeShim_ = document.createElement('IFRAME');
	iframeShim.src = 'javascript:false;';
	iframeShim.scrolling = 'no';
	iframeShim.frameBorder = '0';

	var style = iframeShim.style;
	style.zIndex = -100000;
	style.width = style.height = '100%';
	style.position = 'absolute';
	style.left = style.top = 0;

	// Appends the iframe to the map type control's DIV so that its width and
	// height will be 100% and if the control changes from a bar to a drop down,
	// it flows nicely.
	mapTypeControlDiv.appendChild(iframeShim);
};

/**
 * Remove the shim containing the earth div.
 * 
 * @private
 */
GoogleEarth.prototype.removeShim_ = function() {
	this.iframeShim_.parentNode.removeChild(this.iframeShim_);
	this.iframeShim_ = null;
};

/**
 * @private
 * @return {Node} the map type control div.
 */
GoogleEarth.prototype.findMapTypeControlDiv_ = function() {
	var title = 'title=[\'\"]?' + this.earthTitle_ + '[\"\']?';
	var regex = new RegExp(title);
	var siblings = this.controlDiv_.parentNode.childNodes;
	for ( var i = 0, sibling; sibling = siblings[i]; i++) {
		if (regex.test(sibling.innerHTML)) {
			return sibling;
		}
	}
};

/**
 * @private
 */
GoogleEarth.prototype.addEarthControl_ = function() {
	var mapDiv = this.mapDiv_;

	var control = this.controlDiv_ = document.createElement('DIV');
	control.style.position = 'absolute';
	control.style.width = 0;
	control.style.height = 0;
	control.index = 0;
	control.style.display = 'none';

	var inner = this.innerDiv_ = document.createElement('DIV');
	inner.style.width = mapDiv.clientWidth + 'px';
	inner.style.height = mapDiv.clientHeight + 'px';
	inner.style.position = 'absolute';

	control.appendChild(inner);

	var earthDiv = this.earthDiv_ = document.createElement('DIV');
	earthDiv.style.position = 'absolute';
	earthDiv.style.width = '100%';
	earthDiv.style.height = '100%';

	inner.appendChild(earthDiv);

	this.map_.controls[google.maps.ControlPosition.TOP_LEFT].push(control);

	var that = this;

	google.maps.event.addListener(this.map_, 'resize', function() {
		that.resizeEarth_();
	});
};

/**
 * @private
 */
GoogleEarth.prototype.resizeEarth_ = function() {
	var innerStyle = this.innerDiv_.style;
	var mapDiv = this.mapDiv_;
	innerStyle.width = mapDiv.clientWidth + 'px';
	innerStyle.height = mapDiv.clientHeight + 'px';
};

/**
 * @param {string}
 *            type type of overlay (Polygon, etc).
 * @return {Array.<Object>} list of overlays of given type currently on map.
 * @private
 */
GoogleEarth.prototype.getOverlaysForType_ = function(type) {
	var tmp = [];
	var overlays = GoogleEarth.overlays_[type];
	for ( var i in overlays) {
		if (overlays.hasOwnProperty(i)) {
			var overlay = overlays[i];
			if (overlay.get('map') == this.map_) {
				tmp.push(overlay);
			}
		}
	}
	return tmp;
};

/**
 * @return {Object} dictionary of lists for all map overlays.
 * @private
 */
GoogleEarth.prototype.getOverlays_ = function() {
	var overlays = {};
	var overlayClasses = GoogleEarth.OVERLAY_CLASSES;

	for ( var i = 0, overlayClass; overlayClass = overlayClasses[i]; i++) {
		overlays[overlayClass] = this.getOverlaysForType_(overlayClass);
	}
	return overlays;
};

/**
 * @private
 */
GoogleEarth.overlays_ = {};

/**
 * override the open property for infowindow
 * 
 * @private
 */
GoogleEarth.modifyOpen_ = function() {
	google.maps.InfoWindow.prototype.openOriginal_ = google.maps.InfoWindow.prototype['open'];

	GoogleEarth.overlays_['InfoWindow'] = {};
	google.maps.InfoWindow.prototype['open'] = function(map, anchor) {
		if (map) {
			if (!this['__gme_id']) {
				this['__gme_id'] = GoogleEarth.counter_++;
				GoogleEarth.overlays_['InfoWindow'][this['__gme_id']] = this;
			}
		} else {
			delete GoogleEarth.overlays_['InfoWindow'][this['__gme_id']];
			this['__gme_id'] = undefined;
		}
		google.maps.event.trigger(map, GoogleEarth.INFO_WINDOW_OPENED_EVENT_, this);
		this.openOriginal_(map, anchor);
	};
};

/**
 * @param {string}
 *            overlayClass overlay type, such as Marker, Polygon, etc.
 * @private
 */
GoogleEarth.modifySetMap_ = function(overlayClass) {
	var proto = google.maps[overlayClass].prototype;
	proto['__gme_setMapOriginal'] = proto.setMap;

	GoogleEarth.overlays_[overlayClass] = {};
	google.maps[overlayClass].prototype['setMap'] = function(map) {
		if (map) {
			if (!this['__gme_id']) {
				this['__gme_id'] = GoogleEarth.counter_++;
				GoogleEarth.overlays_[overlayClass][this['__gme_id']] = this;
			}
		} else {
			delete GoogleEarth.overlays_[overlayClass][this['__gme_id']];
			this['__gme_id'] = undefined;
		}

		this['__gme_setMapOriginal'](map);
	};
};

/**
 * @const
 * @type {Array.<string>}
 */
GoogleEarth.OVERLAY_CLASSES = [ 'Marker', 'Polyline', 'Polygon', 'Rectangle', 'Circle', 'KmlLayer', 'GroundOverlay', 'InfoWindow' ];
/**
 * Keep track of total number of placemarks added.
 * 
 * @type {number}
 * @private
 */
GoogleEarth.counter_ = 0;

/**
 * Wrapper to call appropriate prototype override methods for all overlays
 * 
 * @private
 */
GoogleEarth.trackOverlays_ = function() {
	var overlayClasses = GoogleEarth.OVERLAY_CLASSES;

	for ( var i = 0, overlayClass; overlayClass = overlayClasses[i]; i++) {
		GoogleEarth.modifySetMap_(overlayClass);
		if (overlayClass == 'InfoWindow') {
			GoogleEarth.modifyOpen_();
		}
	}
};

GoogleEarth.trackOverlays_();
