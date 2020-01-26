import axios from 'axios'

import { auth, GoogleProvider } from '@/services/fireinit.js'

/* Plugin appears to cause problems with strict mode
   Disabling strict mode here */
export const strict = false
/* -Friends firestore */

const emptyUser = {
  email: null,
  displayName: null,
  uid: null,
  photoURL: null
}

export const state = () => ({
  user: Object.assign({}, emptyUser),
  friends: [],
  loadedFriends: false,
  whatsUp: [],
  profile: {}
})

export const getters = {
  activeUser: (state, getters) => {
    if (state.user.uid !== null) {
      return state.user
    } else {
      return null
    }
  },
  friends: state => {
    return state.friends
  },
  whatsUp: state => {
    return state.whatsUp
  }
}

export const mutations = {
  setUser(state, payload) {
    if (payload === null) {
      state.user = Object.assign({}, emptyUser)
      state.profile = {}
    } else {
      state.user.email = payload.email
      state.user.displayName = payload.displayName
      state.user.photoURL = payload.photoURL
      if (state.user.uid !== payload.uid) {
        state.user.uid = payload.uid
      }
    }
  },
  setIdToken(state, payload) {
    state.idToken = payload
  },
  updateProfile(state, profile) {
    state.profile = profile
  }
}

const BASE_URL = 'https://europe-west1-ede-net.cloudfunctions.net/app'

export const actions = {
  signInWithGoogle({ commit }) {
    return auth.signInWithRedirect(GoogleProvider)
  },

  signInWithEmail({ commit }, payload) {
    return auth
      .signInWithEmailAndPassword(payload.email, payload.password)
      .then(function(result) {
        console.log('Result', result)
      })
  },

  signUpWithEmail({ commit, dispatch }, payload) {
    return auth
      .createUserWithEmailAndPassword(payload.email, payload.password)
      .then(function(result) {
        console.log('Create result', result)
        return result.user.getIdToken().then(function(idToken) {
          commit('setIdToken', idToken)
          return dispatch('updateProfile', { name: payload.name })
        })
      })
  },

  signOut({ commit }) {
    auth
      .signOut()
      .then(() => {
        commit('setUser', null)
      })
      .catch(err => console.log(err)) // eslint-disable-line no-console
  },

  userChanged({ commit, state, dispatch }, { user, idToken }) {
    commit('setIdToken', idToken)
    if (state.user === undefined || state.user.uid !== user.uid) {
      commit('setUser', user)
      console.log('Loggedin', { user, idToken }) // eslint-disable-line no-console
      return dispatch('loadProfile')
    }
  },

  clearUser({ commit, dispatch }) {
    commit('setUser', null)
    commit('setIdToken', null)
  },

  inviteFriendByEmail({ dispatch, state, commit }, email) {
    return axios({
      method: 'post',
      url: BASE_URL + '/inviteFriendByEmail',
      data: { email },
      headers: {
        Authorization: 'Bearer ' + state.idToken
      }
    })
  },

  loadProfile({ state, commit, dispatch }) {
    return axios({
      method: 'get',
      url: BASE_URL + '/profile',
      headers: {
        Authorization: 'Bearer ' + state.idToken,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        let changed = false
        const profileUpdate = {}
        if (response.data.name == null && state.user.displayName !== null) {
          profileUpdate.name = state.user.displayName
          changed = true
        }
        if (response.data.email == null) {
          profileUpdate.email = state.user.email
          changed = true
        }
        if (response.data.photoURL == null && state.user.photoURL !== null) {
          profileUpdate.photoURL = state.user.photoURL
          changed = true
        }
        if (changed) {
          return dispatch('updateProfile', profileUpdate)
        } else {
          commit('updateProfile', response.data)
          return Promise.resolve(response.data)
        }
      })
      .catch(error => {
        console.log('Unable to load profile', error) // eslint-disable-line no-console
      })
  },

  updateProfile({ state, commit }, profileUpdate) {
    return axios({
      method: 'post',
      url: BASE_URL + '/profile',
      data: profileUpdate,
      headers: {
        Authorization: 'Bearer ' + state.idToken,
        'Content-Type': 'application/json'
      }
    })
      .then(postResponse => {
        commit('updateProfile', profileUpdate)
        return postResponse.data
      })
      .catch(error => {
        console.log('Unable to update profile', error) // eslint-disable-line no-console
      })
  }
}
