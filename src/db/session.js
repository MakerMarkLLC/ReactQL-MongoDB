/* eslint-disable import/prefer-default-export, no-param-reassign */
/* eslint  no-underscore-dangle: ["error", { "allow": ["_id"] }] */

// Session table

// ----------------------
// IMPORTS

/* NPM */

import mongoose from 'mongoose';
import isEmail from 'isemail';

/* Local */

// Hashing/JWT
import { checkPassword, encodeJWT, decodeJWT } from 'src/lib/hash';

// Error handler
import FormError from 'src/lib/error';

// DB

import { User } from './user';

// ----------------------

// Define `Session` object.
const Schema = mongoose.Schema;
const sessionSchema = new Schema({
  id: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
  expiresAt: Date,
  token: String,
});

export const Session = mongoose.model('session', sessionSchema);

// return User associated with Session
Session.prototype.getUser = session => User.findOne({ id: session.userId });


// Create a new session.  Accepts a loaded user instance, and returns a
// new session object
export async function createSession(user) {
  const session = new Session({
    userId: user.id,
  });

  const now = new Date();
  now.setDate(now.getDate() + 30);

  session.id = session._id;
  session.expiresAt = now;
  session.token = encodeJWT({ id: session.id });

  return new Promise((resolve, reject) => {
    session.save(err => {
      if (err) reject(err);
      else resolve(session);
    });
  });
}

// Retrieve a session based on the JWT token.
export async function getSessionOnJWT(token) {
  const e = new FormError();
  let session;

  try {
    // Attempt to decode the JWT token
    const data = decodeJWT(token);

    // We should have an ID attribute
    if (!data.id) throw new Error();

    // Check that we've got a valid session
    session = await Session.findById(data.id);
    if (!session) throw new Error();
  } catch (_) {
    e.set('session', 'Invalid session ID');
  }

  // Throw if we have errors
  e.throwIf();

  return session;
}

// Login a user. Returns the inserted `session` instance on success, or
// throws on failure
export async function login(data) {
  const e = new FormError();

  /* Validate data */

  // Email
  if (!data.email) {
    e.set('email', 'Please enter your e-mail address.');
  } else if (!isEmail.validate(data.email)) {
    e.set('email', 'Please enter a valid e-mail.');
  }

  // Password
  if (!data.password) {
    e.set('password', 'Please enter your password.');
  } else if (data.password.length < 6 || data.password.length > 64) {
    e.set('password', 'Please enter a password between 6 and 64 characters in length');
  }

  // Any errors?
  e.throwIf();

  // Attempt to find the user based on the e-mail address
  const user = await User.findOne({ email: data.email });

  // If we don't have a valid user, throw.
  if (!user) {
    e.set('email', 'An account with that e-mail does not exist. Please check and try again');
  }

  e.throwIf();

  // Check that the passwords match
  if (!await checkPassword(data.password, user.password)) {
    e.set('password', 'Your password is incorrect. Please try again or click "forgot password".');
  }

  e.throwIf();

  // Create the new session
  return createSession(user);
}
