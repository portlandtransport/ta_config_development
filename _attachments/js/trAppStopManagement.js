/*
   Copyright 2010-2011 Portland Transport

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// functions for managing the stops included in the configuration
function trAppEditPublicApplianceConfig() {
	
	trApp.markers_by_location = {}; // clear cache of markers
	// figure out our map canvas height and width (it's square). Lesser of 2/3 of window width or window height less room for header
	var window_height = 	$(window).height(); //window.innerHeight;
	var window_width = $(window).width(); //window.innerWidth;
	var map_dim = Math.round(window_width*2/3);
	if (map_dim > window_height-80) {
		map_dim = window_height-80;
	}

	if (map_dim < 200) {
		map_dim = 200;
	}

	var return_html = "";
	return_html += "<table cellpadding='0' cellspacing='0' border='0'><tr valign='top'><td>"
	//return_html += "<h2>Nickname: "+trApp.current_appliance['private']['nickname']+"</h2>";
	//return_html += "<p><img src=\""+trApp.unselected_stop_icon_url+"\"> = Transit Stop&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <img src=\""+trApp.selected_stop_icon_url+"\"> = Transit Stop Included in Your Display</p>";
  return_html += "<div id=\"map_canvas\" style=\"position: relative; width: "+map_dim+"px; height: "+map_dim+"px; border-style: solid; border-width: 2px\"></div>";
  return_html += "</td><td width='100%'><h4>Nickname: "+trApp.current_appliance.private.nickname+"</h4>Click on the map on the stops you want to add to your display configuration.<p>You may then uncheck any individual transit lines that you don't want to appear on your display.</p>";
  return_html += "<p><form onsubmit=\"trAppActivateTab(4); return false;\"><input id='stop_submit' type=\"image\" src='images/next.png'></form></p>";
  return_html += "<p><form onsubmit=\"trAppClearStops(); trAppActivateTab(2); return false;\"><input id='stop_clear' type=\"image\" src='images/reset_stops.png'></form></p>";
	return_html += "<div id=\"selected_stops\"></div></td></tr>\n";
	$("#fold3").html(return_html);
	//trAppTestStopsConfigured();
	trAppUpdateStopList();
	
	var latlng = new google.maps.LatLng(trApp.current_appliance['private']['lat'], trApp.current_appliance['private']['lng']);
  var myOptions = {
    zoom: 17,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  google.maps.event.addListener(map, 'idle', function() {
		trAppLoadStops();
	});
	google.maps.event.addListener(map, 'zoom_changed', function() {
	  if (map.getZoom() < 16) {
	    map.setZoom(16);
	  }
	});

}

function trAppClearStops() {
	trApp.current_appliance.public.stops = {};
}
	

function trAppUpdateStopString() {
	var multi_agency_stop_array = new Array();
	for (var agency in trApp.current_appliance.public.stops) {
		for (var stop_id in trApp.current_appliance.public.stops[agency]) {
			var all_true = true;
			for (var route_id in trApp.current_appliance.public.stops[agency][stop_id]) {
				all_true = all_true && trApp.current_appliance.public.stops[agency][stop_id][route_id];
			}
			if (all_true) {
				multi_agency_stop_array.push("stop["+agency+"]["+stop_id+"]=*");
			} else {
				for (var route_id in trApp.current_appliance.public.stops[agency][stop_id]) {
					if (trApp.current_appliance.public.stops[agency][stop_id][route_id]) {
						multi_agency_stop_array.push("stop["+agency+"]["+stop_id+"]="+route_id);
					}
				}
			}
		}
	}
	return multi_agency_stop_array.join("&");
}
	

function trAppUpdateStopList() {
	
	var stop_listings = [];

	var stop_list = "";
	for (var agency in trApp.current_appliance['public']['stops']) {
		for (var stop_id in trApp.current_appliance['public']['stops'][agency]) {

			var stop_data = trApp.stop_cache.stopData(agency,stop_id);
			if (stop_data == undefined) {
				trApp.stop_cache.getCacheItem(agency,stop_id,trAppUpdateStopList);
			} else {
				// compute distance
				var stop_distance = trAppStopDistance(stop_data);
				var stop_list_text = "";

				stop_list_text += "<b>"+stop_data.stop_name+" ("+stop_id+") "+Math.ceil(stop_distance)+" ft</b><br>";
				//stop_list += "<PRE>"+dump(stop_data)+"</PRE>";
				
				// build route list
				var stop_routes = {};
				var stop_directions = {};
				for (var i = 0; i < stop_data.routes.length; i++){ 
			    var route = stop_data.routes[i];
			    stop_routes[route.route_id] = route.route_long_name;
			    if (!stop_directions[route.route_id]) {
			    	stop_directions[route.route_id] = {};
			    }
			    stop_directions[route.route_id][route.direction_id] = true;
			    if (route.route_short_name != "") {
			    	stop_routes[route.route_id] = route.route_short_name+" "+stop_routes[route.route_id]; // this may be a TriMet-ism!
			    }
			  }

				for (var route_id in trApp.current_appliance['public']['stops'][agency][stop_id]) {
					if (trApp.current_appliance['public']['stops'][agency][stop_id][route_id] && stop_routes[route_id]) {
						if (stop_directions[route_id][0] && stop_directions[route_id][1]) {
							stop_list_text += "&nbsp;&nbsp;&lArr;&nbsp;"+stop_routes[route_id]+"&nbsp;&rArr;<br>";
						} else if (stop_directions[route_id][0]) {
							stop_list_text += "&nbsp;&nbsp;&lArr;&nbsp;"+stop_routes[route_id]+"<br>";
						} else {
							stop_list_text += "&nbsp;&nbsp;"+stop_routes[route_id]+"&nbsp;&rArr;<br>";
						}
					}
				}
				stop_listings.push({text: stop_list_text, distance: stop_distance});
			}
		}
	}
	
	stop_listings.sort(function(a, b) {
	    a = a.distance;
	    b = b.distance;
	
	    return a < b ? -1 : (a > b ? 1 : 0);
	});
	
	for (var i = 0; i < stop_listings.length; i++) {
		stop_list += stop_listings[i].text;
	}
	
	$("#selected_stops").html(stop_list);
}

function trAppStopDistance(stop_data) {

	var R = 3959 * 5280; // mi (6371 km)     		
	
	var lng1 = 	trApp.current_appliance.private.lng * (Math.PI/180);
	var lat1 = 	trApp.current_appliance.private.lat * (Math.PI/180);
			
	var lng2 = stop_data.stop_lon * (Math.PI/180);
	var lat2 = stop_data.stop_lat * (Math.PI/180);
	
	//debug_alert(stop_data);
	//debug_alert([lng1, lat1, lng2, lat2]);
	
	/*	
	var x = (lng2-lng1) * Math.cos((lat1+lat2)/2);
	var y = (lat2-lat1);
	var d = Math.sqrt(x*x + y*y) * R;
	*/

	
	var dLat = (lat2-lat1);
	var dLng = (lng2-lng1);
	
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return R * c;
					
}

