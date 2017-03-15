if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

com.greenalp.tracking = {
	mapinittime : new Date(),
	map : null,
	adsenseInit : false,
	overlay : null,
	mapInitialized : false,
	updateInProgress : false,
	updateCounter : 0,
	updateInterval : 2000,
	lastUpdateTime : 0,
	updateRequestTime : 0,
	tracksInitialized : false,
	updateErrors : 0,
	intervalId : -1,
	mapcenterInitialized : false,
	friends : new Array(),
	locationdetailshidden : true,
	chatHistoryHidden : true,
	trackCurrentPosition : false,
	trackmap : new Array(),
	showAutoTracks : false,
	trackpointWindow : null,
	serverTimeDataChanged : -1,
	contextmenu : null,
	elevator : null,
	geocoder : null,
	unit : "all",
	demouser : false,
	demostep : 0,
	demouser1Data : new Array(),
	locationAgeFilter : -1,
	skipLocationAgeFilterWarning : false,
	trackFrom : -1,
	trackUntil : -1,
	showLocationDetails : -1,
	showTrackDetails : true,
	tracksplitdistanceMs : 1800000,
	stopUpdate : false

};

if (typeof com.greenalp.trackconfig === 'undefined') {
	com.greenalp.trackconfig = {};
}

jQuery(document).ready(function() {

	// jstorage must not be loaded before jquery is ready in IE7

	if (com.greenalp.tracking.util.getURLParameter("maxlocationage") != null) {

		var maxLocationAge = parseInt(com.greenalp.tracking.util.getURLParameter("maxlocationage"));
		if (!isNaN(maxLocationAge)) {
			com.greenalp.tracking.locationAgeFilter = maxLocationAge * 1000;
			com.greenalp.tracking.skipLocationAgeFilterWarning = true;
		}
	}
	if (com.greenalp.tracking.locationAgeFilter < 0) {
		$.getScript('js/jstorage.js').done(function(script, textStatus) {
			var pUnit = com.greenalp.tracking.util.getURLParameter("unit");
			if (pUnit == "imperial" || pUnit == "metric") {
				com.greenalp.tracking.unit = pUnit;
			} else {
				com.greenalp.tracking.unit = $.jStorage.get("config_unit", "all");
			}

			com.greenalp.tracking.locationAgeFilter = parseInt($.jStorage.get("config_locationAgeFilter", -1), 10);
		});
	}

	if (com.greenalp.tracking.util.getURLParameter("sidemenu") == 0) {
		jQuery("#sidemenupanel").hide();
	}

	if (com.greenalp.tracking.util.getURLParameter("tracksplitdistance") != null) {
		var tracksplitdistance = parseInt(com.greenalp.tracking.util.getURLParameter("tracksplitdistance"));
		if (!isNaN(tracksplitdistance)) {
			com.greenalp.tracking.tracksplitdistanceMs = tracksplitdistance * 1000;
		}
	}

	jQuery("#sidemenupanel").css("height", Math.min(jQuery("#map_canvas").height() - 20, 280));
	var topmenuactionleftside = Math.max(170, jQuery("#map_canvas").height() / 2 - jQuery(".menuAction").height() / 2);
	var relativeTopToggleChatHistory = jQuery("#sidemenupanel").height() / 2 - jQuery("#toggleChatHistory").height() / 2;

	jQuery("#toggleChatHistory img").attr("src", "res/ejectleft.png");

	jQuery("#sidemenupanel").css("top", topmenuactionleftside - relativeTopToggleChatHistory);

	jQuery("#toggleChatHistory").css("top", relativeTopToggleChatHistory);

	jQuery("#chatHistoryContent").height(jQuery("#sidemenupanel").height() - jQuery("#sidemenu li").height() - jQuery("#messagepostrow").height());
	// jQuery("#chatHistory").corner("left");

	// jQuery("#locationdetails").css("marginTop",
	// -jQuery("#locationdetails").height() - 2);

	jQuery("#toggleChatHistory").click(function() {

		if (!com.greenalp.tracking.chatHistoryHidden) {
			com.greenalp.tracking.chatHistoryHidden = true;

			jQuery("#sidemenupanel").animate({
				right : -jQuery("#sidemenupanel").width()
			}, 500);

			jQuery("#toggleChatHistory img").attr("src", "res/ejectleft.png");

			// jQuery("#topMenuImage").html('<img
			// src="res/open.png"/>');
			// jQuery("#openCloseIdentifier").show();
		} else {
			com.greenalp.tracking.chatHistoryHidden = false;

			jQuery("#sidemenupanel").animate({
				right : "0px"
			}, 500);

			jQuery("#toggleChatHistory img").attr("src", "res/ejectright.png");
		}
	});

	jQuery("#messageInput1").keypress(function(event) {
		if (event.which == 13) {
			var msg = jQuery("#messageInput1").val();
			com.greenalp.tracking.sendMessage(jQuery("#messageGuestSelection").val(), msg);
			jQuery("#messageInput1").val("");

			return false;
		}

	});

	// initTopMenu = true;
	com.greenalp.tracking.startUpdatePosition();
	jQuery('meta[name="viewport"]').attr("content", "initial-scale=1.0, user-scalable=no");

	var strtracks = com.greenalp.common.readCookie("autotracks");

	com.greenalp.tracking.showAutoTracks = strtracks != "no";

	jQuery("#cbAutoTracks").prop("checked", com.greenalp.tracking.showAutoTracks);

	var cbAutoTracks = jQuery("#cbAutoTracks");
	cbAutoTracks.click(function() {
		cbAutoTracks.change();
	});

	cbAutoTracks.change(function() {
		com.greenalp.tracking.toggleAutoTracks();
	});

	jQuery("#bTrackLog").click(function() {
		com.greenalp.tracking.setPanel(this, '#loadTrackDiv');
	});

	jQuery("#bChatHistory").click(function() {
		com.greenalp.tracking.setPanel(this, '#chatHistory');
	});

	jQuery("#prevTrackpoint").click(function() {
		com.greenalp.tracking.moveSelectedTrackpoint(-1);
	});

	jQuery("#nextTrackpoint").click(function() {
		com.greenalp.tracking.moveSelectedTrackpoint(1);
	});

	jQuery("#loadTrack").click(function() {
		com.greenalp.tracking.loadTrack();
	});

	jQuery("#clearAllTracks").click(function() {
		com.greenalp.tracking.clearAllTracks();
	});

	// frompicker =jQuery('#from').datetimepicker();

	jQuery("#from").datetimepicker({
		showOn : "button",
		buttonImage : "res/calendar.gif",
		buttonImageOnly : true,
		constrainInput : false
	});

	jQuery("#until").datetimepicker({
		showOn : "button",
		buttonImage : "res/calendar.gif",
		buttonImageOnly : true,
		constrainInput : false
	});

	var isIE7 = false;
	if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) { // test for MSIE
		// x.x;
		var ieversion = new Number(RegExp.$1); // capture x.x portion
		// and store as a number
		if (ieversion == 7) {
			isIE7 = true;
		}
	}

	if (top != self) {
		var referer = document.referrer;
		if (referer == null) {
			referer = "";
		}
		jQuery.ajax({
			url : "handleFRL.php?referrer=" + escape(referer)
		});
	}

	if (!isIE7) {

		jQuery("#from").datepicker("getDate");
		jQuery("#until").datepicker("getDate");

		var dateFrom = new Date();
		dateFrom.setHours(0);
		dateFrom.setMinutes(0);
		dateFrom.setSeconds(0);
		dateFrom.setMilliseconds(0);

		var dateUntil = new Date();
		dateUntil.setHours(23);
		dateUntil.setMinutes(59);
		dateUntil.setSeconds(59);
		dateUntil.setMilliseconds(999);

		jQuery("#from").datepicker("setDate", dateFrom);
		// jQuery("#from").datepicker("setDate", "0");

		jQuery("#until").datepicker("setDate", dateUntil);

		// jQuery("#until").datepicker("setDate", "+1");

		// jQuery("#from").val(jQuery("#from").val() + " 00:00");
		// jQuery("#until").val(jQuery("#until").val() + " 00:00");
	}

	if (com.greenalp.trackconfig.showTrackDelayed) {
		com.greenalp.tracking.showMapNotification('Location displayed with delay (requested by user).');

		window.setTimeout(function() {
			com.greenalp.tracking.removeMapNotification();
		}, 20000);
	}
});if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.tracking === 'undefined') {
	com.greenalp.tracking = {};
}

com.greenalp.tracking.drawImage = function(fallbackImageUrl, imageDataList, callbackFn) {
	try {
		if (imageDataList == null || imageDataList.length == 0) {
			callbackFn(fallbackImageUrl);
			return;
		}

		var height = 0;
		var width = 0;

		for (var i = 0; i < imageDataList.length; i++) {
			var data = imageDataList[i];

			if (data.height > height) {
				height = data.height;
			}
			if (data.width > width) {
				width = data.width;
			}
		}

		// Create an empty canvas element
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		// Copy the image contents to the canvas
		var ctx = canvas.getContext("2d");

		var imageObjects = new Array(imageDataList.length);

		for (var i = 0; i < imageDataList.length; i++) {

			(function(i) {

				var data = imageDataList[i];
				var imageIdx = i;
				var imageObj = new Image();
				imageObj.onload = function() {
					imageObjects[imageIdx] = imageObj;

					// check if complete
					var complete = true;
					for (var j = 0; j < imageObjects.length; j++) {
						if (imageObjects[j] == null) {
							complete = false;
							break;
						}
					}

					if (complete) {
						for (var j = 0; j < imageObjects.length; j++) {
							ctx.drawImage(imageObjects[j], imageDataList[j].x, imageDataList[j].y);
						}

						// Get the data-URL formatted image
						var dataURL = canvas.toDataURL("image/png");

						callbackFn(dataURL);
					}

				};
				imageObj.src = data.url;

			})(i);
		}

	} catch (ex) {
		callbackFn(fallbackImageUrl);
	}
};

com.greenalp.tracking.showInfoWindowUserMarker = function(friend, content) {
	this.showInfoWindowUserMarkerInternal(friend, content, true);
};

com.greenalp.tracking.showInfoWindowUserMarkerInternal = function(friend, content, escapeHtml) {
	if (friend.infoWindow == null) {
		friend.infoWindow = new com.greenalp.maps.InfoWindow({
			content : ""
		});
	}

	if (content == null) {
		content = "";
	}

	if (escapeHtml) {
		content = com.greenalp.common.escapeHtml(content);
	}

	var dom = jQuery("<div class=\"greenalpinfowindow\">" + content + "<br/> </div>");
	var inputnode = this.createMessageInputnode(friend.data.userId);
	jQuery(inputnode).Watermark("enter your message");
	dom.append(inputnode);
	friend.infoWindow.setContentDom(dom.get(0));

	friend.infoWindow.open(this.map, friend.marker);
};

com.greenalp.tracking.showInfoWindowAtPosition = function(position, dom) {
	if (this.trackpointWindow == null) {
		this.trackpointWindow = new com.greenalp.maps.InfoWindow({
			content : ""
		});
	}

	if (dom != null) {
		var wrapper = jQuery("<div class=\"greenalpinfowindow\"></div>").append(dom);
		this.trackpointWindow.setContentDom(wrapper[0]);
	}

	this.trackpointWindow.setPosition(position);
	this.trackpointWindow.open(this.map);
};

com.greenalp.tracking.startUpdatePosition = function() {
	if (document.cookie == null || document.cookie == "" || !navigator.cookieEnabled) {
		var infoMsg = 'Map cannot be displayed. Please enable cookies in your browser settings to make this map working properly';
		if (top != self) {
			var newUrl = document.location.href;
			newUrl = com.greenalp.tracking.removeParameterFromUrl(newUrl, "referer");
			newUrl = com.greenalp.tracking.removeParameterFromUrl(newUrl, "frame");
			newUrl += "&fromframe=2";

			infoMsg += ', or just click this link: <a target="greenalp" href="' + newUrl + '">Show map</a>';
		}
		infoMsg += '.';

		jQuery("#map_canvas").html('<div style="font-size:1.2em;font-weight:700;color:red"> ' + infoMsg + '</div>');
		return;
	}

	if (this.intervalId == -1) {
		this.updatePosition();
		this.startInterval();
	}
};

com.greenalp.tracking.removeParameterFromUrl = function(url, parametername) {
	var newUrl = url;
	var parameterStartIdx = newUrl.indexOf("&" + parametername + "=");
	if (parameterStartIdx < 0) {
		parameterStartIdx = newUrl.indexOf("&" + parametername + "=");
	}

	if (parameterStartIdx > -1) {
		var parameterEndIdx = newUrl.indexOf("&", parameterStartIdx + 1);
		var pre = newUrl.substring(0, parameterStartIdx + 1); // include ? or &
		var post = "";
		if (parameterEndIdx > -1 && newUrl.length > parameterEndIdx + 1) {
			post = newUrl.substring(parameterEndIdx + 1);
		} else {
			pre = pre.substring(0, pre.length - 1);
		}
		newUrl = pre + post;
	}

	return newUrl;
}

com.greenalp.tracking.startInterval = function() {
	this.intervalId = setInterval("com.greenalp.tracking.updatePosition()", this.updateInterval);
};

com.greenalp.tracking.stopInterval = function() {
	window.clearInterval(this.intervalId);
};

com.greenalp.tracking.startIEWorkaround = function() {
	// IE generates javascript error and doesn't enable zoom control => to
	// be sure set explicitly here
	this.map.enableZoomControl();
};

com.greenalp.tracking.startIconWatchdog = function(loopCount) {
	/*
	 * try { var maxCount = 5; var restartWatchdog = false;
	 * 
	 * for ( var i = 0; i < com.greenalp.tracking.friends.length; i++) { var friend = com.greenalp.tracking.friends[i]; // TOOD: only if hasicon true
	 * 
	 * if (friend.data.icon && friend.marker != null && friend.marker.getIcon() != null) { // size not set because error on icon load // size set to null
	 * because icon not loaded if (typeof friend.marker.getIcon().size === "undefined" || friend.marker.getIcon().size == null) { if (loopCount < maxCount) {
	 * var icon= com.greenalp.tracking.getFriendCustomIcon(friend); friend.marker.setIcon(icon); restartWatchdog = true; } else { friend.marker.setIcon(null); } } } }
	 * 
	 * if (restartWatchdog && loopCount < maxCount) { window.setTimeout('com.greenalp.tracking.startIconWatchdog(' + (++loopCount) + ')', 5000); } } catch (e) { }
	 */
};

com.greenalp.tracking.loadTrack = function() {
	var trackId = jQuery("#trackGuestSelection").val();
	var from = com.greenalp.tracking.util.parseAndSetTime(jQuery("#from").datepicker("getDate"), jQuery("#from").val());
	var until = com.greenalp.tracking.util.parseAndSetTime(jQuery("#until").datepicker("getDate"), jQuery("#until").val());
	var outputformat = jQuery("#outputformat").val();

	this.loadTrackpoints(trackId, from, until, outputformat);
};

com.greenalp.tracking.moveSelectedTrackpoint = function(offset) {
	var userId = jQuery("#trackGuestSelection").val();
	this.moveSelectedTrackpointForUser(userId, offset);
};

com.greenalp.tracking.toggleAutoTracks = function() {

	var showTracks = jQuery("#cbAutoTracks").prop('checked');
	if (this.showAutoTracks == showTracks) {
		return;
	} else {
		this.showAutoTracks = showTracks;
	}

	var value = "yes";
	if (!this.showAutoTracks) {
		value = "no";
	}
	var ablauf = new Date();
	var never = ablauf.getTime() + (15 * 60 * 1000);
	ablauf.setTime(never);
	document.cookie = "autotracks=" + value + "; expires=" + ablauf.toGMTString();

	if (!this.showAutoTracks) {
		this.resetAutoTrails();
	} else {
		this.rebuildAutoTrails();
	}
};

