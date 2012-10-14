	function(newDoc, oldDoc, userCtx) {
		
        if (userCtx.roles.indexOf('_admin') !== -1) {
            return;
        } else {
        		if (!userCtx.name) {
        			throw({forbidden: 'You need to be logged in to make updates.'});
        		}
        		if ( ( oldDoc && userCtx.name != oldDoc.author ) || ( userCtx.name != newDoc.author && !newDoc._deleted ) ) {
            	throw({forbidden: 'You may only update docs you created.'});
            }
        }
        
  }