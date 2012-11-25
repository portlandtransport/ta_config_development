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
	
	var $db = $.couch.db(trApp.dbname);
	$db.saveDoc(trApp.current_appliance, {});
	
}

function trAppLoadApplianceConfig(id) {
	// query for it
	var query_url = "http://transitappliance.couchone.com/"+trApp.dbname+"/"+id;
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
	var query_url = "http://transitappliance.couchone.com/"+trApp.dbname+"/"+id;
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
