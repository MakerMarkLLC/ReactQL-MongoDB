/* eslint-disable import/prefer-default-export  no-underscore-dangle */
/* eslint  no-underscore-dangle: ["error", { "allow": ["_id"] }] */

import mongoose from 'mongoose';

import isEmail from 'isemail';

/* Local */

// Bcrypt hashing, for use with passwords
import { generatePasswordHash } from 'src/lib/hash';

// Error handler
import FormError from 'src/lib/error';

// ----------------------

const Schema = mongoose.Schema;

// Define `User` object.
const userSchema = new Schema({
  id: Schema.Types.ObjectId,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  firstName: String,
  lastName: String,
});

export const User = mongoose.model('user', userSchema);

// Create user function.  This will return a Promise that resolves with the
// `user` instance
export async function createUser(data) {
  // Create a blank `FormError` instance, in case we need it
  const e = new FormError();

  /* Sanity check for input */

  // E-mail
  if (!data.email) {
    e.set('email', 'Please enter your e-mail address.');
  } else if (!isEmail.validate(data.email)) {
    e.set('email', 'Please enter a valid e-mail.');

    // Check that the e-mail isn't already taken
  } else if (await User.findOne({ email: data.email })) {
    e.set('email', 'Your e-mail belongs to another account. Please login instead.');
  }

  // Password
  if (!data.password) {
    e.set('password', 'Please enter a password');
  } else if (data.password.length < 6 || data.password.length > 64) {
    e.set('password', 'Please enter a password between 6 and 64 characters in length');
  }

  // First name
  if (!data.firstName) {
    e.set('firstName', 'Please enter your first name.');
  } else if (data.firstName.length < 2 || data.firstName.length > 32) {
    e.set('firstName', 'Your first name needs to be between 2-32 characters in length.');
  }

  // Last name
  if (!data.lastName) {
    e.set('lastName', 'Please enter your last name.');
  } else if (data.lastName.length < 2 || data.lastName.length > 32) {
    e.set('lastName', 'Your last name needs to be between 2-32 characters in length.');
  }

  // Do we have an error?
  e.throwIf();

  // All good - proceed
  const user = new User({
    email: data.email,
    password: await generatePasswordHash(data.password),
    firstName: data.firstName,
    lastName: data.lastName,
  });

  user.id = user._id;

  return new Promise((resolve, reject) => {
    user.save(err => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

// Function to create a user based on a social profile. In this function, we
// will first check to see if the user already exists (based on an e-mail
// address), and return that.  Otherwise, we'll create a new user. Note: with
// this user type, password is null by default, so the user won't be able to
// login via the traditional username + password
export async function createUserFromSocial(data) {
  // Check if we have an existing user
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) return existingUser;

  // Nope -- let's create one

  // All good - proceed
  const user = new User({
    email: data.email,
    password: null,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  user.id = user._id;

  return new Promise((resolve, reject) => {
    user.save(err => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}