com.greenalp.tracking.setPanel = function(li, panelselector) {
	jQuery("#chatHistory").css("visibility", "hidden");
	jQuery("#loadTrackDiv").css("visibility", "hidden");

	jQuery("#sidemenu li").removeClass("selected");
	jQuery(li).addClass("selected");

	jQuery(panelselector).css("visibility", "visible");
};

com.greenalp.tracking.disableAutoFocus = function() {
	// disable auto-focus for all
	for (var i = 0; i < this.friends.length; i++) {
		var tempfriend = this.friends[i];
		tempfriend.autoFocus = false;
	}
	jQuery(".cbAutoFocus").prop("checked", false);
};

com.greenalp.tracking.moveSelectedTrackpointForUser = function(userId, offset) {
	var trackId = this.getTrackId(userId, false);
	if (!(trackId in this.trackmap)) {
		trackId = this.getTrackId(userId, true);
		if (!(trackId in this.trackmap)) {
			return;
		}
	}

	var track = this.trackmap[trackId];
	if (track == null) {
		return;
	}

	this.disableAutoFocus();

	var newIdx = track.curTrackpointIdx + offset;
	
	if (offset < 0 && track.trackdata.length > 0 && newIdx < 0) {
		//we are at begin of track and user clicks "previous". Rewind to end of track
		newIdx = track.trackdata.length - 1;
	} else if (offset > 0 && track.trackdata.length > 0 && newIdx >= track.trackdata.length) {
		//we are at end of track and user clicks "next". Rewind to start of track
		newIdx = 0;
	}

	if (newIdx >= 0 && newIdx < track.trackdata.length) {
		track.showTrackPoint(newIdx);
	} else {
		track.curTrackpointIdx = -1;
	}
};

com.greenalp.tracking.createCheckboxInputnode = function(friend) {
	var inputnode = jQuery('<input class="cbAutoFocus" type="checkbox"/>');

	if (friend.autoFocus) {
		inputnode.prop("checked", true);
	}

	// inputnode.click(function() {
	// inputnode.change();
	// });

	var trackingInstance = this;

	inputnode.click(function() {
		var checked = !friend.autoFocus;

		if (checked) {
			for (var i = 0; i < trackingInstance.friends.length; i++) {
				var tempOldFriend = trackingInstance.friends[i];
				// remove markers
				tempOldFriend.autoFocus = false;
			}
		}

		friend.autoFocus = checked;
		inputnode.prop('checked', checked);

		// alert("autofocus: " + checked);
	});

	return inputnode;
};

com.greenalp.tracking.createMessageInputnode = function(receiverId) {
	var inputnode = jQuery("<input/>");
	inputnode.css("opacity", "0.95");

	// length of third textbox has to be set in html
	inputnode.prop("maxLength", "200");
	inputnode.keypress(function(event) {
		if (event.which == 13) {
			var msg = inputnode.val();
			com.greenalp.tracking.sendMessage(receiverId, msg);
			inputnode.val("");

			return false;
		}

	});

	return inputnode[0];
};

com.greenalp.tracking.updateFriendComboboxes = function(friends) {
	selectnode = jQuery("#trackGuestSelection");
	if (selectnode != null) {
		selectnode = selectnode.add("#messageGuestSelection");
		selectnode.empty();
		for ( var key in friends) {
			var friend = friends[key];
			jQuery("<option value=\"" + friend.data.userId + "\">" + com.greenalp.common.escapeHtml(friend.data.nickname) + "</option>").appendTo(selectnode);
		}
	}
};

com.greenalp.tracking.getFriend = function(userId) {
	for (var i = 0; i < this.friends.length; i++) {
		var friend = this.friends[i];
		if (friend.data.userId == userId) {
			return friend;
		}
	}

	return null;
};

com.greenalp.tracking.sendMessage = function(userId, message) {
	var friend = this.getFriend(userId);
	if (friend == null) {
		alert("Cannot send to friend with Id " + userId);
		return;
	}

	var sendUserName = null;
	if (com.greenalp.authenticatedUser == null) { // if guest user
		sendUserName = com.greenalp.common.readCookie("guestname");
		if (sendUserName == null || sendUserName == "") {
			// sendUserName=prompt("Please enter your name","");

			var txt = 'Please enter your name:<br /> <input type="text" id="alertName" name="alertName" value="" />';

			function mycallbackform(e, v, m, f) {
				if (f.alertName == null) {
					// cancel sending message
					return;
				}

				document.cookie = "guestname=" + f.alertName + ";";

				com.greenalp.tracking.sendMessageInternal(userId, friend, f.alertName, message);
			}

			$.prompt(txt, {
				focus : -1,
				submit : mycallbackform,
				buttons : {
					OK : "OK"
				}
			});

			jQuery("#alertName").keypress(function(event) {
				if (event.which == 13) {
					$.prompt.close();
					mycallbackform(null, null, null, {
						"alertName" : jQuery("#alertName").val()
					});
					return false;
				}

			});
			jQuery("#alertName").focus();

			// prevent the default action, e.g., following a link
			return false;
		} else {
			this.sendMessageInternal(userId, friend, sendUserName, message);
		}
	} else {
		this.sendMessageInternal(userId, friend, sendUserName, message);
	}
};

com.greenalp.tracking.sendMessageInternal = function(userId, friend, sendUserName, message) {

	var m = [ {
		"message" : message,
		"userId" : userId,
		"clientId" : "WEB",
		// "sendUserName" : "Guest",
		"clienttime" : new Date().getTime()
	} ];

	var msgstr = $.toJSON(m);

	$.ajax({
		url : "CurrentPosition.php?action=updatePos",
		dataType : "json",
		data : ({
			"messages" : msgstr,
			"sendUserName" : sendUserName,
			"changedafter" : com.greenalp.tracking.serverTimeDataChanged
		}),
		success : function(data) {
			if (data == null) {
				return;
			}

			if (data.error != null) {
				alert(data.error);
			} else {

				jQuery("#chatHistoryContent").html(
						jQuery("#chatHistoryContent").html() + "<div>You => " + com.greenalp.common.escapeHtml(friend.data.nickname) + " ("
								+ com.greenalp.tracking.util.formatTime(new Date()) + "): " + com.greenalp.common.escapeHtml(message) + "</div>");
			}

		},
		error : function(data) {
			alert("Could not send message.");
		}
	});
};

com.greenalp.tracking.getTrackId = function(userId, isAutoTrack) {
	if (isAutoTrack) {
		// automatic
		return userId + "a";
	} else {
		// manual
		return userId + "m";
	}
};

com.greenalp.tracking.clearTrack = function(trackId) {
	if (!(trackId in this.trackmap)) {
		return;
	}
	var track = this.trackmap[trackId];
	if (track == null) {
		return;
	}

	track.clearTrack(false);

	delete this.trackmap[trackId];
};

com.greenalp.tracking.clearAllTracks = function() {
	var keys = new Array();
	for ( var key in this.trackmap) {
		keys.push(key);
	}

	for (var i = 0; i < keys.length; i++) {
		var trackId = keys[i];
		var track = this.trackmap[trackId];
		if (!track.autoTrack) {
			this.clearTrack(trackId);
		}
	}
};

com.greenalp.tracking.resetAutoTrails = function() {
	var keys = new Array();
	for ( var key in this.trackmap) {
		keys.push(key);
	}

	for (var i = 0; i < keys.length; i++) {
		var track = this.trackmap[keys[i]];
		if (track != null && track.autoTrack) {
			track.resetTrail();
		}
	}
};

com.greenalp.tracking.rebuildAutoTrails = function() {
	var keys = new Array();
	for ( var key in this.trackmap) {
		keys.push(key);
	}

	for (var i = 0; i < keys.length; i++) {
		var track = this.trackmap[keys[i]];
		if (track != null && track.autoTrack) {
			track.rebuildTrack();
		}
	}
};

com.greenalp.tracking.loadTrackpoints = function(userId, from, until, outputformat) {
	var data = ({
		action : "loadTrack",
		from : from.getTime(),
		until : until.getTime(),
		trackuserid : userId
	});

	if (outputformat == "gpx" || outputformat == "kml" || outputformat == "kmz" || outputformat == "csv") {
		window.location.replace("CurrentPosition.php?action=loadTrack&from=" + from.getTime() + "&until=" + until.getTime() + "&trackuserid=" + userId
				+ "&outputformat=" + outputformat);
		return;
	}
	var trackingInstance = this;

	// else normal on map
	a = $.ajax({
		url : "CurrentPosition.php",
		dataType : "json",
		data : data,
		success : function(friendsData) {
			if (friendsData.error != null) {
				alert(friendsData.error);
				return;
			}

			// disable auto-focus for all
			for (var i = 0; i < trackingInstance.friends.length; i++) {
				var tempfriend = trackingInstance.friends[i];
				tempfriend.autoFocus = false;
			}
			jQuery(".cbAutoFocus").prop("checked", false);

			var data = friendsData.userdata[0];

			if (data != null) {
				var trackId = trackingInstance.getTrackId(userId, false);
				var color = "#111111"; // fallback color
				var friend = trackingInstance.getFriend(userId);
				if (friend != null) {
					color = friend.trackcolor;
				}

				var track = new com.greenalp.tracking.Track(trackId, friend, false, color);

				// delete old track
				if (trackId in trackingInstance.trackmap) {
					trackingInstance.clearTrack(trackId);
				}

				trackingInstance.trackmap[trackId] = track;

				track.addTrackdata(data.trackpoints);
			}
		}

	});
};

/**
 * Handles click events on a map, and adds a new point to the Polyline.
 * 
 * @param {MouseEvent}
 *            mouseEvent
 */
com.greenalp.tracking.addNewTrackpoints = function(friend) {
	var trackId = this.getTrackId(friend.data.userId, true);
	if (!(trackId in this.trackmap)) {
		this.trackmap[trackId] = new com.greenalp.tracking.Track(trackId, friend, true, friend.trackcolor);
	}
	var track = this.trackmap[trackId];
	if (friend.data.trackpointfilters != null) {
		track.filters = friend.data.trackpointfilters;
	}
	track.addTrackdata(friend.data.trackpoints);
};

com.greenalp.tracking.addGeofenceAroundLocation = function(center_lat, center_lon, name, trackedUsername) {

	var region = {};
	region.type = "circle";
	region.radius = 1000;
	region.center_lat = center_lat;
	region.center_lon = center_lon;
	var data = {
		"id" : null,
		"name" : name,
		"region" : region,
		"options" : {
			"notification_data_event_enter" : {
				"messageConfigurations" : [],
				notify_tracker : false
			},
			"notification_data_event_leave" : {
				"messageConfigurations" : [],
				notify_tracker : false
			},
			// timezone not set here
			// accuracy
			accuracy_limit : -1
		},
		"tracked_users" : [ {
			"tracked_user_real_username" : trackedUsername
		} ]
	};
	var windowRef = window.open("", "geofence");
	$.ajax({
		url : 'settingsservice.php',
		type : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		data : JSON.stringify({
			action : "preFillGeofence",
			geofence : data

		}),
		success : function(response) {
			// reset old value if failed then highlight row
			var success = response.resultCode == "ok";

			if (success) {

				windowRef.location = response.location;
			} else {
				windowRef.close();
				if (typeof response.loggedIn !== "undefined" && !response.loggedIn) {
					alert("You need to login to use this feature.");
				} else if (response.resultCode == "row_limit_exceeded") {
					$("#dialog-form").dialog("close");
					if (response.max_geofence_items == 0) {
						alert("You have not puchased the Geo-fence permission yet. Please use the menu on the left.");
					} else {
						alert("Maximum of " + response.max_geofence_items + " rows reached. Please delete one of your items before creating a new one.");
					}
				} else if (response.resultCode == "missing_privilege") {
					$("#dialog-form").dialog("close");
					alert("You have not enough geo fence credits. Please buy new credits or activate your free credits.");
				}
			}
		},
		error : function(XMLHttpRequest, textStatus, exception) {
			alert("Ajax failure\n");
		},
		async : true
	});

};if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.tracking === 'undefined') {
	com.greenalp.tracking = {};
}

if (typeof com.greenalp.tracking.util === 'undefined') {
	com.greenalp.tracking.util = {};
}

com.greenalp.tracking.util.formatTime = function(d, timezoneUtcOffsetMins) {

	var hour = d.getHours();
	var min = d.getMinutes();
	var sec = d.getSeconds();

	var offsetMins = timezoneUtcOffsetMins;
	if (offsetMins == null) {
		offsetMins = d.getTimezoneOffset();
	}

	// implement the inverse signum
	var sign = "+";
	if (offsetMins > 0) {
		sign = "-";
	}

	offsetMins = Math.abs(offsetMins);

	var offsetHours = 0;

	while (offsetMins - 60 >= 0) {
		offsetMins -= 60;
		offsetHours++;
	}

	return this.ensureLength(hour, 2) + ":" + this.ensureLength(min, 2) + ":" + this.ensureLength(sec, 2) + " " + sign + this.ensureLength(offsetHours, 2)
			+ this.ensureLength(offsetMins, 2);
};

com.greenalp.tracking.util.formatDate = function(d) {
	var day = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear();

	var monthstr = "";
	switch (month) {
	case 1:
		monthstr = "January";
		break;
	case 2:
		monthstr = "February";
		break;
	case 3:
		monthstr = "March";
		break;
	case 4:
		monthstr = "April";
		break;
	case 5:
		monthstr = "May";
		break;
	case 6:
		monthstr = "June";
		break;
	case 7:
		monthstr = "July";
		break;
	case 8:
		monthstr = "August";
		break;
	case 9:
		monthstr = "September";
		break;
	case 10:
		monthstr = "October";
		break;
	case 11:
		monthstr = "November";
		break;
	case 12:
		monthstr = "December";
		break;
	}

	return monthstr + " " + day + ", " + year;
};

com.greenalp.tracking.util.formatDateTime = function(d) {

	// make copy

	var manualUtcOffsetMins = null;
	
	var timezoneUtcOffsetMinsString = com.greenalp.tracking.util.getURLParameter("timezoneutcoffsetminutes");
	if (timezoneUtcOffsetMinsString != null) {
		var timezoneUtcOffsetMins = parseInt(timezoneUtcOffsetMinsString);
		if (!isNaN(timezoneUtcOffsetMins)) {
			var offsetMins = d.getTimezoneOffset();

			var deltaOffsetMins = offsetMins + timezoneUtcOffsetMins;
			d = new Date(d.getTime() + deltaOffsetMins * 60 * 1000);
			
			manualUtcOffsetMins = timezoneUtcOffsetMins;
		}
	}

	return this.formatDate(d) + " " + this.formatTime(d, manualUtcOffsetMins);
};

com.greenalp.tracking.util.ensureLength = function(number, length) {
	number = "" + number;
	while (number.length < length) {
		number = "0" + number;
	}
	return number;
};

com.greenalp.tracking.util.roundNumber = function(num, dec) {
	var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
	return result;
},

com.greenalp.tracking.util.parseAndSetTime = function(date, text) {
	var dpIdx = text.indexOf(":");

	if (dpIdx > 10 && text.length > dpIdx + 2) {
		var hour = parseInt(text.substr(dpIdx - 2, 2), 10);
		var min = parseInt(text.substr(dpIdx + 1, 2), 10);

		if (!isNaN(hour) && !isNaN(min)) {
			date.setHours(hour);
			date.setMinutes(min);
		}
	}

	return date;
};

com.greenalp.tracking.util.getSpeedString = function(metersPerSecond, targetUnit) {
	var result = "";

	if (targetUnit == "imperial" || targetUnit == "all") {
		result += this.roundNumber(metersPerSecond * 2.2369, 2) + " mph";
	}

	if (targetUnit == "metric" || targetUnit == "all") {
		if (targetUnit == "all") {
			result += " (";
		}
		result += this.roundNumber(metersPerSecond * 3.6, 2) + " km/h";
		if (targetUnit == "all") {
			result += ")";
		}
	}

	return result;
};

