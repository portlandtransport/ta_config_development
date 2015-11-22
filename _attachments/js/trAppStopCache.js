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

function trAppStopCache() {
	
	// ensure this is called as constructor
	
	if (!(this instanceof trAppStopCache)) {
		return new trAppStopCache();
	}
	
	// make this a singleton
	
	if (typeof trAppStopCache.instance === "object") {
		return trAppStopCache.instance;
	}
	
	trAppStopCache.instance = this;
	
	this.cache = {}; // our cache element
	
	this.addToCache = function(agency,stop_id,data) {
		if (this.cache[agency] == undefined) {
			this.cache[agency] = {};
		}
		this.cache[agency][stop_id] = data;
	}
	
	this.getCacheItem = function(agency,stop_id,callback) {
		
		var is_development = false;
		var stops_db = "transit_stops_production";
		if (location.href.match(/development/)) {
			var stops_db = "transit_stops_loading";
			is_development = true;
		}
		
		// get the stop info

		var service_url = "/transit_stops_production/"+agency+":"+stop_id;
		
		/*
		var alternate_url = "http://stops2.transitappliance.com/stop/"+agency+":"+stop_id;

		if (Math.random() > 0.5) {
			service_url = alternate_url;
		}
		*/

		//trArrLog("Loading info for "+stop.agency+" stop "+stop.stop_id+"<br>");
		jQuery.ajax({
	    type: "GET",
			url: service_url,
			timeout: 2000,
			dataType: "json",
			success: function(data) {
				if (typeof data !== "undefined") {
					//debug_alert(data.rows[0].value);
					trAppStopCache.instance.addToCache(data.agency,data.stop_id,data);
					//trArrLog("success<br>");
					callback();
				} else {
					//trAppStopCache().cache[agency][stop_id] = false;
					//trArrLog("<font color='orange'>"+stop.agency+" stop "+stop.stop_id+" is not defined - no arrivals will be reported for this stop.</font><br>");
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				//trArrLog("<font color='red'>error "+dump(jqXHR.status)+"</font><br>");
			}				
		});
	}
	
	this.stopData = function(agency,stop_id) {
		if (this.cache[agency]) {
			if (this.cache[agency][stop_id]) {
				return this.cache[agency][stop_id];
			} else {
				return undefined;
			}
		} else {
			return undefined;
		}
	}
	

}


