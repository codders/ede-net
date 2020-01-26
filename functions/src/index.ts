import './express-types';
import * as functions from 'firebase-functions';
import { validateFirebaseIdToken,
         loadProfile,
         updateProfile,
         lookupUserByEmail,
         createSignupInvitation,
         loadSignupInvitation,
         acceptSignupInvitation,
         nameForUser } from './firebase-wrapper';
import { sendInvitationEmail } from './emailer'

const express = require('express')
const cookieParser = require('cookie-parser')();
const cors = require('cors')({origin: true});
const app = express();

app.use(validateFirebaseIdToken);
app.use(cors);
app.use(cookieParser);
app.get('/profile', (request: express.Request, response: express.Response) => {
  console.log('Loading profile for user ' + request.user.uid)
  loadProfile(request.user.uid).then(profile => {
    response.status(200).send(profile)
  })
  .catch(err => {
    console.log('Unable to load profile', err)
    response.status(201).send({ id: request.user.uid })
  })
});
app.post('/profile', (request: express.Request, response: express.Response) => {
  console.log('Updating profile for user ' + request.user.uid)
  updateProfile(request.user.uid, Object.assign({}, request.body)).then(profile => {
    response.status(201).send(profile)
  })
  .catch(err => {
    console.log('Unable to save profile', err)
    response.status(500).send({ message: 'Error updating profile' })
  })
});

app.post('/inviteFriendByEmail', (request: express.Request, response: express.Response) => {
  const email = Object.assign({}, request.body).email;
  console.log('Inviting friend by email: ', email);
  lookupUserByEmail(email).then(friend => {
    console.log('email exists in system - not sending invite')
    response.status(409).send({
      code: 'ALREADY_EXISTS',
      message: 'Email address matches existing user'
    })
  })
  .catch(err => {
    console.log('Email not found in system - sending invitation', err)
    return nameForUser(request.user.uid).then(name => {
      createSignupInvitation(request.user.uid, email)
      .then(inviteid => {
        sendInvitationEmail(email, inviteid, name).then(result => {
          console.log('Email sent')
          response.status(201).send({
            message: 'Invitation sent'
          })
        })
        .catch(inviteerr => {
          console.log('Error sending invitation', inviteerr)
          response.status(500).send({
            message: 'Unable to send invitation'
          })
        })
      })
      .catch(error => {
        console.log('Unable to create signup invite record', error)
        response.status(500).send({
          message: 'Unable to create signup invite record'
        })
      })
    })
  })
});

app.get('/invite/:id', (request: express.Request, response: express.Response) => {
  console.log('Loading invite ' + request.params.id + ' user is', request.user)
  loadSignupInvitation(request.params.id).then(invite => {
    return nameForUser(invite.inviter).then(name => {
      response.status(200).send(Object.assign({ inviterName: name}, invite))
    })
  })
  .catch(err => {
    console.log('Unable to load invite', err)
    response.status(404).send({ message: 'no such invite' })
  })
});

app.post('/invite/:id', (request: express.Request, response: express.Response) => {
  console.log('Accepting invite ' + request.params.id + ' user is', request.user)
  if (request.user === undefined || request.user.uid === undefined) {
    response.status(403).send({ message: 'You need to log in to accept and invite'})
    return
  }
  loadSignupInvitation(request.params.id).then(invite => {
    return nameForUser(invite.inviter).then(name => {
      const inviteWithName = Object.assign({ inviterName: name }, invite)
      return acceptSignupInvitation(request.user.uid, inviteWithName).then(result => {
        response.status(201).send(Object.assign({ accepted: true }, inviteWithName))
      })
    })
  })
  .catch(err => {
    console.log('Unable to accept invite', err)
    response.status(404).send({ message: 'no such invite' })
  })
});

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.app = functions.region('europe-west1').https.onRequest(app);