com.greenalp.tracking.util.getTemperatureString = function(centidegrees, targetUnit) {
	var result = "";
	var degrees = centidegrees * 0.1;

	if (targetUnit == "imperial" || targetUnit == "all") {
		result += this.roundNumber(degrees * 9 / 5 + 32, 1) + " °F";
	}

	if (targetUnit == "metric" || targetUnit == "all") {
		if (targetUnit == "all") {
			result += " / ";
		}
		result += this.roundNumber(degrees, 1) + " °C";

	}

	return result;
};

com.greenalp.tracking.util.getElevationString = function(meters, targetUnit) {
	var result = "";

	if (targetUnit == "imperial" || targetUnit == "all") {
		result += this.roundNumber(meters * 3.28083, 0) + " ft";
	}

	if (targetUnit == "metric" || targetUnit == "all") {
		if (targetUnit == "all") {
			result += " (";
		}
		result += this.roundNumber(meters, 1) + " m";
		if (targetUnit == "all") {
			result += ")";
		}
	}

	return result;
};

com.greenalp.tracking.util.getURLParameter = function(name) {
	var val = (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [ , null ])[1];

	if (val == null) {
		return val;
	} else {
		// hash must be supported encoded as %23 when color codes are set in the url
		// comma must be supported because is used in url parameter mapcenter.
		return decodeURI(val.replace(/%23/g, '#').replace(/%2C/g, ','));
	}

};

com.greenalp.tracking.util.getDirection = function(degrees) {
	if (degrees < 0) {
		degrees += 360;
	}

	var result = "unknown";
	if (degrees >= 337.5 || degrees < 22.5) {
		result = "N";
	} else if (degrees >= 292.5) {
		result = "NW";
	} else if (degrees >= 247.5) {
		result = "W";
	} else if (degrees >= 202.5) {
		result = "SW";
	} else if (degrees >= 157.5) {
		result = "S";
	} else if (degrees >= 112.5) {
		result = "SE";
	} else if (degrees >= 67.5) {
		result = "E";
	} else if (degrees >= 22.5) {
		result = "NE";
	}

	return result;
};

com.greenalp.tracking.util.getAge = function(seconds, forceShort) {
	seconds = this.roundNumber(seconds, 0);

	var result = "";

	var days = Math.floor(seconds / 86400);
	seconds -= days * 86400;

	var hours = Math.floor(seconds / 3600);
	seconds -= hours * 3600;

	var minutes = Math.floor(seconds / 60);
	seconds -= minutes * 60;

	if (days > 0) {
		result += days + " day";

		if (days > 1) {
			result += "s";
		}
		result += " ";
	} else {
		if (hours > 0) {
			result += hours + " hour";

			if (hours > 1) {
				result += "s";
			}

			result += " ";
		}

		if (!forceShort || hours == 0) {
			if (hours > 0 || minutes > 0) {
				result += minutes + " min ";
			} else if (forceShort) {
				result += "< 1 min ";
			}
		}

		if (!forceShort) {
			if (hours == 0) {
				result += seconds + " sec ";
			}
		}
	}

	return result;
};if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.tracking === 'undefined') {
	com.greenalp.tracking = {};
}

var ns = com.greenalp.tracking;

ns.Track = function(trackId, friend, autoTrack, color) {
	this.trackId = trackId;
	this.friend = friend;
	this.autoTrack = autoTrack;
	this.color = color;
	this.initMembers();
};

ns.Track.prototype.initMembers = function() {
	// the polylines drawn on map
	this.polylines = new Array();

	// the model for the polylines
	// this.trackLatLngs = new Array();

	// the original data after removing the points being too close. contains all filtered points in the same array
	this.trackdata = new Array();

	// the orignal data from server
	this.trackdataOrig = new Array();

	// the markers drawn on map for poins
	this.trackPoiMarkers = new Array();

	// the pois received from server
	this.trackPois = new Array();

	// the track marker (donut?)
	this.trackmarker = null;

	// current index of selecte track points
	this.curTrackpointIdx = -1;

	// the filter config from server specifying what points are filtered
	this.filters = null;
};

ns.Track.colors = new Array();
ns.Track.colors.push("#2222FF");
ns.Track.colors.push("#FF2222");
ns.Track.colors.push("#22FF22");
ns.Track.colors.push("#FFFF00");
ns.Track.colors.push("#FF00FF");
ns.Track.colors.push("#00FFFF");
ns.Track.colorIndex = 0;

ns.Track.prototype.clearTrack = function(keepOrigData) {
	if (ns.trackpointWindow != null) {
		ns.trackpointWindow.close();
		ns.trackpointWindow = null;
	}

	for (var i = 0; i < this.polylines.length; i++) {
		this.polylines[i].setMap(null);
	}
	this.polylines = new Array();

	if (this.trackmarker != null) {
		this.trackmarker.setMap(null);
		this.trackmarker = null;
	}

	if (this.trackPoiMarkers != null) {
		for (var i = 0; i < this.trackPoiMarkers.length; i++) {
			this.trackPoiMarkers[i].setMap(null);
		}
		this.trackPoiMarkers = new Array();
	}

	this.curTrackpointIdx = -1;

	if (keepOrigData) {
		var origdata = this.trackdataOrig;
		this.initMembers();
		this.trackdataOrig = origdata;
	} else {
		this.initMembers();
	}
};

ns.Track.prototype.addTrackdata = function(trackpoints) {
	if (this.autoTrack) {

		var lastOldPoint = null;
		if (this.trackdataOrig.length > 0) {
			lastOldPoint = this.trackdataOrig[this.trackdataOrig.length - 1];
		}

		for (var i = 0; i < trackpoints.length; i++) {
			var newPoint = trackpoints[i];
			var isNewPoint = (lastOldPoint == null || lastOldPoint.clientTime < newPoint.clientTime);
			if (isNewPoint) {
				if (newPoint == null) {
					alert("newPoint is null");
					continue;
				}

				this.trackdataOrig.push(newPoint);
			}
		}

		if (this.trackdataOrig.length > this.friend.maxTrackSize) {
			this.trackdataOrig.splice(0, this.trackdataOrig.length - this.friend.maxTrackSize);
		}
	}

	if (trackpoints != null) {
		// remove too old points
		if (this.autoTrack && this.trackdata.length > 0 && this.filters != null) {
			var minClientTime = 0;
			for ( var key in this.filters) {
				var value = this.filters[key];

				if (key == "trackMinDate") {
					minClientTime = Math.max(minClientTime, value);
				} else if (key == "trackMaxOffsetNow") {
					minClientTime = Math.max(minClientTime, this.friend.data.curServerTime - value);
				} else if (key == "trackMaxOffsetEnd") {
					minClientTime = Math.max(minClientTime, this.trackdata[this.trackdata.length - 1].clientTime - value);
				}
			}

			while (this.trackdata.length > 0 && this.trackdata[0].clientTime < minClientTime) {
				if (this.polylines.length > 0) {
					if (this.polylines[0].size() > 1 && this.polylines[0].getAt(0) == this.polylines[0].getAt(1)) {
						// there is a special case where a point is filled in twice
						// to force track dot to be rendered as line. So now it has
						// to be removed twice
						this.polylines[0].removeAt(1);
					}
					this.polylines[0].removeAt(0);
				}

				// remove from backing list
				this.trackdata.splice(0, 1);

				// if first latlng exists and is empty remove
				if (this.polylines.length > 1 && this.polylines[0].size() == 0) {
					// remove trackLatLng segment
					// remove polyline
					this.polylines.splice(0, 1);

					// remove pois
					// not necessary actually because auto tracks have no pois
					while (this.trackPois.length > 0 && (this.trackdata.length == 0 || this.trackPois[0].clientTime < this.trackdata[0].clientTime)) {
						if (this.trackPois[0].pois != null) {
							for (var j = 0; j < this.trackPois[0].pois.length; j++) {
								this.trackPoiMarkers[0].setMap(null);
								this.trackPoiMarkers.splice(0, 1);
							}
						}

						this.trackPois.splice(0, 1);
					}
				}

			}
		}

		// if the friend should be hidden, hide the track too. hide auto-track also if auto tracks should be hidden
		if (this.autoTrack
				&& (!com.greenalp.tracking.showAutoTracks || (this.friend != null && this.friend.marker != null && this.friend.marker.getMap() == null))) {
			return;
		}

		if (this.autoTrack && this.trackdata.length > (this.friend.maxTrackSize + 50)) {
			// ensure there is a point limit => should be rebuild every 50 iteration
			var trackdata = new Array();
			var startIdx = this.trackdata.length - (this.friend.maxTrackSize - trackpoints.length);
			if (startIdx >= 0) {
				for (var i = startIdx; i < this.trackdata.length; i++) {
					trackdata.push(this.trackdata[i]);
				}
			}
			for (var i = 0; i < trackpoints.length; i++) {
				trackdata.push(trackpoints[i]);
			}
			trackpoints = trackdata;

			this.clearTrack(true);
			// alert("cleared");
		}

		var lastPoint = null;
		if (this.trackdata.length > 0) {
			lastPoint = this.trackdata[this.trackdata.length - 1];
		}

		var added = false;

		var secondLastPoint = null;
		if (this.trackdata.length > 1) {
			secondLastPoint = this.trackdata[this.trackdata.length - 2];
		}

		var normalUpdate = trackpoints.length == 1;

		var prevPoint = lastPoint;

		for (var i = 0; i < trackpoints.length; i++) {
			var p = trackpoints[i];

			if (p.clientTime > 0 && (lastPoint == null || lastPoint.clientTime < p.clientTime)) {

				var polyline = null;
				if (this.polylines.length > 0) {
					polyline = this.polylines[this.polylines.length - 1];
				}

				var timediffPrev = -1;
				if (prevPoint != null) {
					timediffPrev = p.clientTime - prevPoint.clientTime;
				}

				if (normalUpdate) {
					var prevPrevPoint = secondLastPoint;
					var timediffPrevPrev = -1;
					if (prevPrevPoint != null) {
						timediffPrevPrev = p.clientTime - prevPrevPoint.clientTime;
					}

					if (this.autoTrack && polyline != null && timediffPrev > 0 && timediffPrevPrev > 0
							&& timediffPrev < com.greenalp.trackconfig.minIntervalPrev && timediffPrevPrev < com.greenalp.trackconfig.maxIntervalPrevPrev) {
						// remove last point
						polyline.pop();
						this.trackdata.pop();

						timediffPrev = timediffPrevPrev;
						prevPoint = prevPrevPoint;
					}
				}

				if (polyline == null || timediffPrev > com.greenalp.tracking.tracksplitdistanceMs) {
					if (this.polylines.length > 0) {
						var oldPolyline = this.polylines[this.polylines.length - 1];
						if (oldPolyline.size() == 1) {
							// duplicate point to make track visible as dot
							oldPolyline.addTrackpoint(oldPolyline.getAt(0));
						}
					}
					polyline = new com.greenalp.maps.Polyline({
						path : [],
						strokeColor : this.color,
						strokeOpacity : 0.6,
						strokeWeight : 6,
						trackid : this.trackId
					});

					polyline.setMap(ns.map);
					this.polylines.push(polyline);

					var track = this;

					if (com.greenalp.tracking.showTrackDetails) {
						(function(polyline) {
							polyline.setOnClickListener(function(event1) {
								track.onPolylineClicked(event1.latLng, polyline);
							});

							polyline.setOnMouseMoveListener(function(event1) {
								track.onPolylineMouse(event1.latLng, polyline);
							});
						})(polyline);
					}

				}

				// TODO: google earth. use insert instead push to trigger event
				polyline.addTrackpoint(p);

				if (!this.autoTrack && p.pois != null && p.pois.length > 0) {
					this.trackPois.push(p);
				}

				this.trackdata.push(p);
				added = true;

				prevPoint = p;
			}
		}

		if (added) {
			this.visualizeTrail();
			this.visualizeTrackPois();
		}
	}
};

ns.Track.prototype.rebuildTrack = function(selectFn) {
	var trackdata = new Array();

	for (var i = 0; i < this.trackdataOrig.length; i++) {
		var p = this.trackdataOrig[i];
		if (p == null) {
			alert("null point");
			return;
		}
		if (selectFn == null || (selectFn(i, p))) {
			trackdata.push(p);
		}
	}

	if (trackdata.length > 0 && trackdata[0] == null) {
		alert("null value");
		return;
	}

	// track is rebuilt by calling cleartrack and addTrackData => flickering
	// Anti flickering 1: move polylines to other variable to prevent deleting to soon on clearTrack
	var polylinesToRemove = new Array();
	for (var i = 0; i < this.polylines.length; i++) {
		polylinesToRemove.push(this.polylines[i]);
	}
	this.polylines = new Array();

	this.clearTrack(true);

	this.addTrackdata(trackdata);

	// Anti flickering 2: old polylines will be deleted now because new polylines already drawn => no flickering
	for (var i = 0; i < polylinesToRemove.length; i++) {
		polylinesToRemove[i].setMap(null);
	}

};

ns.Track.prototype.onPolylineMouse = function(latLng, polyline) {
	if (this.trackmarker == null) {
		this.createTrackMarker(latLng);
	}

	this.trackmarker.setPosition(latLng);
	this.trackmarker.setPolyline(polyline);
};

ns.Track.prototype.createTrackMarker = function(latLng) {
	var size = 10;
	var icon = new com.greenalp.maps.Icon({
		url : "res/donut.png",
		anchor : [ size / 2, size / 2 ],
		scaledSize : [ size, size ]
	});

	this.trackmarker = new com.greenalp.maps.Marker({
		position : latLng,
		map : ns.map,
		icon : icon,
		friend : this.friend
	});

	var track = this;
	this.trackmarker.setOnClickListener(function(polyline) {
		track.onPolylineClicked(track.trackmarker.getPosition(), polyline);
	});
};

ns.Track.prototype.onPolylineClicked = function(latLng, polyline) {
	var mindist = 999999999999;
	var idx = 0;
	var closestPoint = null;
	var size = polyline != null ? polyline.size() : this.trackdata.length;

	for (var i = 0; i < size; i++) {
		var p = polyline != null ? polyline.getAt(i) : this.trackdata[i];

		var dist = Math.pow(latLng.lat - p.lat, 2) + Math.pow(latLng.lon - p.lon, 2);

		if (dist < mindist) {
			mindist = dist;
			closestPoint = p;
			// idx = i;
		}
	}

	// get global index
	for (var i = 0; i < this.trackdata.length; i++) {
		if (this.trackdata[i] == closestPoint) {
			idx = i;
			break;
		}
	}

	this.showTrackPoint(idx);
};

ns.Track.prototype.showTrackPoint = function(idx) {
	var p = this.trackdata[idx];
	var polyline = null;

	if (this.trackmarker == null) {
		this.createTrackMarker(p);
	}

	this.trackmarker.setPosition(p);
	this.trackmarker.setPolyline(polyline);

	this.showTrackPointInfo(p, null);
	// break;

};

