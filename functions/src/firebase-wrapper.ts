import './ede-types';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://ede-net.firebaseio.com"
});

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
export const validateFirebaseIdToken = (req: express.Request, res: express.Response, next: () => void) => {
  console.log('Check if request is authorized with Firebase ID token', req.method);
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
      !(req.cookies && req.cookies.__session)) {
    if (req.path.startsWith('/invite/')) {
      console.log('Skipping auth for invite route')
      next()
      return;
    } else {
      console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
          'Make sure you authorize your request by providing the following HTTP header:',
          'Authorization: Bearer <Firebase ID Token>',
          'or by passing a "__session" cookie.');
      res.status(403).send('Unauthorized');
      return;
    }
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else if(req.cookies) {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  } else {
    // No cookie
    res.status(403).send('Unauthorized');
    return;
  }

  admin.auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      console.log('ID Token correctly decoded', decodedIdToken);
      req.user = decodedIdToken;
      console.log('Set user property of req');
      next();
    })
    .catch(error => {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(403).send('Unauthorized');
    });
};

export const createSignupInvitation = (userId: string, invitedemail: string) => {
  const savedRecord = {
    email: invitedemail,
    inviter: userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  }
  return admin.firestore().collection('signup-invitations').add(savedRecord)
    .then(function(doc) {
      return doc.id;
    })
    .catch(function(error) {
      console.error('Unable to save signup invitation record', error);
      return "error";
    })
}

export const acceptSignupInvitation = (uid: string, invite: ede.SavedSignupInviteWithName) => {
  return admin.firestore().collection('signup-invitations').doc(invite.id).update({ accepted: true })
}

export const loadSignupInvitation = (inviteId: string) => {
  return admin.firestore().collection('signup-invitations').doc(inviteId).get()
    .then(function(doc) {
      if (doc.exists) {
        const data = doc.data() as ede.SignupInvite
        return Object.assign({ id: inviteId }, data)
      } else {
        throw new Error('No such invite: ' + inviteId)
      }
    })
}

export const profileForUser = (uid: string): Promise<ede.ProfileDetails> => {
  return admin.firestore().collection('users')
    .doc(uid)
    .get().then(function(userDoc) {
      if (userDoc.exists) {
        const userDocData = userDoc.data()
        if (userDocData !== undefined) {
          return {
            name: userDocData.name,
            photoURL: userDocData.photoURL
          }
        } else {
          throw new Error('User data doc undefined for user: ' + uid)
        }
      } else {
        throw new Error('Unable to load user doc for user: ' + uid)
      }
    })
}

export const nameForUser = (uid: string): Promise<string> => {
  return profileForUser(uid).then(function(profile) {
    return profile.name
  })
}

export const lookupUserByEmail = (email: string): Promise<ede.ProfileDetails> => {
  return admin.firestore().collection('users')
    .where("email", "==", email)
    .get()
    .then(function(querySnapshot) {
      if (querySnapshot.size !== 1) {
        throw new Error('No such friend')
      } else {
        let result = null;
        querySnapshot.forEach(function(doc) {
          result = doc.data() as ede.ProfileDetails;
        })
        if (result === null) {
          throw new Error('Logic error finding friend')
        } else {
          console.log('Lookup result', result)
          return result;
        }
      }
    })
}

export const loadProfile = (uid: string) => {
  return admin.firestore().collection('users').doc(uid).get().then(docSnapshot => {
    if (docSnapshot.exists) {
      return Promise.resolve(Object.assign({}, docSnapshot.data()))
    } else {
      const baseProfile = {
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        created_by: uid,
        id: uid,
        uid: uid
      }
      return admin.firestore().collection('users').doc(uid).set(baseProfile).then(writeResult => {
        return baseProfile
      })
    }
  })
};

export const updateProfile = (uid: string, profile: { [id:string]: string }) => {
  const profileUpdate = Object.assign({
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_by: uid
  }, profile)
  return loadProfile(uid).then(loadedProfile => {
    return admin.firestore().collection('users').doc(uid).update(profileUpdate).then(writeResult => {
      return Object.assign(loadedProfile, profileUpdate)
    })
  })
}
