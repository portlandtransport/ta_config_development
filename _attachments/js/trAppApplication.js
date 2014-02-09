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

function trAppSelectApplication() {
	
	var return_html = "";
	
	// get all applications
	
	var application_ids = trApp.applications.applicationIds();
	
	// need some kind of test for success?
	
	var default_app = 'tbdline';
	var url_templates = {};
	return_html += "<table class='transparent_table'><tr valign='top'><td class='transparent_table'><form><table><tr><th></th><th>Application</th><th width='300px'>Description</th><th>Systems</th></tr>\n";
	var first = " checked";
	if (application_ids.length > 0) {
		for (var i = 0; i < application_ids.length; i++) {
			var return_data = trApp.applications.applicationData(application_ids[i]);
			if (!return_data.hidden) {	
	  		if (default_app == undefined) {
	  			default_app = return_data.application_id; // first application is default
	  		}
	  		url_templates[return_data.application_id] = escape(return_data.url_template);
	  		var agencies = return_data.agencies.join(", ");
	  		var select_href = "javascript:trAppSetApplication('"+return_data.application_id+"')";
		    return_html += "<tr valign='top'><td><input type='radio' name='application_id' value='"+return_data.application_id+"'"+first+" onclick=\"trAppSetApplication('"+return_data.application_id+"')\"></td><td><a href=\""+select_href+"\"><img border='2' src='images/"+return_data.application_id+".jpg'/></a></td><td><a href=\""+select_href+"\">"+return_data.title+"</a><p>"+return_data.description+"</p></td><td>"+agencies+"</td></tr>";
		  	first = "";
		  }
		}
		return_html += "</table></form></td><td class='transparent_table'>&nbsp;&nbsp;</td><td class='transparent_table'><h4>Nickname: "+trApp.current_appliance.private.nickname+"</h4><form onsubmit='trAppActivateTab(5);return false;'><input type='image' src='images/next.png'></form></td></tr></table>\n";

  } else {
  	return_html += "No applications defined.";
  }
  $("#fold4").html(return_html);

  if (trApp.current_appliance.public.application != undefined && trApp.current_appliance.public.application.id != undefined) {
  	trAppSetApplication(trApp.current_appliance.public.application.id);
  } else {
  	trAppSetApplication(default_app);
  }
  		
}

function trAppSetApplication(application_id) {
	// sets radio button, then advances to next tab
	$('input[name="application_id"]').attr('checked', false);
	$('input[value="'+application_id+'"]').attr('checked', true);
	trAppStoreApplication(application_id);
}

function trAppStoreApplication(application_id,url_template) {
	if (trApp.current_appliance.public.application == undefined) {
		trApp.current_appliance.public.application = {};
	}
	trApp.current_appliance.public.application.id = application_id;
	trApp.save_flags.public = true;
}

function trAppConfigureOptions() {
	
	var application_data = trApp.applications.applicationData(trApp.current_appliance.public.application.id);
	var return_html = "<table class='transparent_table'><tr valign='top'><td class='transparent_table'><form id='application_options' onsubmit='trAppActivateTab(6); return false;'><table>";
	for (var i = 0; i < application_data.fields.length; i++) {
		return_html += "<tr><td>"+application_data.fields[i].label+"</td><td>"+application_data.fields[i].html+"</td><td>"+application_data.fields[i].advice+"</td></tr>";
	}
	return_html += "</table></form></td><td class='transparent_table'>&nbsp;&nbsp;</td><td class='transparent_table'><h4>Nickname: "+trApp.current_appliance.private.nickname+"</h4><form onsubmit='trAppActivateTab(6);return false;'><input type='image' src='images/next.png'></form></td></tr></table>";

  $("#fold5").html(return_html);
  if (trApp.current_appliance.public.application.options != undefined) {
  	var form_object = trAppReduceFormArray(trApp.current_appliance.public.application.options);
  	$("#application_options").populate(form_object);
  }
	    
}

function trAppReduceFormArray(options_array) {
	var options_object = {};
	for (var i = 0; i < options_array.length; i++){ 
  	option = options_array[i]; 
  	options_object[option.name] = option.value;
	} 
	return options_object;
}

function trAppSaveOptions() {
	trApp.current_appliance.public.application.options = $('#application_options').formToArray();
	// compute an options string for URL templates to use
	trApp.save_flags.public = true;
}

function trAppBuildURL() {
	
	var url = "";
	if (trApp.current_appliance.public.application != undefined && trApp.current_appliance.public.application.id != undefined) {
		
		// copy timezone
		if (trApp.current_appliance.private.timezone != undefined && typeof trApp.current_appliance.private.timezone != "object") {
			trApp.current_appliance.public.timezone = trApp.current_appliance.private.timezone;
		} else {
			trApp.current_appliance.public.timezone = "";
		}
		
		// get the url template
		
		var application_data = trApp.applications.applicationData(trApp.current_appliance.public.application.id);
		
		if (application_data != undefined) {
		
	  	var url_template = application_data.url_template;
	  	
	  	if (url_template != undefined) {
	  	
		  	var template_data = {};
		  	for(var i in trApp.current_appliance.public) {
		  		if (i != 'application') {
						template_data[i] = trApp.current_appliance.public[i];
					}
				}
				template_data.application = {};
				for(var i in trApp.current_appliance.public.application) {
					template_data.application[i] = trApp.current_appliance.public.application[i];
				}
		  	
				var option_name_value_pair_array = new Array();
				var fully_qualified_option_name_value_pair_array = new Array();
				if (trApp.current_appliance.public.application.options == undefined) {
					trApp.current_appliance.public.application.options = [];
				}
				for (var i = 0; i < trApp.current_appliance.public.application.options.length; i++){ 
			  	var option = trApp.current_appliance.public.application.options[i]; 
			  	option_name_value_pair_array.push(option.name+"="+option.value);
			  	fully_qualified_option_name_value_pair_array.push("option["+option.name+"]="+option.value);
				} 
				
		  	option_name_value_pair_array.push("lat="+trApp.current_appliance.private.lat);
		  	fully_qualified_option_name_value_pair_array.push("option[lat]="+trApp.current_appliance.private.lat);
		  	
		  	option_name_value_pair_array.push("lng="+trApp.current_appliance.private.lng);
		  	fully_qualified_option_name_value_pair_array.push("option[lng]="+trApp.current_appliance.private.lng);
		  	
				template_data.application.simple_option_string = option_name_value_pair_array.join('&')+"";
				template_data.application.fully_qualified_option_string = fully_qualified_option_name_value_pair_array.join('&')+"";
				template_data.multi_agency_stop_string = trAppUpdateStopString();
				url = url_template.process(template_data);
			}
		}
		
	}
	
	return url;
}
	

function trAppTryIt() {
	var url = trAppBuildURL();
	trAppStoreConfiguration(); // forced save of public config
	$("#fold6").html(TrimPath.processDOMTemplate("template6", { nickname: trApp.current_appliance.private.nickname, url: url }));
}

function trAppReassembleURL(segment_object) {
	var url = "";
	if (segment_object != undefined && segment_object[0] != undefined) {
		url = segment_object[0].value;
		if (segment_object[0].next != undefined) {
			next = 1;
			while (next > 0) {
				url += "&"+segment_object[next].value;
				if (segment_object[next].next != undefined) {
					next = segment_object[next].next;
				} else {
					next = 0;
				}
			}
		}
	}
	return url;
}
		
	