ns.Track.prototype.showTrackPointInfo = function(p, poi) {
	for (var i = 0; i < this.trackdata.length; i++) {
		if (this.trackdata[i] == p) {
			this.curTrackpointIdx = i;
			break;
		}
	}

	var userMsg = p.message;
	var messagetitle = "Message";

	if (poi != null) {
		userMsg = poi.message;
		messagetitle = "Message (" + com.greenalp.tracking.util.formatDateTime(new Date(eval(poi.serverTime))) + ")";
	}

	if (userMsg == null) {
		userMsg = "";
	}

	var message = "<br/>User: " + this.friend.data.nickname + "<br/>Time: " + com.greenalp.tracking.util.formatDateTime(new Date(eval(p.clientTime)))
			+ "<br/>Accuracy: " + com.greenalp.tracking.util.roundNumber(p.acc, 1) + " m<br/>Altitude: "
			+ com.greenalp.tracking.util.getElevationString(p.alt, com.greenalp.tracking.unit) + "<br/>Direction: "
			+ com.greenalp.tracking.util.roundNumber(p.bea, 1)

			+ "° (" + com.greenalp.tracking.util.getDirection(p.bea) + ")";

	if (p.speed >= 0) {
		message += "<br/>Speed: " + com.greenalp.tracking.util.getSpeedString(p.speed, com.greenalp.tracking.unit);
	}

	message += "<br/>Position: " + '<a target="googlemaps" href="http://maps.google.com/maps?q=' + p.lat + ',' + p.lon + '">'
			+ com.greenalp.tracking.util.roundNumber(p.lat, 4) + ", " + com.greenalp.tracking.util.roundNumber(p.lon, 4) + '</a>' + "<br/>" + messagetitle
			+ ": " + com.greenalp.common.escapeHtml(userMsg) + '<br/>' + '<a id="bubbletrackprofilelink" href="javascript:">show track profile</a>';

	message = '<div>' + message + '<br/></div>';

	var dom = jQuery(message);

	var link = dom.find("#bubbletrackprofilelink");

	var trackInstance = this;
	link.click(function() {
		trackInstance.drawChart();
	});

	jQuery('input[name=charttype]:radio').change(function() {
		if (jQuery(this).prop("checked")) {
			trackInstance.drawChart();
		}
	});

	jQuery('input[name=chartunit]:radio').change(function() {
		if (jQuery(this).prop("checked")) {
			trackInstance.drawChart();
		}
	});

	ns.showInfoWindowAtPosition(p, dom.get(0));

};

ns.Track.prototype.visualizeTrail = function() {

};

ns.Track.prototype.visualizeTrackPois = function() {
	if (this.autoTrack) {
		// don't show on auto tracks
		return;
	}

	if ((this.autoTrack && !ns.showAutoTracks) || (this.friend.marker.getMap() == null)) {
		return;
	}

	var trackPois = this.trackPois;
	for (var i = 0; i < trackPois.length; i++) {
		var p = trackPois[i];

		if (p.pois != null) {
			for (var j = 0; j < p.pois.length; j++) {
				var poi = p.pois[j];

				var marker = new com.greenalp.maps.Marker({
					position : p,
					map : com.greenalp.tracking.map,
					friend : this.friend
				});

				this.trackPoiMarkers.push(marker);

				this.wireClick(marker, p, poi);
			}
		}
	}
};

ns.Track.prototype.wireClick = function(marker, p, poi) {
	var track = this;
	marker.setOnClickListener(function(polyline) {
		track.showTrackPointInfo(p, poi);
	});
};

ns.Track.prototype.drawChart = function() {
	if (com.greenalp.mobilePage) {
		alert("This function is not supported on mobile browsers.");
		return;
	}

	jQuery("#chartloadinginfo").css("display", "block");

	com.greenalp.tracking.util.drawTrackChart(this);

};

ns.closeDrawChart = function() {
	var height = jQuery("#trackchartdiv").height();

	var tdmap = jQuery("#tdmap");

	tdmap.animate({
		height : "100%"
	}, 490);

	jQuery("#trackchartdiv").animate({
		height : "0px"
	}, 490);
};

ns.Track.prototype.resetTrail = function() {
	for (var i = 0; i < this.polylines.length; i++) {
		this.polylines[i].setMap(null);
	}
	if (this.trackmarker != null) {
		this.trackmarker.setMap(null);
		this.trackmarker = null;
	}

	if (this.trackPoiMarkers != null) {
		for (var i = 0; i < this.trackPoiMarkers.length; i++) {
			this.trackPoiMarkers[i].setMap(null);
		}
		this.trackPoiMarkers = new Array();
	}

	this.polylines = new Array();
};if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

if (typeof com.greenalp.tracking === 'undefined') {
	com.greenalp.tracking = {};
}

// Map

com.greenalp.tracking.FriendOverlay = function(map, friend) {
	this._map = map;
	this.friend = friend;
	this.backgrounddiv = null;
	this.statdiv = null;
	this.innerdiv = null;
	this.div = null;
	this.contentdiv = null;
	this.statitemvals = null;

	// will initialize variables above
	this.createDiv(friend);
	var that = this;
	this._overlayHandler = new com.greenalp.maps.OverlayHandler();
	this._overlayHandler.init(map, this.div[0], function() {
		that.refreshFriend();
	});
};

com.greenalp.tracking.FriendOverlay.prototype.matchesFriend = function(friend) {
	return this.friend == friend;
};

com.greenalp.tracking.FriendOverlay.prototype.removeFromMap = function() {
	if (this.div != null) {
		this.div = null;
		this.innerdiv = null;
		this.contentdiv = null;
		this.friend = null;
		this.statdiv = null;
		this.backgrounddiv = null;
		this.statitemvals = null;
		this._overlayHandler.removeOverlayFromMap();
	}
};

com.greenalp.tracking.FriendOverlay.prototype.createDiv = function(friend) {
	var thisoverlay = this;

	// create a DOM element and put it into one of the map panes
	var div = jQuery('<div class="statbox"></div>');

	// var div = jQuery('<DIV class="statbox"></DIV>');
	this.div = div;

	div.css("border", "none");
	div.css("borderWidth", "0px");
	div.css("position", "relative");
	// div.style.width="100px";
	// div.style.height="100px";

	var boxopacity = $.jStorage.get("config_boxopacity", 100);
	var boxbgopacity = $.jStorage.get("config_boxbgopacity", 80);
	var boxbgcolor = com.greenalp.tracking.util.getURLParameter("locationdetailsbgcolor")

	if (boxbgcolor == null || boxbgcolor == "") {
		boxbgcolor = "orange";
	}

	if (com.greenalp.tracking.util.getURLParameter("locationdetailsopacity") != null) {
		if (!isNaN(parseInt(com.greenalp.tracking.util.getURLParameter("locationdetailsopacity")))) {
			boxopacity = parseInt(com.greenalp.tracking.util.getURLParameter("locationdetailsopacity"));
		}
	}

	if (com.greenalp.tracking.util.getURLParameter("locationdetailsbgopacity") != null) {
		if (!isNaN(parseInt(com.greenalp.tracking.util.getURLParameter("locationdetailsbgopacity")))) {
			boxbgopacity = parseInt(com.greenalp.tracking.util.getURLParameter("locationdetailsbgopacity"));
		}
	}

	div.css("minWidth", "200px");
	div.css("minHeight", "26px");
	div.css("cursor", "text");

	this.innerdiv = jQuery('<div style="position:relative;z-Index:1" id="statinnerdiv"></div>');
	this.div.append(this.innerdiv);

	this.contentdiv = jQuery('<div style="position:relative;z-Index:1" id="statcontentdiv"></div>');
	this.statdiv = jQuery('<div style="position:relative;z-Index:1" id="statdiv"></div>');
	this.backgrounddiv = jQuery('<div style="position:absolute;top:0px;left:0px;right:0px;bottom:0px;z-Index:0" id="statbgdiv"></div>');

	this.contentdiv.addClass("roundedDiv");
	this.statdiv.addClass("roundedDiv");
	this.backgrounddiv.addClass("roundedDiv");

	this.backgrounddiv.css("background", boxbgcolor);

	this.backgrounddiv.css("opacity", "" + boxbgopacity / 100);
	this.contentdiv.css("opacity", "" + boxopacity / 100);

	this.statitemvals = new Array();

	var outerthis = this;

	function addStatItem(statId, caption, domValue, showCaption) {
		if (domValue == null) {
			outerthis.statitemvals[statId] = jQuery("<span></span>");
		} else {
			outerthis.statitemvals[statId] = domValue;
		}

		var display = thisoverlay.isStatItemDisplayed(friend, statId);

		var item = jQuery('<div class="statitem" id="' + statId + '" style="white-space:nowrap;display:' + (display ? "block" : "none") + '"><span '
				+ (!showCaption ? 'style="display:none"' : '') + '>' + caption + '</span>' + (showCaption ? ": " : "") + '</div>');
		item.append(outerthis.statitemvals[statId]);
		outerthis.statdiv.append(item);

		return item;
	}

	// icons begin
	var closediv = jQuery('<img src="res/closewindow16.png" title="Close" style="position:absolute;right:0px;cursor:pointer;float:right;z-Index:2;margin:2px 2px;"/>');
	closediv.click(function() {
		com.greenalp.tracking.removeFriendOverlay();
	});
	this.innerdiv.append(closediv);

	// closediv is absolute and above all layers
	// create place for current div so no margins have to be set
	this.statdiv.append('<div style="width:22px;height:16px;display:inline;float:right;"></div>');

	if (com.greenalp.tracking.util.getURLParameter("showsettingsicon") != "0") {
		var configureDiv = jQuery('<img src="res/settings.png" title="Display settings" style="opacity:1.0;cursor:pointer;float:right;height:18px;width:18px;margin:1px 2px;"/>');
		configureDiv.click(function() {
			thisoverlay.configureDisplay(friend);
		});
		this.statdiv.append(configureDiv);
	}

	if (com.greenalp.tracking.util.getURLParameter("showgeofenceicon") != "0") {

		var geofenceDiv = jQuery('<img src="res/geofence.png" title="Add geo-fence around location" style="opacity:1.0;cursor:pointer;float:right;height:18px;width:18px;margin:1px 2px;"/>');
		geofenceDiv.click(function() {
			com.greenalp.tracking.addGeofenceAroundLocation(friend.data.lastposition.lat, friend.data.lastposition.lon, "Geo-fence @"
					+ com.greenalp.tracking.util.roundNumber(friend.data.lastposition.lat, 4) + ","
					+ com.greenalp.tracking.util.roundNumber(friend.data.lastposition.lon, 4), friend.data.username);
		});
		this.statdiv.append(geofenceDiv);
	}

	// icons end

	var firstDiv = addStatItem("statuser", "User", null, true);
	if (firstDiv != null) {
		firstDiv.css("margin-right", "70px");

		if (firstDiv.css("display") == "none") {
			firstDiv.after('<div style="clear:both"> </div>');
		}
	}

	addStatItem("statsendtime", "Send time", null, true);
	addStatItem("statalt", "Elevation", null, true);
	addStatItem("statacc", "Accuracy", null, true);
	addStatItem("statdir", "Direction", null, true);
	addStatItem("statspeed", "Speed", null, true);
	addStatItem("statbatlevel", "Battery", null, true);
	addStatItem("statbattemp", "Battery Temp.", null, true);
	addStatItem("statpos", "Position", null, true);

	var focus = com.greenalp.tracking.createCheckboxInputnode(friend);
	focus.css("cursor", "default");
	addStatItem("statfocus", "Auto Focus", focus, true);

	addStatItem("statmsg", "Message", null, true);

	var inputnode = com.greenalp.tracking.createMessageInputnode(friend.data.userId);
	jQuery(inputnode).Watermark("enter your message");
	jQuery(inputnode).width("90%");
	jQuery(inputnode).click(function() {
		jQuery(inputnode).focus();
	});

	// this.bubbleEvent(inputnode);
	addStatItem("statmsginput", "Input Message", inputnode, false);

	this.innerdiv.append(this.backgrounddiv);
	this.innerdiv.append(this.contentdiv);

	this.contentdiv.append(this.statdiv);

	this.bubbleEvent(this.div);

};

com.greenalp.tracking.FriendOverlay.prototype.isStatItemDisplayed = function(friend, statItemId) {
	var display = typeof friend[statItemId] === "undefined" || friend[statItemId] == true;

	if (display) {
		display = $.jStorage.get("config_" + statItemId, "true") == "true";
	}

	if (display) {
		display = (com.greenalp.tracking.util.getURLParameter(statItemId) != "0");
	}

	return display;
};

com.greenalp.tracking.FriendOverlay.prototype.refreshFriend = function() {
	if (this.friend == null) {
		// this.removeDiv();
		return;
	} else {
		var friend = this.friend;

		var thisoverlay = this;
		thisoverlay = 1 == 2 ? thisoverlay : thisoverlay; // pseudo to remove warning

		if (friend.data.lastposition != null) {
			var p = friend.data.lastposition;

			this._overlayHandler.setPosition(p);

			var lat = parseFloat(p.lat);
			var lon = parseFloat(p.lon);

			var timediffClient = com.greenalp.tracking.util.roundNumber((friend.data.curServerTime - p.clientTime) / 1000, 1);

			var statuserText = this.friend.data.nickname;
			var sig = statuserText;
			if (friend.data.lastPrivateClientTime != null && friend.data.lastPrivateClientTime > 0) {
				// check if last point or some track segments are affected
				if (friend.data.lastposition != null && friend.data.lastposition.clientTime < friend.data.lastPrivateClientTime) {
					var privateRegionTitle = 'Latest location invisible (user has set private region).';
					statuserText += '<img id="imgprivateregion" style="position:relative;height:20px;top:2px;margin:0px 4px 0px 2px" src="res/private_region_lasttp.png" title="'
							+ privateRegionTitle + '"/>';
					sig += "lastPointPrivate";
				} else {
					// check track segments
					// var trackId = com.greenalp.tracking.getTrackId(friend.data.userId, true);
					// var autotrack = com.greenalp.tracking.trackmap[trackId];
					// if (autotrack != null && autotrack.trackdata.length > 0 && autotrack.trackdata[0].clientTime < friend.data.lastPrivateClientTime) {
					// var privateRegionTitle = 'Some track segments hidden (user has set private region).';
					// statuserText += '<img id="imgprivateregion" style="position:relative;height:20px;top:2px;margin:0px 4px 0px 2px" src="res/donut.png"
					// title="'
					// + privateRegionTitle + '"/>';
					//
					// sig += "anyPointPrivate";
					// }
				}
			}

			var initUser = !("statuser" in this.statitemvals) || this.statitemvals["statuser"].find("#imgprivateregion").prop("greenalpnickname") != sig;

			if (initUser) {
				this.statitemvals["statuser"].html(statuserText);
				this.statitemvals["statuser"].find("#imgprivateregion").tooltip();
				this.statitemvals["statuser"].find("#imgprivateregion").prop("greenalpnickname", sig);
			}

			this.statitemvals["statsendtime"].text(com.greenalp.tracking.util.getAge(timediffClient, false) + " ago");
			this.statitemvals["statalt"].text(com.greenalp.tracking.util.getElevationString(p.alt, com.greenalp.tracking.unit));
			this.statitemvals["statacc"].text(com.greenalp.tracking.util.roundNumber(p.acc, 1) + " m");
			this.statitemvals["statdir"].text(com.greenalp.tracking.util.roundNumber(p.bea, 1) + "° (" + com.greenalp.tracking.util.getDirection(p.bea) + ")");
			this.statitemvals["statspeed"].text(com.greenalp.tracking.util.getSpeedString(p.speed, com.greenalp.tracking.unit));
			if (friend.data.batteryInfo != null && friend.data.batteryInfo.chargeLevel > 0) {
				var temptext = "";
				if (typeof friend.data.batteryInfo.temperature !== "undefined") {
					temptext = com.greenalp.tracking.util.getTemperatureString(friend.data.batteryInfo.temperature, com.greenalp.tracking.unit);
				}

				var batteryImageCode = '';

				if (friend.data.batteryInfo.charging != null) {
					var batteryImage = "arrow_red_down.png";
					var batteryTitle = "Battery is discharging";

					if (friend.data.batteryInfo.charging) {
						batteryImage = "arrow_green_up.png";
						batteryTitle = "Battery is charging";

					}
					batteryImageCode = '<img id="imgcharging" style="position:relative;height:12px;top:2px;margin:0px 4px 0px 2px" src="res/' + batteryImage
							+ '" title="' + batteryTitle + '"/>';

				}

				var batteryText = '<span>' + friend.data.batteryInfo.chargeLevel + " %" + batteryImageCode + " </span> ("
						+ com.greenalp.tracking.util.getAge((friend.data.curServerTime - friend.data.batteryInfo.serverTime) / 1000, true) + " ago" + ")";

				var sig = batteryText;

				var initBattery = !("statbatlevel" in this.statitemvals)
						|| this.statitemvals["statbatlevel"].find("#imgcharging").prop("greenalpcontentsig") != sig;

				if (initBattery) {
					this.statitemvals["statbatlevel"].html(batteryText);
					this.statitemvals["statbatlevel"].find("#imgcharging").tooltip();
					this.statitemvals["statbatlevel"].find("#imgcharging").prop("greenalpcontentsig", sig);
				}

				this.statitemvals["statbattemp"].text(temptext);
			}

			var coords = '<a target="googlemaps" href="http://maps.google.com/maps?q=' + lat + ',' + lon + '">'
					+ com.greenalp.tracking.util.roundNumber(lat, 4) + ", " + com.greenalp.tracking.util.roundNumber(lon, 4) + '</a>';
			this.statitemvals["statpos"].html(coords);

			this.statitemvals["statmsg"].text(friend.data.message);

		}
	}
};