function trAppTestStopsConfigured() {
	if (trAppCountStops() > 0) {
		$("#stop_submit").removeAttr('disabled');
	} else {
		$("#stop_submit").attr("disabled", "disabled");
	}
}

function trAppSynchronizeStopConfig(stop_data) {
	// takes stop information from map marker and makes sure all lines represented in in incoming data are in configuration
	// if a line is not in the configuration, add it with an initial state of true
	
  if (trApp.current_appliance['public']['stops'][stop_data.agency][stop_data.stop_id] == undefined) {
		trApp.current_appliance['public']['stops'][stop_data.agency][stop_data.stop_id] = {};
  }
	for (var i = 0; i < stop_data.routes.length; i++){ 
  	var route = stop_data.routes[i];
    if (trApp.current_appliance['public']['stops'][stop_data.agency][stop_data.stop_id][route.route_id] == undefined) {
    	trApp.current_appliance['public']['stops'][stop_data.agency][stop_data.stop_id][route.route_id] = true;
    	trApp.save_flags.public = true;
    	//trAppTestStopsConfigured();
    }
  }
  trAppUpdateStopList();
}

function trAppCountStopRoutes(agency,stop_id) {
	// counts how many routes are included in the configuration for a given stop
	var count = 0;
	if (trApp.current_appliance['public']['stops'][agency] == undefined) {
		trApp.current_appliance['public']['stops'][agency] = {};
	}
	if (trApp.current_appliance['public']['stops'][agency][stop_id] != undefined) {
		for (var route in trApp.current_appliance['public']['stops'][agency][stop_id]) { 
			if (trApp.current_appliance['public']['stops'][agency][stop_id][route]) {
				count++;
			}
		}
	}
	
	return count;
}

