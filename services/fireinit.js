import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

const config = {
  apiKey: "AIzaSyC8Sd2PzRo87szJcrCHRQuejItjzBCES38",
  authDomain: "ede-net.firebaseapp.com",
  databaseURL: "https://ede-net.firebaseio.com",
  projectId: "ede-net",
  storageBucket: "ede-net.appspot.com",
  messagingSenderId: "838733130087",
  appId: "1:838733130087:web:2e298e07ccfbb9db7327c2"
};

if (!firebase.apps.length) {
  firebase.initializeApp(config)
}
export const GoogleProvider = new firebase.auth.GoogleAuthProvider()
export const auth = firebase.auth()
export const StoreDB = firebase.firestore()
export default firebase