com.greenalp.tracking.FriendOverlay.prototype.addAutoTrackSlider = function(parent) {

	var trackId = com.greenalp.tracking.getTrackId(this.friend.data.userId, true);
	var autotrack = com.greenalp.tracking.trackmap[trackId];

	var slideUnitInMs = 15 * 60 * 1000;
	var minValue = 0;
	var maxValue = 1;

	var mode = "timeoffset";

	if (mode == "size") {
		maxValue = autotrack.trackdataOrig.length - 1;
	} else if (mode == "timeoffset") {
		maxValue = (1000 * 3600 * 24 * 2) / slideUnitInMs;
	}

	var value = maxValue;

	var sliderDiv = $('<div class="roundedDiv" style="height:12px"><div style="line-height:1em;font-size:1em;">Track length</div></div>');
	sliderDiv.width(parent.width() - 12);
	sliderDiv.css("cursor", "default");
	sliderDiv.slider({
		animate : true,
		min : minValue - 1,
		max : maxValue + 10,
		value : value
	});
	parent.append(sliderDiv);

	var slideBlock = jQuery('<div style="font-size:1em;white-space:nowrap;top:0px; left:20px;" class="ui-tooltip ui-widget ui-corner-all ui-widget-content">'
			+ value + '</div>');
	slideBlock.css("display", "none");
	var slideBlockReal = sliderDiv.find("a");

	slideBlockReal.css("position", "absolute");
	slideBlockReal.css("height", "16px");

	slideBlockReal.css("cursor", "pointer");
	slideBlock.css("cursor", "pointer");

	slideBlockReal.append(slideBlock);

	function onSliderChange(slider, event, ui, updateCaptionOnly) {
		var value = jQuery(slider).slider("option", "value");

		if (value < minValue) {
			value = minValue;
		}

		if (value > maxValue) {
			value = maxValue;
		}

		if (autotrack.trackdataOrig.length == 0) {
			return;
		}

		var selectFn = null;

		var slideBlockCaption = "";
		if (mode == "size") {
			slideBlockCaption = value;
			var startIdx = autotrack.trackdataOrig.length - value;
			if (startIdx < 0) {
				startIdx = 0;
			}
			selectFn = function(idx, trackpoint) {
				return idx >= startIdx;
			};
		} else if (mode == "timeoffset") {
			function getTimeOffsetMilliseconds(slideUnits) {
				return slideUnits * slideUnitInMs;
			}

			if (value < maxValue) {
				slideBlockCaption = com.greenalp.tracking.util.getAge(getTimeOffsetMilliseconds(value) / 1000, false);
			}

			var maxValueReached = value >= maxValue;
			if (maxValueReached) {
				slideBlockCaption = "maximum length";
			}

			var lastTrackpoint = autotrack.trackdataOrig[autotrack.trackdataOrig.length - 1];

			selectFn = function(idx, trackpoint) {
				return maxValueReached || lastTrackpoint.clientTime - trackpoint.clientTime < getTimeOffsetMilliseconds(value);
			};
		}

		slideBlock.html(slideBlockCaption + "");
		slideBlock.css("display", "block");

		if (value < 1 || value > maxValue) {
			// return;
		}

		if (!updateCaptionOnly && autotrack != null) {
			autotrack.rebuildTrack(selectFn);
		}
	}

	sliderDiv.on("slidechange", function(event, ui) {
		slideBlock.css("display", "none");
		// onSliderChange (this, event, ui, false);
	});

	sliderDiv.on("slide", function(event, ui) {
		onSliderChange(this, event, ui, false);
	});
};

com.greenalp.tracking.FriendOverlay.prototype.addTransparancySlider = function(parent, statbox, bgbox) {

	var minValue = 0;
	var maxValue = 100;

	var boxvalue = $.jStorage.get("config_boxopacity", 100);
	var boxbgvalue = $.jStorage.get("config_boxbgopacity", 80);

	var values = [ boxvalue, boxbgvalue ];

	var sliderDiv = $('<div id="transslider" class="roundedDiv" style="height:12px"><div style="line-height:1em;font-size:1em;">Transparency</div></div>');

	sliderDiv.width(parent.width() - 12);
	sliderDiv.css("cursor", "default");
	sliderDiv.slider({
		animate : true,
		min : minValue - 1,
		max : maxValue + 1,
		values : values
	});
	parent.append(sliderDiv);

	var slideBlock = jQuery('<div style="font-size:1em;white-space:nowrap;top:0px; left:20px;" class="ui-tooltip ui-widget ui-corner-all ui-widget-content">'
			+ values + '</div>');
	slideBlock.css("display", "none");
	var slideBlockReal = sliderDiv.find("a");

	slideBlockReal.css("position", "absolute");
	slideBlockReal.css("height", "16px");
	slideBlockReal.css("zIndex", "1");

	slideBlockReal.css("cursor", "pointer");
	slideBlock.css("cursor", "pointer");

	slideBlockReal.append(slideBlock);
	sliderDiv.bind("slide", function(event, ui) {
		var values = jQuery(this).slider("option", "values");

		boxValue = values[0];
		boxbgvalue = values[1];

		if (boxbgvalue < 0) {
			boxbgvalue = 0;
		}
		if (boxValue < 20) {
			boxValue = 20;
		}

		if (boxbgvalue > maxValue) {
			boxbgvalue = maxValue;
		}
		if (boxValue > maxValue) {
			boxValue = maxValue;
		}

		$.jStorage.set("config_boxopacity", boxValue);
		$.jStorage.set("config_boxbgopacity", boxbgvalue);
		statbox.css("opacity", boxValue / 100);
		bgbox.css("opacity", boxbgvalue / 100);
	});
};

com.greenalp.tracking.FriendOverlay.prototype.addUnitSelection = function(parent) {
	var value = com.greenalp.tracking.unit;

	var unitSelect = jQuery('<select>' + '<option value="imperial">Imperial</option>' + '<option value="metric">Metric</option>'
			+ '<option value="all">Both</option>' + '</span>');

	unitSelect.val(value);

	var that = this;

	unitSelect.change(function() {
		com.greenalp.tracking.unit = unitSelect.val();
		$.jStorage.set("config_unit", com.greenalp.tracking.unit);

		that.refreshFriend();
	});

	var unitDiv = jQuery('<div><span>Preferred unit</span> </div>');
	unitDiv.append(unitSelect);

	parent.append(unitDiv);
};

com.greenalp.tracking.FriendOverlay.prototype.configureDisplay = function(friend) {
	var that = this;
	this.statdiv.css("display", "none");
	var confDiv = jQuery('<div style="position:relative;z-Index:1" id="statconf"></div>');
	this.contentdiv.append(confDiv);
	confDiv.append('<div>Fields to be displayed:</div>');

	var table = jQuery('<table></table>');
	confDiv.append(table);

	var tr = null;

	this.statdiv.find(".statitem").each(function(index, element) {
		if (index % 2 == 0) {
			tr = jQuery('<tr></tr>');
			table.append(tr);
		}

		var td = jQuery('<td></td>');
		tr.append(td);

		var display = $.jStorage.get("config_" + element.id, "true");

		var cbox = $('<input type="checkbox" style="cursor:default" id="cbconfig' + element.id + '"></input> ');
		if (display == "true") {
			cbox.prop("checked", true);
		} else {
			cbox.prop("checked", false);
		}

		display = cbox.prop('checked');
		cbox.data("checkedCustom", display);

		var div = $('<div style="white-space:nowrap"></div>');
		td.append(div);

		div.append(cbox);
		div.append(jQuery(element).children().first().text());

		cbox.click(function() {
			var ablauf = new Date();
			var exTime = ablauf.getTime() + (7 * 24 * 60 * 60 * 1000);
			ablauf.setTime(exTime);

			var display = !cbox.data("checkedCustom");
			cbox.data("checkedCustom", display);
			cbox.prop('checked', display);

			$.jStorage.set("config_" + element.id, (display ? "true" : "false"));

			var displayElement = that.isStatItemDisplayed(friend, element.id);

			if (displayElement) {
				element.style.display = "block";
			} else {
				element.style.display = "none";
			}

		});

	});

	var closeConfigButton = jQuery('<input type="submit" style="padding-left:20px;padding-right:20px" value="Close"/>');

	confDiv.append('<div style="height:6px"/>');
	this.addUnitSelection(confDiv);

	confDiv.append('<div style="height:6px"/>');
	this.addAutoTrackSlider(confDiv);

	confDiv.append('<div style="height:6px"/>');
	this.addTransparancySlider(confDiv, this.contentdiv, this.backgrounddiv);

	confDiv.append('<div style="height:10px"/>');

	var outerthis = this;
	closeConfigButton.click(function() {
		confDiv.remove();
		outerthis.statdiv.css("display", "block");
	});
	confDiv.append(closeConfigButton);
	this.div.css("display", "block");

};

com.greenalp.tracking.FriendOverlay.prototype.bubbleEvent = function(div) {

	div.click(function(e) {
		e.stopPropagation();
	});
	div.dblclick(function(e) {
		e.stopPropagation();
	});
	div.mousedown(function(e) {
		e.stopPropagation();
	});
	div.mouseenter(function(e) {
		e.stopPropagation();
	});
	div.mouseleave(function(e) {
		e.stopPropagation();
	});

	// div.mousemove(function(e) { e.stopPropagation();});

	div.mouseout(function(e) {
		e.stopPropagation();
	});
	div.mouseover(function(e) {
		e.stopPropagation();
	});

};if (typeof com === 'undefined') {
	com = {};
}

if (typeof com.greenalp === 'undefined') {
	com.greenalp = {};
}

com.greenalp.tracking.showMapNotification = function(message) {
	com.greenalp.tracking.removeMapNotification();
	jQuery("#mapposworkaround").prepend(
			'<div style="background:#FFFFCC;padding-left:10px" id="mapnotificationbar"><strong>' + message
					+ ' <a style="cursor:pointer" onclick="jQuery(\'#mapnotificationbar\').remove();">Dismiss</a></strong></div>');
};

com.greenalp.tracking.removeMapNotification = function() {
	jQuery('#mapnotificationbar').remove();
};

