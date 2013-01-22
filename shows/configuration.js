function(doc, req) { 
	if (doc && doc.external_configuration) {    
		return {     
			headers: {"Access-Control-Allow-Origin": "*"},     
			body: toJSON(doc.external_configuration)   
		}   
	} else {    
		return {    
			headers: {"Access-Control-Allow-Origin": "*"},     
			body: '{"error":"No matching configuration found"}'   
		}  
	}   
}  