function trAppAdjustStopMarkerIconState(agency,stop_id) {
	var correct_image = trApp.unselected_stop_icon;
	var marker = trApp.markers_by_location[agency][stop_id];
	if (trAppCountStopRoutes(agency,stop_id) > 0) {
		correct_image = trApp.selected_stop_icon;
	}
	if (marker.getIcon != correct_image) {
		marker.setIcon(correct_image);
	}
}
	

function trAppGenerateStopForm(stop_data) {

	var return_html = "";
	var routes = trApp.current_appliance['public']['stops'][stop_data.agency][stop_data.stop_id];
	return_html += "<h3 class='infowindow'>"+stop_data.stop_name+" ("+stop_data.agency+" "+stop_data.stop_id+")</h3>";
	if (stop_data.routes.length == 1) {
		var route_name = stop_data.routes[0].route_long_name;
    if (stop_data.routes[0].route_short_name != "") {
    	route_name = stop_data.routes[0].route_short_name+" "+route_name; // this may be a TriMet-ism!
    }
		return_html += "<br>"+route_name+"<br>";
	} else {
		return_html += "<form action='return false;'><span class='fineprint'>Uncheck a box to remove a given line from your display.</span><br><br>";
		for (var i = 0; i < stop_data.routes.length; i++){ 
	    var route = stop_data.routes[i];
	    var route_name = route.route_long_name;
	    if (route.route_short_name != "") {
	    	route_name = route.route_short_name+" "+route_name; // this may be a TriMet-ism!
	    }
	  	if (routes[route.route_id] == true) {
	  		return_html += "<input id='"+stop_data.agency+"-"+stop_data.stop_id+"-"+route.route_id+"' onchange=\"trAppUpdateRouteState('"+stop_data.agency+"', '"+stop_data.stop_id+"', '"+route.route_id+"')\" type='checkbox' checked='1' value='"+route.route_id+"'/>"+route_name+"<br>";
	  	} else {
	  		return_html += "<input id='"+stop_data.agency+"-"+stop_data.stop_id+"-"+route.route_id+"' onchange=\"trAppUpdateRouteState('"+stop_data.agency+"', '"+stop_data.stop_id+"', '"+route.route_id+"')\" type='checkbox' value='"+route.route_id+"'/>"+route_name+"<br>";
	  	}
	  }
	}
  var clear_link = 'javascript:trAppRemoveStop("'+stop_data.agency+'","'+stop_data.stop_id+'")';
	return_html += "</form><br><table cellspacing='0' cellpadding='1' class='transparent_table'><tr valign='middle'><td width='24' class='transparent_table'><a href='"+clear_link+"'><img src='images/edit-delete-5.png' border='0'></a></td><td class='transparent_table'><a class='fineprint' href='"+clear_link+"'>Remove stop from your<br>display configuration</a></td></tr></table><br>";
	trAppUpdateStopList();
	return return_html;
}

function trAppUpdateRouteState(agency, stop_id, route_id) {
	var element_id = agency+"-"+stop_id+"-"+route_id;
	trApp.current_appliance['public']['stops'][agency][stop_id][route_id] = $('#'+element_id).is(":checked");
	trApp.save_flags.public = true;
	trAppAdjustStopMarkerIconState(agency,stop_id);
	trAppUpdateStopList();
}