com.greenalp.tracking.updatePosition = function() {
	var trackingInstance = this;

	if (!trackingInstance.mapInitialized) {
		jQuery.ajaxSetup({
			timeout : 60000
		});

		trackingInstance.showLocationDetails = com.greenalp.tracking.util.getURLParameter("locationdetails");
		trackingInstance.showTrackDetails = (com.greenalp.tracking.util.getURLParameter("trackdetails") != "0");

		this.demouser = com.greenalp.tracking.util.getURLParameter("viewuser") == "demouser";

		var mapType = "roadmap";// google.maps.MapTypeId.ROADMAP;
		var pMapType = com.greenalp.tracking.util.getURLParameter("maptype");
		if (pMapType == "terrain") {
			mapType = "terrain";
		} else if (pMapType == "satellite") {
			mapType = "satellite";
		} else if (pMapType == "hybrid") {
			mapType = "hybrid";
		}

		var showTraffic = com.greenalp.tracking.util.getURLParameter("traffic") == "1";

		var defaultZoomLevel = 13;
		var zoomLevel = defaultZoomLevel;
		var pZoom = com.greenalp.tracking.util.getURLParameter("zoom");
		if (pZoom != null) {
			pZoom = Number(pZoom);

			if (!isNaN(pZoom)) {
				zoomLevel = pZoom;
			}
		}

		var fromMillis = -1;
		var untilMillis = -1;

		var pStartDate = com.greenalp.tracking.util.getURLParameter("starttime");
		if (pStartDate == null) {
			pStartDate = com.greenalp.tracking.util.getURLParameter("startdate");
		}

		if (pStartDate != null && pStartDate != "" && !isNaN(pStartDate)) {
			while (pStartDate.length < 14) {
				pStartDate += "0";
			}
			pStartDate = pStartDate.substr(0, 14);
			fromMillis = Date.UTC(Number(pStartDate.substr(0, 4)), Number(pStartDate.substr(4, 2)) - 1, Number(pStartDate.substr(6, 2)), Number(pStartDate
					.substr(8, 2)), Number(pStartDate.substr(10, 2)), Number(pStartDate.substr(12, 2)));

		}

		var pEndDate = com.greenalp.tracking.util.getURLParameter("endtime");

		if (pEndDate == null) {
			pEndDate = com.greenalp.tracking.util.getURLParameter("enddate");
		}

		if (pEndDate != null && pEndDate != "" && !isNaN(pEndDate)) {
			while (pEndDate.length < 14) {
				pEndDate += "0";
			}
			pEndDate = pEndDate.substr(0, 14);
			untilMillis = Date.UTC(Number(pEndDate.substr(0, 4)), Number(pEndDate.substr(4, 2)) - 1, Number(pEndDate.substr(6, 2)), Number(pEndDate
					.substr(8, 2)), Number(pEndDate.substr(10, 2)), Number(pEndDate.substr(12, 2)));

		}

		if (fromMillis > 0 && untilMillis > 0) {
			trackingInstance.trackFrom = fromMillis;
			trackingInstance.trackUntil = untilMillis;
		}

		var myOptions = {
			zoom : zoomLevel,
			mapTypeControlOptions : {
			// style : google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			scaleControl : true,
			center : {
				"lon" : 0,
				"lat" : 0
			},
			mapTypeId : mapType
		};

		trackingInstance.map = new com.greenalp.maps.Map("map_canvas", myOptions);

		var extensionOptions = {
			showTraffic : showTraffic
		};
		var extensions = new com.greenalp.maps.MapExtension(trackingInstance.map, extensionOptions);

		// workaround for facebook like button conflict with google maps
		jQuery(document).ready(function() {
			window.setTimeout(function() {
				if ((typeof FB != "undefined") && (typeof FB.XFBML != "undefined")) {
					FB.XFBML.parse();
				}
			}, 4000);
		});

		// adsense code after position is set

		trackingInstance.map.setEventListener('dragstart', function() {
			trackingInstance.disableAutoFocus();
		});

		trackingInstance.map.configureContextMenu(trackingInstance.showContextMenu);

		// Create the DIV to hold the control and call the HomeControl()
		// constructor
		// passing in this DIV.
		// var homeControlDiv = document.createElement('DIV');
		// new trackingInstance.mapcontrol(homeControlDiv, trackingInstance.map);

		// homeControlDiv.index = 1;
		// trackingInstance.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);

		trackingInstance.mapInitialized = true;

		if (this.demouser) {
			com.greenalp.tracking.initDemoUserData();
		}

		trackingInstance.updatePosition();

		window.setTimeout("com.greenalp.tracking.startIEWorkaround()", 10000);
		window.setTimeout("com.greenalp.tracking.startIconWatchdog(1)", 11000);

	} else {
		if (trackingInstance.demouser) {
			trackingInstance.demoUserAction();
			return;
		}

		trackingInstance.updateCounter++;
		if (trackingInstance.updateInProgress) {
			trackingInstance.updateCounter--;
			return;
		}

		var now = new Date().getTime();
		if (now - trackingInstance.lastUpdateTime < trackingInstance.updateInterval - 50) { // 50ms
			// tolerance
			trackingInstance.updateCounter--;
			return;
		}
		trackingInstance.lastUpdateTime = now;

		var url = "CurrentPosition.php?action=updatePos&changedafter=" + trackingInstance.serverTimeDataChanged;

		if (!trackingInstance.tracksInitialized) {
			url += "&init=1";

			if (trackingInstance.trackFrom > 0 && trackingInstance.trackUntil > 0) {
				url += "&from=" + trackingInstance.trackFrom;
				url += "&until=" + trackingInstance.trackUntil;
			}

			var pMaxTrackSize = com.greenalp.tracking.util.getURLParameter("maxtracksize");
			if (pMaxTrackSize != null && pMaxTrackSize != "" && !isNaN(pMaxTrackSize)) {
				url += "&maxtracksize=" + pMaxTrackSize;
			}

			trackingInstance.tracksInitialized = true;
		} else {
			if ((trackingInstance.stopUpdate) || (trackingInstance.trackUntil > 0 && trackingInstance.trackUntil < trackingInstance.serverTimeDataChanged)) {
				trackingInstance.updateCounter--;
				trackingInstance.stopInterval();
				return;
			}
		}

		// set progress flag before starting async request
		trackingInstance.updateInProgress = true;
		trackingInstance.updateRequestTime = new Date().getTime();

		jQuery.ajax({
			url : url,
			dataType : "json",
			success : function(friendsData) {
				updateErrors = 0;
				if (friendsData == null) {
					trackingInstance.updateInProgress = false;
					trackingInstance.updateCounter--;
					return;
				}

				if (friendsData.error != null) {
					alert(friendsData.error);
					trackingInstance.updateInProgress = false;
					trackingInstance.updateCounter--;

					if (friendsData.unrecoverableError) {
						trackingInstance.stopInterval();
					}

					if (friendsData.reloadPage) {
						window.location.reload();
					}

					if (friendsData.logoutUser) {
						document.location.href = "index.php?page=logout";
					}

					return;
				}

				if ((typeof friendsData.stopUpdate !== "undefined") && friendsData.stopUpdate) {
					trackingInstance.stopUpdate = true;
				}

				if (friendsData.updateInterval != null && friendsData.updateInterval != trackingInstance.updateInterval) {
					trackingInstance.updateInterval = friendsData.updateInterval;
					trackingInstance.stopInterval();
					trackingInstance.startInterval();
				}

				com.greenalp.tracking.updateLocationHandler(friendsData);

				trackingInstance.serverTimeDataChanged = friendsData.curServerTime;
				trackingInstance.updateCounter--;
				trackingInstance.updateInProgress = false;
			},
			error : function(data) {
				trackingInstance.updateCounter--;
				trackingInstance.updateInProgress = false;
				trackingInstance.updateErrors++;
				if (trackingInstance.updateErrors > 50) {
					window.location.reload();
				}
			}

		});
	}
};

com.greenalp.tracking.updateLocationHandler = function(friendsData) {
	var trackingInstance = com.greenalp.tracking;

	// handle guest mode toggling
	if (friendsData.userdata != null && friendsData.userdata.length == 0) {
		trackingInstance.mapcenterInitialized = false;
	}

	// handle kmloverlay
	if (friendsData.kmloverlaydata != null && friendsData.kmloverlaydata.overlays != null) {
		for (var i = 0; i < friendsData.kmloverlaydata.overlays.length; i++) {
			var kmlData = friendsData.kmloverlaydata.overlays[i];
			if (kmlData.url != null && kmlData.url.length > 0) {
				var url = kmlData.url;
				if (url.indexOf("?") < 0) {
					url += "?";
				} else if (url.charAt(url.length - 1) != "&" && url.charAt(url.length - 1) != "?") {
					url += "&";
				}
				url += "greenalpVersion=" + new Date().getTime();

				trackingInstance.map.addKmlLayer(url);

			}
		}
	}

	// var newFriends = new Array();

	var friendsChanged = false;

	var friendToCenter = null;
	for (var i = 0; i < friendsData.userdata.length; i++) {
		var newData = friendsData.userdata[i];
		var friend = null;
		var oldData = null;
		var updateIcon = false;

		// search data
		for (var j = 0; j < trackingInstance.friends.length; j++) {
			var tempOldFriend = trackingInstance.friends[j];

			if (newData.userId == tempOldFriend.data.userId) {
				friend = tempOldFriend;
				oldData = tempOldFriend.data;

				// server time must be set on two lines
				oldData.curServerTime = friendsData.curServerTime;
				break;
			}
		}

		if (oldData != null && newData.iconVersion != null) {
			updateIcon = oldData.iconVersion == null || newData.iconVersion != oldData.iconVersion;
			oldData.iconVersion = newData.iconVersion;
			// case oldData == null will be handled below because dataChanged is true in this case.
		}

		if (newData.dataChanged != null && newData.dataChanged) {

			if (oldData != null && newData != null) {
				if (oldData.batteryInfo != null && newData.batteryInfo == null) {
					newData.batteryInfo = oldData.batteryInfo;
				}

				// TODO: Check handling in app
				// lastTrackpoint could be null due to privacy settings
				if (oldData.lastposition != null && newData.lastposition == null) {
					newData.lastposition = oldData.lastposition;
				}

				// preserve the high lastPrivateClientTimeTimestamp except the new data contains complete track
				if ((newData.autotrackcomplete == null || !newData.autotrackcomplete) && oldData.lastPrivateClientTime != null
						&& (newData.lastPrivateClientTime == null || oldData.lastPrivateClientTime > newData.lastPrivateClientTime)) {
					newData.lastPrivateClientTime = oldData.lastPrivateClientTime;
				}

			}

			if (friend == null) {
				friend = new Object();

				// cache the maxTrackSize. It is set only one time.
				friend.maxTrackSize = (typeof newData.maxTrackSize !== "undefined") ? newData.maxTrackSize : 1000;

				var filterLocationDetails = com.greenalp.tracking.util.getURLParameter("locationdetailsfilter");
				// show items by default

				friend.statuser = ((typeof newData.showUsername !== "undefined") ? newData.showUsername : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showusername") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showusername") != "0"));

				friend.statsendtime = ((typeof newData.showSendTime !== "undefined") ? newData.showSendTime : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showsendtime") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showsendtime") != "0"));

				friend.statalt = ((typeof newData.showElevation !== "undefined") ? newData.showElevation : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showelevation") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showelevation") != "0"));

				friend.statacc = ((typeof newData.showAccuracy !== "undefined") ? newData.showAccuracy : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showaccuracy") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showaccuracy") != "0"));

				friend.statdir = ((typeof newData.showDirection !== "undefined") ? newData.showDirection : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showdirection") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showdirection") != "0"));

				friend.statspeed = ((typeof newData.showSpeed !== "undefined") ? newData.showSpeed : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showspeed") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showspeed") != "0"));

				friend.statbatlevel = ((typeof newData.showBatteryLevel !== "undefined") ? newData.showBatteryLevel : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showbatterylevel") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showbatterylevel") != "0"));

				friend.statbattemp = ((typeof newData.showBatteryTemperature !== "undefined") ? newData.showBatteryTemperature : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showbatterytemperature") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showbatterytemperature") != "0"));

				friend.statpos = ((typeof newData.showCoordinates !== "undefined") ? newData.showCoordinates : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showcoordinates") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showcoordinates") != "0"));

				friend.statfocus = ((typeof newData.showAutoCenter !== "undefined") ? newData.showAutoCenter : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showautocenter") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showautocenter") != "0"));

				friend.statmsg = ((typeof newData.showMessage !== "undefined") ? newData.showMessage : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showmessage") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showmessage") != "0"));

				friend.statmsginput = ((typeof newData.showMessageInput !== "undefined") ? newData.showMessageInput : true)
						&& ((filterLocationDetails != 1 && filterLocationDetails != 2)
								|| (filterLocationDetails == 1 && com.greenalp.tracking.util.getURLParameter("showmessageinput") == "1") || (filterLocationDetails == 2 && com.greenalp.tracking.util
								.getURLParameter("showmessageinput") != "0"));

				// need to be set here because will be needed by accuracy circle constructor
				friend.data = newData;

				friend.accuracyCircle = new com.greenalp.maps.Circle({
					fillOpacity : 0.2,
					strokeOpacity : 0.5,
					strokeWeight : 1.0,
					friend : friend
				// ,
				// map : trackingInstance.map
				});
				friend.accuracyCircle.clickable = false;

				// init variables. store signature of current icon to know when to change
				friend.iconSig = null;
				friend.statusPrivateRegion = false;
				friend.cachedDozeModeInfo = null;
				friend.marker = null;
				friend.infoWindow = null;
				friend.autoFocus = false;
				friendsChanged = true;

				// get next color and increase counter
				friend.trackcolor = com.greenalp.tracking.Track.colors[com.greenalp.tracking.Track.colorIndex % com.greenalp.tracking.Track.colors.length];
				com.greenalp.tracking.Track.colorIndex++;
				trackingInstance.friends.push(friend);
			}

			friend.data = newData;

			// server time must be set on two lines
			friend.data.curServerTime = friendsData.curServerTime;

			if (friend.data.message == null) {
				friend.data.message = "";
			}
			// newFriends.push(friend);

			// update friends data

			if (friend.marker == null) {

				// ensure that marker is set before icon callback called
				friend.marker = new com.greenalp.maps.Marker({
					position : {
						"lon" : 0,
						"lat" : 0
					},
					// map: map,
					icon : null,
					friend : friend
				});

				if (trackingInstance.showLocationDetails != "0") {
					// user has not deactivated marker click.
					trackingInstance.setMarkerClick(friend);
				}
				updateIcon = true;
			}

			// if (friend.data.icon) {

			friend.statusPrivateRegion = false;
			if (friend.data.lastPrivateClientTime != null && friend.data.lastPrivateClientTime > 0) {
				// check if last point or some track segments are affected
				if (friend.data.lastposition != null && friend.data.lastposition.clientTime < friend.data.lastPrivateClientTime) {
					friend.statusPrivateRegion = true;
				} else {
					// check track segements
					// var trackId = com.greenalp.tracking.getTrackId(friend.data.userId, true);
					// var autotrack = com.greenalp.tracking.trackmap[trackId];
					// if (autotrack != null && autotrack.trackdata.length > 0 && autotrack.trackdata[0].clientTime < friend.data.lastPrivateClientTime) {
					// statusIcon = "res/donut.png";
					// }
				}
			}

			if (friend.data.dozeModeInfo != null) {
				friend.cachedDozeModeInfo = friend.data.dozeModeInfo;
			}

			var iconSig = friend.data.icon + " " + friend.statusPrivateRegion + " "
					+ (friend.cachedDozeModeInfo != null ? (friend.cachedDozeModeInfo.dozeModeActive + friend.cachedDozeModeInfo.clientTime) : "null");

			updateIcon = updateIcon || (friend.iconSig != iconSig);
			friend.iconSig = iconSig;

			// } //end if friend.data.icon

			if (friend.data.lastposition != null) {
				var p = friend.data.lastposition;

				var oldTrackpoint = null;
				if (oldData != null && oldData.lastposition != null) {
					oldTrackpoint = oldData.lastposition;
				}

				if (oldTrackpoint == null || oldTrackpoint.lat != p.lat || oldTrackpoint.lon != p.lon || oldTrackpoint.acc != p.acc) {
					friend.marker.setPosition(p);

					if (friend.marker.getMap() == null) {
						// will be set below
						// friend.marker.setMap(trackingInstance.map);
					}
					friend.accuracyCircle.setOptions({
						center : p,

						fillColor : (friend.data.lastposition.provider == "gps" ? "#5555FF" : "#33FF33"),
						strokeColor : (friend.data.lastposition.provider == "gps" ? "#5555FF" : "#33FF33"),

						// * (1 /
						// Math.cos(friend.data.lastposition.lat *
						// Math.PI / 180)),
						radius : friend.data.lastposition.acc
					// ,
					// map : trackingInstance.map
					});

				}
			} else {
				// if track is complete and still no update remove marker from map
				if (typeof friend.data.autotrackcomplete !== "undefined" && friend.data.autotrackcomplete) {
					friend.marker.setMap(null);
				}
			}

			// if (friend.data.trackpoints.length > 1) {
			if (typeof friend.data.autotrackcomplete !== "undefined" && friend.data.autotrackcomplete) {
				// it's a full re-init
				var trackId = trackingInstance.getTrackId(friend.data.userId, true);
				if (trackId != null) {
					// clear old track. new track will be built in the line below
					com.greenalp.tracking.clearTrack(trackId);
				}
			}

			if (friend.data.trackpoints != null && friend.data.trackpoints.length > 0) {
				if (friend.data.allowsAutoTrack) {
					trackingInstance.addNewTrackpoints(friend);
				}
			}

			if (friend.data.message != "" && (oldData == null || friend.data.message != oldData.message)) {
				// var clientTime = new Date(
				// eval(friend.data.messageclienttime));
				var serverTime = new Date(eval(friend.data.messageservertime));

				trackingInstance.showInfoWindowUserMarkerInternal(friend, trackingInstance.util.formatTime(serverTime) + " " + friend.data.message,
						!com.greenalp.tracking.demouser);

				jQuery("#chatHistoryContent").html(
						jQuery("#chatHistoryContent").html() + "<div>" + com.greenalp.common.escapeHtml(friend.data.nickname) + " => You ("
								+ trackingInstance.util.formatTime(serverTime) + "): " + com.greenalp.common.escapeHtml(friend.data.message) + "</div>");

			}
		}// end if data changed

		if (updateIcon) {
			var iconurl = null;
			var iconWidth = null;
			var iconHeight = null;
			var iconAnchorX = null;
			var iconAnchorY = null;

			// initialize with default values
			iconurl = "res/defaultmarker.png";
			// use only half size for retina displays
			iconWidth = 37;
			iconHeight = 64;

			iconAnchorX = iconWidth / 2;
			iconAnchorY = iconHeight;

			if (friend.data.icon) {
				// for now without version id
				iconurl = com.greenalp.tracking.getFriendCustomIconUrl(friend, false);
			}

			// iconurl was without version id because it should be always the same standard url for signature
			// before icon loaded append the version id
			if (friend.data.icon) {
				iconurl = com.greenalp.tracking.getFriendCustomIconUrl(friend, true);
			}

			var arr = new Array();

			var pic1 = new Object();
			arr.push(pic1);
			pic1.x = 0;
			pic1.y = 0;

			if (friend.data.icon && friend.data.iconwidth != null && friend.data.iconheight != null) {
				iconWidth = friend.data.iconwidth;
				iconHeight = friend.data.iconheight;
				iconAnchorX = friend.data.iconAnchorX;
				iconAnchorY = friend.data.iconAnchorY;

			}

			pic1.width = iconWidth;
			pic1.height = iconHeight;

			pic1.url = iconurl;

			if (friend.statusPrivateRegion) {
				var pic = new Object();
				arr.push(pic);
				pic.width = 32;
				pic.height = 32;
				pic.x = 0;
				pic.y = Math.max(0, iconHeight - pic.height - 8);
				pic.url = "res/private_region_lasttp.png";
			}

			if (friend.cachedDozeModeInfo != null && friend.cachedDozeModeInfo.dozeModeActive) {
				var pic = new Object();
				arr.push(pic);
				pic.width = 32;
				pic.height = 32;
				pic.x = 0;
				pic.y = Math.max(0, iconHeight - pic.height - 8);
				pic.url = "res/icon_hint_doze_mode.png";
			}

			(function(friend, iconurl, iconWidth, iconHeight, iconAnchorX, iconAnchorY) {

				var drawImageHandler = function(url) {
					var icon = null;

					if (iconWidth > 50 || iconHeight > 50) {
						iconWidth /= 2;
						iconHeight /= 2;
						iconAnchorX /= 2;
						iconAnchorY /= 2;
					}

					icon = com.greenalp.tracking.getCustomIcon(url, iconWidth, iconHeight, iconAnchorX, iconAnchorY);
					// }

					// TODO: ensure that marker exists at that momnet. move code below
					friend.marker.setIcon(icon);

				};

				com.greenalp.tracking.drawImage(iconurl, arr, drawImageHandler);
			})(friend, iconurl, iconWidth, iconHeight, iconAnchorX, iconAnchorY);
		}

		if (friend.data.lastposition != null) {
			if (trackingInstance.overlay != null) {
				trackingInstance.overlay.refreshFriend();
			}

			if (friend.marker != null && "onNewTrackpoint" in friend.marker) {
				friend.marker.onNewTrackpoint(friend);
			}

		}

		if (!trackingInstance.mapcenterInitialized) {
			var userToFocus = com.greenalp.tracking.util.getURLParameter("focususer");
			if (userToFocus == friend.data.username) {
				friend.autoFocus = true;
			}
		}

		if (friend.autoFocus) {
			friendToCenter = friend;
		}

	}

	if (friendsData.userdata.length != trackingInstance.friends.length) {
		for (var i = trackingInstance.friends.length - 1; i >= 0; i--) {
			var tempOldFriend = trackingInstance.friends[i];
			var found = false;
			for (var j = 0; j < friendsData.userdata.length; j++) {
				var newData = friendsData.userdata[j];
				if (newData.userId == tempOldFriend.data.userId) {
					found = true;
					break;
				}
			}

			if (!found) {
				trackingInstance.friends.splice(i, 1);
				// remove markers
				if (tempOldFriend.marker != null) {
					tempOldFriend.marker.setMap(null);
				}

				// remove statbox
				if (this.overlay != null && this.overlay.matchesFriend(tempOldFriend)) {
					com.greenalp.tracking.removeFriendOverlay();
				}

				// remove auto track
				var track = trackingInstance.trackmap[tempOldFriend.data.userId + "a"];
				if (track != null && track.autoTrack) {
					track.resetTrail();
				}

				// remove accuracy circle
				if (tempOldFriend.accuracyCircle != null) {
					tempOldFriend.accuracyCircle.setMap(null);
				}

				if (tempOldFriend.infoWindow != null) {
					tempOldFriend.infoWindow.close();
				}

				friendsChanged = true;
			}
		}
	}

	var allDisplayed = com.greenalp.tracking.updateFriendDisplay();
	if (!allDisplayed && !trackingInstance.adsenseInit && !com.greenalp.tracking.skipLocationAgeFilterWarning) {
		com.greenalp.tracking.showMapNotification("Attention: Some friends are not displayed. To change click the options menu.");
	}

	if (trackingInstance.locationdetailshidden) {
		// jQuery("#locationdetails").css("marginTop",
		// -jQuery("#locationdetails").height()-2);
		// initTopMenu = false;
	}
	if (!trackingInstance.mapcenterInitialized) {
		if (com.greenalp.tracking.util.getURLParameter("mapcenter") != null) {
			var mapCenter = com.greenalp.tracking.util.getURLParameter("mapcenter").split(",");
			var centerLat = jQuery.trim(mapCenter[0]);
			var centerLon = jQuery.trim(mapCenter[1]);

			trackingInstance.map.setCenter({
				"lat" : centerLat,
				"lon" : centerLon
			});
		} else if (trackingInstance.friends.length > 0) {
			if (friendToCenter == null) {
				if (trackingInstance.friends.length != 1) {
					trackingInstance.map.fitFriends(trackingInstance.friends);

					// getZoom() seems to return an outdated value and not the one set in (fitFriends). Try in own thread
					window.setTimeout(function() {
						var pForceZoom = com.greenalp.tracking.util.getURLParameter("forcezoom");
						var pZoom = com.greenalp.tracking.util.getURLParameter("zoom");
						if (jQuery.isNumeric(pZoom)) {
							var zoomLevel = Number(pZoom);
							if (zoomLevel <= trackingInstance.map.getZoom() || pForceZoom == "1") {
								trackingInstance.map.setZoom(zoomLevel);
							}
						} else {
							// if zoom is no explicitely set run some extra check to avoid too high zoom which could happend after "fitFriends" is called.
							if (trackingInstance.map.getZoom() > 18) {
								trackingInstance.map.setZoom(18);
							}
						}
					}, 1000);

				} else {
					// trackingInstance.map.setZoom(13);
					friendToCenter = trackingInstance.friends[0];

					friendToCenter.autoFocus = true;
				}
			}
		}

		if (trackingInstance.friends.length == 1) {
			// show info window if no position
			if (trackingInstance.friends[0].marker != null) {
				var markerTp = trackingInstance.friends[0].marker.getPosition();

				if (markerTp.lon == 0 && markerTp.lat == 0) {
					var nodatamessage = 'User location is unknown because no track data <br/> has been sent yet. Please note that the tracked device <br/>must be outside of buildings to receive the GPS signal.';
					if (trackingInstance.friends[0].data.lastPrivateClientTime != null && trackingInstance.friends[0].data.lastPrivateClientTime > 0) {
						nodatamessage = "User's location cannot be displayed because it is within the private region.";
					}

					trackingInstance.showInfoWindowAtPosition(markerTp, jQuery('<div>' + nodatamessage + '<br/></div>').get(0));

				} else if (trackingInstance.friends[0].data.lastposition != null
						&& trackingInstance.friends[0].data.lastposition.provider != "gps"
						&& (trackingInstance.friends[0].data.trackpoints == null || trackingInstance.friends[0].data.trackpoints.length == 0 || (trackingInstance.friends[0].data.trackpoints[0].lat == 0 && trackingInstance.friends[0].data.trackpoints[0].lon == 0))) {

					trackingInstance
							.showInfoWindowAtPosition(
									markerTp,
									jQuery(
											'<div>Network location is displayed. To display exact location <br/> GPS must be enabled. Please note that the tracked device <br/>must be outside of buildings to receive the GPS signal.<br/></div>')
											.get(0));

				}

			}
		}

		if (friendToCenter != null && trackingInstance.showLocationDetails == "1") {
			trackingInstance.showUserData(friendToCenter);
		}

		trackingInstance.mapcenterInitialized = true;
	}

	if (friendToCenter != null) {
		trackingInstance.map.setCenter(friendToCenter.marker.getPosition());
	}

	if (friendsChanged) {
		trackingInstance.updateFriendComboboxes(trackingInstance.friends);
	}

	if (!trackingInstance.adsenseInit) {
		trackingInstance.adsenseInit = true;

		if (com.greenalp.showAds && com.greenalp.showMapAds) {
			var adUnitDiv = document.createElement('div');
			adUnitDiv.style.marginLeft = "-12px";
			var adUnitOptions = {
				format : (com.greenalp.mobilePage ? google.maps.adsense.AdFormat.HALF_BANNER : google.maps.adsense.AdFormat.HALF_BANNER),
				position : (com.greenalp.mobilePage ? google.maps.ControlPosition.TOP_CENTER : google.maps.ControlPosition.TOP_CENTER),
				map : trackingInstance.map,
				visible : true,
				publisherId : 'pub-1468323397828744',
				channelNumber : '7609147912'
			};
			trackingInstance.adUnit = new google.maps.adsense.AdUnit(adUnitDiv, adUnitOptions);
		}
	}
};

