// Database connection.

// ----------------------
// IMPORTS

/* NPM */

const mongoose = require('mongoose');

// ----------------------

mongoose.connect('mongodb://localhost:graphql', error => {
  if (error) console.error('mongo error', error);
  else console.log('mongo connected');
});
