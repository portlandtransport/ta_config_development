
	

function trAppDisplayMyAppliances() {
	
	//Purpose: list current configurations, allow creation of a new one
	
	var return_html = "<p>";
	
	// get all existing configurations (private part)
	$.ajax({
	  url: "http://transitappliance.iriscouch.com/"+trApp.dbname+"/_design/"+trApp.dbname+"/_view/author?key=%22"+trApp.author+"%22",
	  success: function(data) {
	    if (data.rows.length > 0) {
	    	// sort by nickname
				data.rows.sort(function(a, b) {		
				    return a.value.private.nickname < b.value.private.nickname ? -1 : (a.value.private.nickname > b.value.private.nickname ? 1 : 0);
				});
	    	// table of existing configs
	    	return_html += "<table border='1' class='transparent_table'><tr valign='top'><td class='transparent_table'><table><tr><th>Appliance</th><th>Street Address</th></tr>\n";
	    	$(data.rows).each(function(index,return_data) {
	    		var hw_id = trAppHardwareId(return_data.value.private.id);
	    		var edit_string = "<a href=\"javascript:trAppLoadApplianceConfig('"+return_data.value.private.id+"'); trAppActivateTab( 2 );\">edit</a> | <a target=\"_blank\" href=\"http://transitappliance.com/cgi-bin/test_by_id.pl?id="+return_data.value.private.id+"\">test</a> | <a href=\"javascript:trAppDeleteApplianceConfig('"+return_data.value._id+"','"+return_data.value._rev+"',false,trAppDisplayMyAppliances);\">delete</a> | <a href=\"javascript:trAppCloneApplianceConfig('"+return_data.value._id+"')\">clone</a>";
	    		//trAppLoadApplianceConfig(return_data.id)
	    		//var url = trAppBuildURL();
	    		//if (url != undefined && url != "") {
	    		//	edit_string += "<a target='_blank' href='"+url+"'>try the configuration</a>";
	    		//} else {
	    		//	edit_string += "[configuation not yet completed]";
	    		//}
			    var address = return_data.value.private.address;
			    if (!populated(address) && !populated(hw_id)) {
			    	// delete the appliance, user apparently aborted before minimum config
			    	//trAppDeletePrivateApplianceConfig(return_data._docId,true)
			    } else {
				    //if (hw_id != "") {
				    	address += "<br><span class='fineprint'>"+return_data.value.public.application.id+" "+return_data.value.private.id+"</span>";
				    //}
				    var nickname = return_data.value.private.nickname;
				    if (nickname == undefined) {
				    	nickname = "[not yet named]";
				    }
				    return_html += "<tr valign=\"top\"><td><b>"+nickname+"</b><br><span class='fineprint'>"+edit_string+"</span></td><td>"+address+"</td></tr>";
				  }
			  });
			  return_html += "</table></td><td class='transparent_table'>&nbsp;&nbsp</td><td class='transparent_table'>\n";
			  return_html += "<nobr><form style='padding: 0px' id='create_appliance' onsubmit=\"trApp.clone_appliance = undefined;trAppActivateTab(1);return false;\">\
				<input type='image' src='images/create_another.png'></form></nobr></td></table>";

	    } else {
	    	return_html += "<table class='transparent_table' width='100%'><tr><td class='transparent_table' align='center'><h2>You have no display configurations yet</h2><img src='images/arrow-down-3.png'><br>";
	    	return_html += "<form onsubmit=\"trAppActivateTab(1);return false\"><input type='image' src=\"images/getstarted.png\"></form></td></tr></table>";
	    }
			return_html += "</p>";
	    $("#main_content").html(return_html);
	  },
	  error: function(XMLHttpRequest, textStatus, errorThrown) {
	  	$("#main_content").html("Sorry, we could not retrieve your Transit Appliance configurations. Error information:<p>"+textStatus+"<p>"+dump(errorThrown));
	  },
	  dataType: "json"
	});
	
}

function trAppCreateApplianceForm() {
	
	var return_html = "<table class='transparent_table'><tr valign='top'><td class='transparent_table'><form id='create_appliance' onsubmit=\"trAppActivateTab(2);return false;\"><table><tr><th>Is Your Display?</th></tr><tr><td>\
				<input type='radio' name='appliance_type' value='soft' checked>A web browser on a general-purpose computer?</td></tr>\
				<tr><td><input type='radio' name='appliance_type' value='hard'>A dedicated hardware appliance?\
				<blockquote id='hardware_id_form'>Hardware appliances display a network id in the form XX:XX:XX:XX:XX:XX at startup<br>when they are not yet configured. Please enter it here: <input style='border: solid 1px' type='text' size='18' name='hardware_id'></blockquote>\
			</td></tr></table></form></td><td class='transparent_table'>&nbsp;&nbsp;</td><td class='transparent_table'><form onsubmit=\"trAppActivateTab(2);return false;\"><input type='image' src='images/createit.png'></form></td></table>";
	$("#fold1").html(return_html);
	$('#hardware_id_form').hide();
	
	$($('input[name="appliance_type"]:radio')).click(function() {
		if (jQuery('input[name="appliance_type"]:radio:checked').val() == 'hard') {
			$('#hardware_id_form').show();
		} else {
			$('#hardware_id_form').hide();
		}
	});
}

/*
This block of code manages the private data
for a given appliance
*/

function trAppHardwareId(id) {
	// recognizes whether the id is MAC address and returns it, otherwise returns empty string
	var regex = /^MAC/;
	if (id.search(regex) != -1) {
		return id.substring(4);
	} else {
		return "";
	}
}