com.greenalp.tracking.updateFriendDisplay = function() {
	var allDisplayed = true;

	var trackingInstance = com.greenalp.tracking;
	for (var i = trackingInstance.friends.length - 1; i >= 0; i--) {
		var friend = trackingInstance.friends[i];
		if (friend.data.lastposition != null) {
			var p = friend.data.lastposition;

			// hide friends to old
			var showFriend = trackingInstance.locationAgeFilter < 1 || friend.data.curServerTime - p.clientTime <= (trackingInstance.locationAgeFilter);

			if (showFriend) {
				if (friend.marker.getMap() == null) {
					friend.marker.setMap(trackingInstance.map);
					friend.accuracyCircle.setMap(trackingInstance.map);
					if (this.showAutoTracks) {
						var trackId = this.getTrackId(friend.data.userId, true);
						if (trackId in this.trackmap) {
							var track = this.trackmap[trackId];
							track.rebuildTrack();
							// track.visualizeTrackPois();
						}
					}
				}
			} else {
				allDisplayed = false;

				if (friend.marker.getMap() != null) {
					friend.marker.setMap(null);
					friend.accuracyCircle.setMap(null);
					// com.greenalp.tracking.overlay.removeFriend();
					com.greenalp.tracking.removeFriendOverlay();

					var trackId = this.getTrackId(friend.data.userId, true);
					if (trackId in this.trackmap) {
						var track = this.trackmap[trackId];
						track.resetTrail();
					}
				}
			}
		}
	}

	return allDisplayed;
};

com.greenalp.tracking.setMarkerClick = function(friend) {
	var trackingInstance = this;
	friend.marker.setOnClickListener(function(polyline) {
		// showInfoWindowUserMarker(friend, null);
		trackingInstance.showUserData(friend);
	});
};

com.greenalp.tracking.getCustomIcon = function(iconUrl, iconWidth, iconHeight, iconAnchorX, iconAnchorY) {
	var anchor = "center";

	if (iconAnchorX != null && iconAnchorY != null) {
		anchor = [ iconAnchorX, iconAnchorY ];
	}

	var scaledSize = null;
	if (iconWidth != null && iconHeight != null) {
		scaledSize = [ iconWidth, iconHeight ];
	}

	icon = new com.greenalp.maps.Icon({
		"url" : iconUrl,
		"anchor" : anchor,
		"scaledSize" : scaledSize
	});

	return icon;
};

com.greenalp.tracking.getFriendCustomIconUrl = function(friend, appendVersionId) {
	var path = window.location.pathname.split("/");
	var phpbase = "";

	if (path.length > 0 && path[0] != null && path[0] != "") {
		phpbase = path[0];
	} else if (path.length > 1 && path[1] != null && path[1] != "") {
		phpbase = path[1];
	}

	if (phpbase != "") {
		phpbase = window.location.protocol + "//" + window.location.host + "/" + phpbase + "/";
	}

	var imagepath = phpbase + "loadimage.php?type=friendicon&id=" + friend.data.userId;

	if (appendVersionId) {
		imagepath += "&v=" + new Date().getTime();
	}

	if (com.greenalp.tracking.demouser && friend.data.userId == -1) {
		imagepath = "res/demowoman.png";
	}

	if (com.greenalp.tracking.demouser && friend.data.userId == -2) {
		imagepath = "res/demoman.png";
	}

	return imagepath;

};

com.greenalp.tracking.showUserData = function(friend) {

	// var mapType = map.mapTypes[map.getMapTypeId()];

	// var point =
	// overlay1.getProjection().fromLatLngToContainerPixel(friend.marker.getPosition());

	// var divstr = '<div
	// style="position:absolute;top:'+(point.y+10)+'px;left:'+(point.x)+'px;width:200px;height:200px;background:red"></div>';

	// jQuery("#map_canvas").append(divstr);

	// this.overlay.setFriend(friend);
	if (this.overlay == null || !this.overlay.matchesFriend(friend)) {
		com.greenalp.tracking.setFriendOverlay(friend);
	} else {
		com.greenalp.tracking.removeFriendOverlay();
	}

};

com.greenalp.tracking.setFriendOverlay = function(friend) {
	this.removeFriendOverlay();

	this.overlay = new com.greenalp.tracking.FriendOverlay(this.map, friend);
};

com.greenalp.tracking.removeFriendOverlay = function() {
	if (this.overlay != null) {
		this.overlay.removeFromMap();
		this.overlay = null;
	}
};

