// DB fixtures.  In this demo app, we'll add a new user to

// ----------------------
// IMPORTS

/* App */

// Grab the users we want to add to the DB by default
import { users } from 'src/common';


// Our models have convenience features like `createUser` for adding a new
// user -- grab what we need here so that we can add some fixtures below
import { createUser } from './user';

// ----------------------

// Create the new users.  `createUser` returns a Promise, so we'll return
// a Promise that resolves once the array of `createUsers` Promises have all
// resolved (that way, we know that all users have been added)
Promise.all(users.map(user => createUser(user)));
