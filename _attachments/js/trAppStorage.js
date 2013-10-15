/*
   Copyright 2010-2012 Portland Transport

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


// functions related to storing/reading appliance state

function trAppCreateAppliance(appliance_id) {
	// re-initialize state to create a new configuration
	if (trApp.clone_appliance) {
		trApp.current_appliance = trApp.clone_appliance;
		trApp.current_appliance.private.id = appliance_id;
		trApp.current_appliance.public.id = appliance_id;
		trApp.current_appliance.private.nickname = "";
		trApp.current_appliance["_id"] = trApp.current_appliance.private.id;
		delete trApp.current_appliance["_rev"];
	} else {
		trApp.current_appliance.private = {}; // all data is public now
		trApp.current_appliance.public = {}; // public configuration elements, available to anyone who presents id
		trApp.current_appliance.private.id = appliance_id;
		trApp.current_appliance.public.id = appliance_id;
		trApp.current_appliance.public.stops = {};
		trApp.current_appliance.public.stop_cache = {};
	}
	
	// private piece
	trAppStoreConfiguration();

	return true;
}

function trAppStoreConfiguration() {
	/* stores either public or private parts of configuration
	inputs:
		none
	outputs:
		none
	operates on global trApp.current_appliance data
	errors are flagged only on synchronous saves, async saves are allowed to fail silently
	*/
	
	trApp.current_appliance["_id"] = trApp.current_appliance.private.id; // set couch id
	trApp.current_appliance["author"] = trApp.author;
	trApp.current_appliance["created_at"] = (new Date()).toJSON();
	
	// create URL
  if (trApp.current_appliance.public.application != undefined && trApp.current_appliance.public.application.id != undefined) {
 		var application_data = trApp.applications.applicationData(trApp.current_appliance.public.application.id);
 		trAppFormatURLs(application_data,trApp.current_appliance)
  }
	
	var $db = $.couch.db(trApp.dbname);
	$db.saveDoc(trApp.current_appliance, {});
	
}

function trAppFormatURLs(application,config) {
				
	if (config.public.stops != undefined && config.public.application != undefined && config.public.application.id != undefined && config.public.application.options != undefined) {
		// populate all the config values we will need
		
		if (config.public.timezone == undefined) {
			config.public.timezone = "America/Los_Angeles";
		}
  				  	
		var option_name_value_pair_array = new Array();
		var fully_qualified_option_name_value_pair_array = new Array();
		if (config.public.application.options == undefined) {
			config.public.application.options = [];
		}
		for (var i = 0; i < config.public.application.options.length; i++){ 
	  	var option = config.public.application.options[i]; 
	  	option_name_value_pair_array.push(option.name+"="+option.value);
	  	fully_qualified_option_name_value_pair_array.push("option["+option.name+"]="+option.value);
		} 
		
  	option_name_value_pair_array.push("lat="+config.private.lat);
  	fully_qualified_option_name_value_pair_array.push("option[lat]="+config.private.lat);
  	
  	option_name_value_pair_array.push("lng="+config.private.lng);
  	fully_qualified_option_name_value_pair_array.push("option[lng]="+config.private.lng);
	  	
		config.public.application.simple_option_string = option_name_value_pair_array.join('&')+"";
		config.public.application.fully_qualified_option_string = fully_qualified_option_name_value_pair_array.join('&')+"";
		
		var multi_agency_stop_array = new Array();
		for (var agency in config.public.stops) {
			for (var stop_id in config.public.stops[agency]) {
				var all_true = true;
				for (var route_id in config.public.stops[agency][stop_id]) {
					all_true = all_true && config.public.stops[agency][stop_id][route_id];
				}
				if (all_true) {
					multi_agency_stop_array.push("stop["+agency+"]["+stop_id+"]=*");
				} else {
					for (var route_id in config.public.stops[agency][stop_id]) {
						if (config.public.stops[agency][stop_id][route_id]) {
							multi_agency_stop_array.push("stop["+agency+"]["+stop_id+"]="+route_id);
						}
					}
				}
			}
		}
		config.public.multi_agency_stop_string = multi_agency_stop_array.join("&");
		
		
		var expanded = [];
		
		for (var i = 0; i < application.templates.length; i++){ 
	  	var app_template = application.templates[i].app_url;
	  	var img_template = application.templates[i].img_url;
	  	var app_url = app_template.process(config.public);
	  	var img_url = img_template.process(config.public);
	  	expanded.push( { "app_url": app_url, "img_url": img_url } );
		} 
		
		config.external_configuration = {"url": expanded[0].app_url, "urls": expanded};

	}
	
}

function trAppLoadApplianceConfig(id) {
	// query for it
	var query_url = "http://transitappliance.iriscouch.com/"+trApp.dbname+"/"+id;
	$.ajax({
	  url: query_url,
  	async: false,
	  success: function(data) {
				trApp.current_appliance = data;
	  },
	  error: function(XMLHttpRequest, textStatus, errorThrown) {
	  	alert('Error: could not find appliance configuration.');
		},
	  dataType: "json"
	});
}

function trAppCloneApplianceConfig(id) {
	// query for it
	var query_url = "http://transitappliance.iriscouch.com/"+trApp.dbname+"/"+id;
	$.ajax({
	  url: query_url,
  	async: false,
	  success: function(data) {
				trApp.clone_appliance = data;
				trAppActivateTab(1);
	  },
	  error: function(XMLHttpRequest, textStatus, errorThrown) {
	  	alert('Error: could not find appliance configuration.');
		},
	  dataType: "json"
	});
}

function trAppDeleteApplianceConfig(_docId,_rev,force,callback) {
	
	var answer = false;
	if (!force) {
		answer = confirm("Are you sure you want to delete this appliance configuration?");
	}

	if (answer || force) {
		// clear flags for any pending saves
		trApp.save_flags = { private: false, public: false };
		var $db = $.couch.db(trApp.dbname);
		$db.removeDoc({"_id": _docId, "_rev": _rev}, {success: callback});
	}
}