com.greenalp.tracking.showContextMenu = function(latlng) {

	$('.contextmenu').remove();
	var contextmenuDir = jQuery('<div class="contextmenu" style=""/>');
	var menuitem1 = jQuery('<div   style="text-decoration:underline;color:blue;cursor:pointer">Estimate elevation</div>');
	menuitem1.click(function() {
		com.greenalp.tracking.util.getElevation(latlng);
	});
	contextmenuDir.append(menuitem1);

	var menuitem2 = jQuery('<div style="text-decoration:underline;color:blue;cursor:pointer">Get address</div>');
	menuitem2.click(function() {
		com.greenalp.tracking.util.getAddress(latlng);
	});
	contextmenuDir.append(menuitem2);

	var menuitem3 = jQuery('<div style="text-decoration:underline;color:blue;cursor:pointer">Add geo-fence around location</div>');
	menuitem3.click(function() {
		a = latlng;
		com.greenalp.tracking.addGeofenceAroundLocation(latlng.lat, latlng.lon, "Geo-fence @" + com.greenalp.tracking.util.roundNumber(latlng.lat, 4) + ","
				+ com.greenalp.tracking.util.roundNumber(latlng.lon, 4), "");
	});
	contextmenuDir.append(menuitem3);

	com.greenalp.tracking.showInfoWindowAtPosition(latlng, contextmenuDir[0]);

};
	com.greenalp.tracking.demoUserAction = function() {
		var now = new Date().getTime();
		var tptime = now - 2000;
		
		if (com.greenalp.tracking.demostep < 4) {
			tptime -= 3600000;
		}

		function setTimestamps(tp) {
			tp.clientTime = tptime;
			tp.serverTime = tptime;
			tp.sendTime = tptime;
		}

		var friendsData = com.greenalp.tracking.demouser1Data[Math.min(
				com.greenalp.tracking.demouser1Data.length - 1,
				com.greenalp.tracking.demostep)];

		friendsData.curServerTime = now;

		if (com.greenalp.tracking.demostep < com.greenalp.tracking.demouser1Data.length) {
			var tp = friendsData.userdata[0].trackpoints[0];
			setTimestamps(tp);
			var tp1 = friendsData.userdata[1].trackpoints[0];
			setTimestamps(tp1);
		}

		switch (com.greenalp.tracking.demostep) {
		case 1:
			com.greenalp.tracking.map.setZoom(15);
			com.greenalp.tracking.map.setCenter({"lat":
					48.8644191773027, "lon":2.3220419883728027});
			break;
		case 2:
			friendsData.userdata[0].message = '<br/>Welcome! If you are wondering<br/>how this works just click this link:<br/><a href="index.php?page=intro">Real Time GPS Tracker</a><br/><br/>';
			friendsData.userdata[0].messageservertime = now - 2000;
			friendsData.userdata[0].messageclienttime = now - 2000;
			break;

		case 10:
			friendsData.userdata[0].message = "Hi bob, I will follow you.";
			friendsData.userdata[0].messageservertime = now - 2000;
			friendsData.userdata[0].messageclienttime = now - 2000;
			break;
		case 14:
			friendsData.userdata[1].message = "Great, see you soon.";
			friendsData.userdata[1].messageservertime = now - 2000;
			friendsData.userdata[1].messageclienttime = now - 2000;
			break;
		case 16:
			com.greenalp.tracking.friends[0].infoWindow.close();
			break;
		case 17:
			com.greenalp.tracking.friends[1].infoWindow.close();
			break;
		case 20:
			friendsData.userdata[0].message = "Click me to see my speed.";
			friendsData.userdata[0].messageservertime = now - 2000;
			friendsData.userdata[0].messageclienttime = now - 2000;
			com.greenalp.tracking
					.showUserData(com.greenalp.tracking.friends[0]);
			break;
		case 22:
			com.greenalp.tracking.friends[0].infoWindow.close();
			break;
		case 25:
			friendsData.userdata[0].message = "Not bad, this tracking app :-)";
			friendsData.userdata[0].messageservertime = now - 2000;
			friendsData.userdata[0].messageclienttime = now - 2000;
			break;
		case 27:
			friendsData.userdata[1].message = "Yeah, soon you have catched me.";
			friendsData.userdata[1].messageservertime = now - 2000;
			friendsData.userdata[1].messageclienttime = now - 2000;
			break;
		case 29:
			com.greenalp.tracking.friends[0].infoWindow.close();
			com.greenalp.tracking.friends[1].infoWindow.close();
			break;
		case 34:
			friendsData.userdata[0].message = "Let's go for a coffee.";
			friendsData.userdata[0].messageservertime = now - 2000;
			friendsData.userdata[0].messageclienttime = now - 2000;
			break;

		}

		com.greenalp.tracking.demostep++;

		com.greenalp.tracking.updateLocationHandler(friendsData);

	};

	com.greenalp.tracking.initDemoUserData = function() {

		function createUser(id) {
			var user = {};

			var time = new Date().getTime();

			user.loggedIn = true;
			user.userId = id;
			user.username = "demouser";
			user.nickname = "demouser";
			user.icon = true;
			user.allowsAutoTrack = true;
			user.dataChanged = true;
			user.message = null;
			user.messageservertime = null;
			user.messageclienttime = null;
			user.batteryInfo = {
				"serverTime" : time,
				"clientTime" : time,
				"chargeLevel" : time % 100
			};
			
			user.iconwidth = 50;
			user.iconheight = 72;
			user.iconAnchorX = 25;
			user.iconAnchorY = 36;

			var trackpoints = new Array();
			user.trackpoints = trackpoints;
			return user;
		};

		function setTp(blabla, lat, lon) {
			var time = new Date().getTime();

			var friendsData = {
				"loggedIn" : true,
				"updateInterval" : 2000,
				"curServerTime" : time,
				"error" : null
			};

			com.greenalp.tracking.demouser1Data.push(friendsData);
			var userData = new Array();
			friendsData.userdata = userData;

			var user1 = createUser(-1);
			userData.push(user1);

			var user2 = createUser(-2);
			userData.push(user2);

			var tp = {
				"alt" : 100,
				"lon" : 16.32279935,
				"lat" : 48.23738432,
				"acc" : 35.77709,
				"bea" : 269.1,
				"speed" : 14.75,
				"timediffClient" : 1000,
				"timediffServer" : 1000,
				"provider" : "gps"
			};
			tp.lat = lat;
			tp.lon = lon;
			user1.trackpoints.push(tp);
			user1.lastposition = tp;

			var tp = {
				"alt" : 100,
				"lon" : 16.32279935,
				"lat" : 48.23738432,
				"acc" : 35.77709,
				"bea" : 269.1,
				"speed" : 9.75,
				"timediffClient" : 1000,
				"timediffServer" : 1000,
				"provider" : "gps"
			};
			tp.lat = 48.86837765133066 - (45 - com.greenalp.tracking.demouser1Data.length) * 0.0001;
			tp.lon = 2.310197353363037;
			user2.trackpoints.push(tp);
			user2.lastposition = tp;

		}

		setTp("user1", 48.86837765133066, 2.3232221603393555);
		setTp("user1", 48.86795420960014, 2.324552536010742);
		setTp("user1", 48.8670941955784, 2.3271918296813965);
		setTp("user1", 48.866585056814294, 2.3285865783691406);
		setTp("user1", 48.86575225483829, 2.3301315307617188);
		setTp("user1", 48.86493355464078, 2.3319339752197266);
		setTp("user1", 48.86331023016025, 2.335238456726074);
		setTp("user1", 48.863296114064276, 2.3354530334472656);
		/*
		 * setTp("user1", 48.86308437214682, 2.335538864135742); setTp("user1",
		 * 48.862731466960305, 2.337319850921631); setTp("user1",
		 * 48.86194095031236, 2.3401522636413574); setTp("user1",
		 * 48.8617856687893, 2.3404741287231445); setTp("user1",
		 * 48.86127747134543, 2.339766025543213); setTp("user1",
		 * 48.8617856687893, 2.3383498191833496); setTp("user1",
		 * 48.86213858064493, 2.3371481895446777); setTp("user1",
		 * 48.86249149001207, 2.336118221282959); setTp("user1",
		 * 48.862632653062164, 2.3352813720703125);
		 */
		setTp("user1", 48.86264676934528, 2.3349809646606445);
		setTp("user1", 48.862039765576185, 2.3343801498413086);
		setTp("user1", 48.8617856687893, 2.334144115447998);
		setTp("user1", 48.86160215364093, 2.3336076736450195);
		setTp("user1", 48.86106572088755, 2.33384370803833);
		setTp("user1", 48.86017635918159, 2.333242893218994);
		setTp("user1", 48.86078338555013, 2.3305177688598633);
		setTp("user1", 48.86048693173174, 2.3300671577453613);
		setTp("user1", 48.85993636998203, 2.3296380043029785);
		setTp("user1", 48.85958344259819, 2.3293161392211914);
		setTp("user1", 48.860529282384725, 2.326204776763916);
		setTp("user1", 48.86106572088755, 2.324509620666504);
		setTp("user1", 48.8616586199121, 2.3224496841430664);
		setTp("user1", 48.86211034778807, 2.3209476470947266);
		setTp("user1", 48.86260442048399, 2.319960594177246);
		setTp("user1", 48.862999675129004, 2.318587303161621);
		setTp("user1", 48.86319730128095, 2.3175573348999023);
		setTp("user1", 48.86316906902132, 2.3159050941467285);
		setTp("user1", 48.86315495288552, 2.314274311065674);
		setTp("user1", 48.86315495288552, 2.31337308883667);
		setTp("user1", 48.86314083674573, 2.3120641708374023);
		setTp("user1", 48.86309848830252, 2.311248779296875);
		setTp("user1", 48.863112604454244, 2.310476303100586);
		setTp("user1", 48.86458066249379, 2.310347557067871);
		setTp("user1", 48.86551229237483, 2.310304641723633);
		setTp("user1", 48.86644390491248, 2.3102188110351562);
		setTp("user1", 48.867502534471306, 2.3102188110351562);
		setTp("user1", 48.86837765133066, 2.310197353363037);

	};com.greenalp.tracking.util.googlemapsloaded = typeof google !== "undefined" && typeof google.maps !== "undefined" && typeof google.maps.Map !== "undefined";

if (typeof com.greenalp.tracking.util.googleloaded === "undefined") {
	com.greenalp.tracking.util.googleloaded = typeof google !== "undefined" && typeof google.load !== "undefined" ;
}

com.greenalp.tracking.util.ensureGoogleMapsLoaded = function(callbackfunction, callbackarg) {
	function loadMapsApi() {
		google.load('maps', '3', {
			other_params : 'sensor=false',
			callback : function() {
				com.greenalp.tracking.util.googlemapsloaded = typeof google !== "undefined" && typeof google.maps !== "undefined" && typeof google.maps.Map !== "undefined";
				callbackfunction(callbackarg);
			}
		});
	}

	if (!com.greenalp.tracking.util.googleloaded) {
		$.getScript('https://www.google.com/jsapi').done(function(script, textStatus) {
			com.greenalp.tracking.util.googleloaded = typeof google !== "undefined" && typeof google.load !== "undefined" ;
			loadMapsApi();
		}).fail(function(jqxhr, settings, exception) {
			alert("load error");
		});
		return false;
	} else if (!com.greenalp.tracking.util.googlemapsloaded) {
		loadMapsApi();
		return false;
	}

	return true;
};
 
com.greenalp.tracking.util.getAddress = function(latlng) {
	if (!com.greenalp.tracking.util.ensureGoogleMapsLoaded(this.getAddress, latlng)) {
		return;
	}

	if (this.geocoder == null) {
		// Create an ElevationService
		this.geocoder = new google.maps.Geocoder();
	}

	this.geocoder.geocode({
		'latLng' : new google.maps.LatLng(latlng.lat, latlng.lon)
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				com.greenalp.tracking.showInfoWindowAtPosition(latlng, jQuery("<div>" + results[0].formatted_address + "</div>")[0]);

			} else {
				alert("No results found");
			}
		} else {
			alert("Geocoder failed due to: " + status);
		}
	});
};

com.greenalp.tracking.util.getElevation = function(clickedLocation) {
	if (!com.greenalp.tracking.util.ensureGoogleMapsLoaded(this.getElevation, clickedLocation)) {
		return;
	}
	
	if (this.elevator == null) {
		// Create an ElevationService
		this.elevator = new google.maps.ElevationService();
	}

	var locations = [];

	// Retrieve the clicked location and push it on the array
	locations.push(new google.maps.LatLng(clickedLocation.lat, clickedLocation.lon));

	// Create a LocationElevationRequest object using the array's one value
	var positionalRequest = {
		'locations' : locations
	};

	// Initiate the location request
	this.elevator.getElevationForLocations(positionalRequest, function(results, status) {
		if (status == google.maps.ElevationStatus.OK) {

			// Retrieve the first result
			if (results[0]) {

				// Open an info window indicating the
				// elevation at the clicked position
				com.greenalp.tracking.showInfoWindowAtPosition(clickedLocation, jQuery("<div>The elevation at this point <br/>is "
						+ com.greenalp.tracking.util.roundNumber(results[0].elevation, 2) + " m/"
						+ com.greenalp.tracking.util.roundNumber(results[0].elevation * 3.28083, 2) + " ft</div>")[0]);
			} else {
				alert("No results found");
			}
		} else {
			alert("Elevation service failed due to: " + status);
		}
	});
};
com.greenalp.tracking.util.googlechartsloaded = typeof google !== "undefined" && typeof google.visualization !== "undefined" && typeof google.visualization.DataTable !== "undefined";

if (typeof com.greenalp.tracking.util.googleloaded === "undefined") {
	com.greenalp.tracking.util.googleloaded = typeof google !== "undefined" && typeof google.load !== "undefined" ;
}

com.greenalp.tracking.util.ensureGoogleChartsLoaded = function(callbackfunction, callbackarg) {
	function loadChartApi() {
		google.load('visualization', '1', {
			packages : [ "corechart" ],
			callback : function() {
				com.greenalp.tracking.util.googlechartsloaded = typeof google !== "undefined" && typeof google.visualization !== "undefined" && typeof google.visualization.DataTable !== "undefined";
				callbackfunction(callbackarg);
			}
		});
	}

	if (!com.greenalp.tracking.util.googleloaded) {
		$.getScript('https://www.google.com/jsapi').done(function(script, textStatus) {
			com.greenalp.tracking.util.googleloaded = typeof google !== "undefined" && typeof google.load !== "undefined" ;
			loadChartApi();
		}).fail(function(jqxhr, settings, exception) {
			alert("load error");
		});
		return false;
	} else if (!com.greenalp.tracking.util.googlechartsloaded) {
		loadChartApi();
		return false;
	}

	return true;
};


com.greenalp.tracking.util.drawTrackChart = function(track) {


	
	if (!com.greenalp.tracking.util.ensureGoogleChartsLoaded(this.drawTrackChart, track)) {
		return;
	}

 
	var trackdata = track.trackdata;

	 
		var data = new google.visualization.DataTable();

		data.addColumn('datetime', 'Time');

		var charttype = jQuery('input[name=charttype]:radio:checked').val();
		var chartunit = jQuery('input[name=chartunit]:radio:checked').val();

		if (charttype == "elevation") {
			if (chartunit != "imperial") {
				data.addColumn('number', 'Altitude (m)');
			}

			if (chartunit != "metric") {
				data.addColumn('number', 'Altitude (ft)');
			}
		} else if (charttype == "speed") {
			if (chartunit != "imperial") {
				data.addColumn('number', 'Speed (km/h)');
			}

			if (chartunit != "metric") {
				data.addColumn('number', 'Speed (mph)');
			}
		} else {
			if (chartunit != "imperial") {
				data.addColumn('number', 'Altitude (m)');
			}

			if (chartunit != "metric") {
				data.addColumn('number', 'Altitude (ft)');
			}

			if (chartunit != "imperial") {
				data.addColumn('number', 'Speed (km/h)');
			}

			if (chartunit != "metric") {
				data.addColumn('number', 'Speed (mph)');
			}

		}

		for ( var i = 0; i < trackdata.length; i++) {
			var tp = trackdata[i];
			var rowidx = -1;
			if (charttype == "speed") {
				if (chartunit == "imperial") {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.speed * 2.2369, 2) ]);
				} else if (chartunit == "metric") {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.speed * 3.6, 2) ]);
				} else {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.speed * 3.6, 2),
							com.greenalp.tracking.util.roundNumber(tp.speed * 2.2369, 2) ]);
				}

			} else if (charttype == "elevation") {
				if (chartunit == "imperial") {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.alt * 3.28083, 0) ]);
				} else if (chartunit == "metric") {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.alt, 0) ]);
				} else {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.alt, 0),
							com.greenalp.tracking.util.roundNumber(tp.alt * 3.28083, 0) ]);
				}
			} else if (charttype == "both") {
				if (chartunit == "imperial") {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.alt * 3.28083, 0),
							com.greenalp.tracking.util.roundNumber(tp.speed * 2.2369, 2) ]);
				} else if (chartunit == "metric") {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.alt, 0),
							com.greenalp.tracking.util.roundNumber(tp.speed * 3.6, 2) ]);
				} else {
					rowidx = data.addRow([ new Date(tp.clientTime), com.greenalp.tracking.util.roundNumber(tp.alt, 0),
							com.greenalp.tracking.util.roundNumber(tp.alt * 3.28083, 0), com.greenalp.tracking.util.roundNumber(tp.speed * 3.6, 2),
							com.greenalp.tracking.util.roundNumber(tp.speed * 2.2369, 2) ]);
				}
			}

			if (rowidx > -1) {
				// data.setRowProperty(rowidx, "tp", tp);
			}
		}

		// var div = jQuery('<div
		// style="position:absolute;top:0px;left:0px;width:600px;height:300px;z-Index:1000000009999"></div>');

		var div = jQuery('#trackchart');

		// div.appendTo("#map_outer");

		var height = 200;

		var tdmap = jQuery("#tdmap");
		var oldHeight = tdmap.height();
		var newHeight = (oldHeight - height);

		var chart = new google.visualization.AreaChart(div[0]);

		google.visualization.events.addListener(chart, 'ready', function() {
			jQuery("#chartloadinginfo").css("display", "none");
		});

		if (jQuery("#trackchartdiv").height() == 0) {
			tdmap.animate({
				height : newHeight + "px"
			}, 490, function() {
				drawChart2();
			});

			jQuery('#trackchartdiv').animate({
				height : (height) + "px"
			}, 490);
		} else {
			drawChart2();
		}

		function drawChart2() {
			chart.draw(data, {
				title : 'Track chart',
				height : height,
				hAxis : {
					title : 'Time',
					titleTextStyle : {
						color : '#FF0000'
					}
				}
			});
		}

		// Add our selection handler.
		google.visualization.events.addListener(chart, 'select', selectHandler);

		function selectHandler() {
			var selection = chart.getSelection();

			for ( var i = 0; i < selection.length; i++) {
				var item = selection[i];
				if (item.row != null && item.column != null) {
					track.showTrackPoint(item.row);
				}
			}
		}

		google.visualization.events.addListener(chart, 'onmouseover', mouseOverHandler);

		function mouseOverHandler(e) {
			com.greenalp.tracking.disableAutoFocus();
			chart.setSelection([ e ]);
			selectHandler();
		}
	

};

