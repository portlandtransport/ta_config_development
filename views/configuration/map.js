function(doc) {
  if (doc) {
    emit(doc._id, doc.external_configuration);
  }
};