function trAppCountStops() {
	// returns count of stops in public configuration
	var count = 0;
	for (var agency in trApp.current_appliance['public']['stops']) {
		for (var stop_id in trApp.current_appliance['public']['stops'][agency]) {
			if (trAppCountStopRoutes(agency,stop_id) > 0) {
				count++;
			}
		}
	}
	return count;
}

	    
function trAppRemoveStop(agency,stop_id) {
	var marker = trApp.markers_by_location[agency][stop_id];
	delete trApp.current_appliance['public']['stops'][agency][stop_id];
	trApp.save_flags.public = true;
	trAppAdjustStopMarkerIconState(agency,stop_id);
	trApp.infowindows_cache[agency][stop_id].close();
	trAppUpdateStopList();
}
	  
function trAppLoadStops() {
	var map_bounds = map.getBounds();
	var ne = map_bounds.getNorthEast();
	var sw = map_bounds.getSouthWest();
	var bbox = sw.lng()+","+sw.lat()+","+ne.lng()+","+ne.lat();
	var service_url = "http://developer.trimet.org/ws/V1/stops?bbox="+bbox+"&showRoutes=true&appID=828B87D6ABC0A9DF142696F76&json=true";
	var service_url = "http://transitappliance.couchone.com/transit_stops_production/_design/geo/_spatial/points?bbox="+bbox;
	if (location.href.match(/development/)) {
		var service_url = "http://transitappliance.couchone.com/transit_stops_loading/_design/geo/_spatial/points?bbox="+bbox;
	}
	$.ajax({
    type: "GET",
		url: service_url,
		dataType: "jsonp",
		success: function(data, status, request) {
			if (data.rows == undefined) {
				data.rows = new Array();
			}
			var arLen=data.rows.length;

			for ( var i=0, len=arLen; i<len; ++i ){
			
			  var stop = data.rows[i].value.doc;
			  
			  if (stop.routes.length == 0 && trAppCountStopRoutes(stop.agency,stop.stop_id) == 0) {
			  	continue;
			  }
			  
				if (trApp.current_appliance['public']['stops'][stop.agency] == undefined) {
					trApp.current_appliance['public']['stops'][stop.agency] = {};
				}
			  
			  if (trApp.markers_by_location[stop.agency] == undefined) {
			  	trApp.markers_by_location[stop.agency] = {};
			  }
			  
				if (trApp.markers_by_location[stop.agency][stop.stop_id] != undefined) {
					continue;
				}
			  
			  var myLatlng = new google.maps.LatLng(stop.stop_lat,stop.stop_lon);
			  var icon = trApp.unselected_stop_icon;
			  if (trAppCountStopRoutes(stop.agency,stop.stop_id) > 0) {
			  	icon = trApp.selected_stop_icon;
			  }
				var marker = new google.maps.Marker({
				     position: myLatlng,
				     icon: icon,
				     title: "Add "+stop.stop_name+" to your configuration ("+stop.agency+" "+stop.stop_id+")",
				     draggable: false
				});

				// add marker to map
				marker.setMap(map); 
				// attach the route data to the marker 
				marker.stop_data = stop;
				// keep track of our markers
				trApp.markers_by_location[stop.agency][stop.stop_id] = marker;
				// add click listeners to each marker with a fancy closure I don't really understand :-)
			  google.maps.event.addListener(marker, 'click', (function(marker) {
			  	return function() {
				  	trAppSynchronizeStopConfig(marker.stop_data);
				  	trAppAdjustStopMarkerIconState(marker.stop_data.agency,marker.stop_data.stop_id);	
				  	var infowindow = new google.maps.InfoWindow({
							content: '<div class="stop_form" id="'+marker.stop_data.stop_id+'">'+trAppGenerateStopForm(marker.stop_data)+'</div>'
						});
						if (trApp.infowindows_cache[marker.stop_data.agency] == undefined) {
							trApp.infowindows_cache[marker.stop_data.agency] = {};
						}
						trApp.infowindows_cache[marker.stop_data.agency][marker.stop_data.stop_id] = infowindow;
						infowindow.open(map,marker);
					};
			  })(marker));
			}
			
		}
	});
	
}


