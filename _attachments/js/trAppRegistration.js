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

function trAppEditAppliance() {
	if (trApp.current_appliance == undefined || trApp.current_appliance.private == undefined) {
		trAppActivateTab(0);
		return;
	}
	var return_html = "<table cellpadding='0' cellspacing='0' border='0' class='transparent_table'><tr valign='top'><td class='transparent_table'><form id=\"private_data\" onsubmit=\"trApp.save_flags.private = true; trAppActivateTab(3); return false;\"><input class='store' name=\"id\" id=\"id\" type=\"hidden\" value=\""+trApp.current_appliance.private.id+"\">\n";
	return_html += "<table>";
	// test for hardware id, don't display an id if it's not hardware
	var hw_id = trAppHardwareId(trApp.current_appliance.private.id);
	if (hw_id != "") {
		return_html += "<tr><th class='column'>Hardware ID</th><td>"+hw_id+"</td></tr>";
	}
	return_html += "<tr><th class='column'>Address</th><td><input class='store' name=\"address\" id=\"address\" type=\"text\" size=\"40\" title='Address where the appliance will be located, including City and State. We need enough information to map the location.'></td></tr>";
	return_html += "<tr><th class='column'>Nickname</th><td class='tippable' _title='A name that will identify this particular appliance to you.'><input class='store' name=\"nickname\" id=\"nickname\" type=\"text\" size=\"25\" title='A name that will identify this particular appliance to you.'></td></tr>";
	return_html += "<tr><th class='column'>Time Zone</th><td><select class='store' name=\"timezone\" id=\"timezone\" title='The time zone in which the appliance resides.'><option>America/Los_Angeles</option><option>America/Denver</option><option>America/Chicago</option><option>America/New_York</option></select></td></tr>";
	return_html += "</table></form></td><td class='transparent_table'>&nbsp;&nbsp;</td><td class='transparent_table'><div style=\"border: solid 1px; width:120px; height:120px\" id='thumbnail_map'></div><div class='fineprint' style='width: 120px'>Please check that address is mapped correctly.</div></td><td class='transparent_table'>&nbsp;&nbsp;</td><td class='transparent_table'><form onsubmit=\"trApp.save_flags.private = true; trAppActivateTab(3); return false;\"><input type='image' src='images/next.png'></form><div id='private_tips'></div></td></tr></table>";
	$("#fold2").html(return_html);
 
	trApp.current_appliance['private']['mapped_address'] = ""; // force geocoding
	trAppGeocodePrivateApplianceConfig();
	trAppTestCompletePrivateApplianceConfig();
	$("#private_data :input").each(function(index,field) {
		if (field.name) {
			jQuery(field).val(trApp.current_appliance['private'][field.name]);
		}
	});
	$(".store").focus(function() {
	  $('#private_tips').html(this.title);
		$('#private_tips').animate( { backgroundColor: 'yellow' }, 0).animate( { backgroundColor: 'white' }, 5000);
	});
	$(".store").change(function() {
	  trAppTrackPrivateApplianceState();
	});
	$(".store").mouseout(function() {
	  trAppTrackPrivateApplianceState();
	});
	$(".store").blur(function() {
	  trAppTrackPrivateApplianceState();
	});
	$("#address").change(function() {
	  trAppGeocodePrivateApplianceConfig();
	});
	
	if (trApp.current_appliance['private']['publicly_displayable'] == 'on') {
		$("#publicly_displayable").attr('checked', true);
	} else {
		$("#publicly_displayable").attr('checked', false);
	}
}

function trAppTrackPrivateApplianceState() {
	var inputs = $("#private_data :input");
	var obj = $.map(inputs, function(n, i)
	{
			if (n.name) {
		    trApp.current_appliance['private'][n.name] = $(n).val();
		  }
	});
	var check_test = $("#publicly_displayable");
	if (check_test.attr("checked") != "undefined" && check_test.attr("checked")) {
		trApp.current_appliance['private']['publicly_displayable'] = 'on';
	} else {
		trApp.current_appliance['private']['publicly_displayable'] = '';
	}
	trApp.save_flags.private = true;
	trAppTestCompletePrivateApplianceConfig();
	
}

function trAppGeocodePrivateApplianceConfig() {
	if (populated(trApp.current_appliance['private']['address'])) {
		if (trApp.current_appliance['private']['address'] != trApp.current_appliance['private']['mapped_address']) {
			var geocoder = new google.maps.Geocoder();
		  geocoder.geocode( { 'address': trApp.current_appliance['private']['address'] }, function(results, status) {
		    if (status == google.maps.GeocoderStatus.OK) {
		      var latlng = results[0].geometry.location;
		      trApp.current_appliance['private']['lat'] = latlng.lat();
		      trApp.current_appliance['private']['lng'] = latlng.lng();
		      trApp.save_flags.private = true;
		      trAppTestCompletePrivateApplianceConfig();
		      trApp.current_appliance['private']['mapped_address'] = trApp.current_appliance['private']['address'];
		      trAppMapApplianceThumbnail();
		    } else {
		    	alert("Could not locate that address.");
		    	trApp.current_appliance['private']['mapped_address'] = "";
		    	$("#thumbnail_map").html("");
		    }
		  });
		}
	} else {
    trApp.current_appliance['private']['lat'] = '';
    trApp.current_appliance['private']['lng'] = '';
    $("#thumbnail_map").html("");
	}
}

function trAppTestCompletePrivateApplianceConfig() {
	return;
	var passed = true;
	$.each(['lat', 'lng', 'nickname', 'address', 'contact_email'], function(index, value) { 
	  if (!populated(trApp.current_appliance['private'][value])) {
	  	passed = false;
	  }
	});

	if (passed) {
		$("#submit").removeAttr('disabled');
	} else {
		$("#submit").attr("disabled", "disabled");
	}
}

function trAppMapApplianceThumbnail() {
	if (populated(trApp.current_appliance['private']['lat']) && populated(trApp.current_appliance['private']['lng'])) {
		var latlng = new google.maps.LatLng(trApp.current_appliance['private']['lat'], trApp.current_appliance['private']['lng']);
	  var myOptions = {
	    zoom: 14,
	    center: latlng,
	    mapTypeId: google.maps.MapTypeId.ROADMAP,
	    mapTypeControl: false,
	    navigationControl: false,
	    scaleControl: false,
	    disableDefaultUI: true,
	    draggable: false,
	    scrollwheel: false
	  };
	  var map = new google.maps.Map(document.getElementById("thumbnail_map"), myOptions);
	  
	  // add marker to map
		var marker = new google.maps.Marker({
		     position: latlng,
		     icon: 'images/small_star.png',
		     draggable: false
		});		
		marker.setMap(map); 
	}
}

