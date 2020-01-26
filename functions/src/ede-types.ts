declare namespace ede {

  interface ProfileDetails {
    name: string,
    photoURL: string
  }

  interface SignupInvite {
      email: string,
      inviter: string
  }

  interface SavedSignupInvite extends SignupInvite {
    id: string
  }

  interface SavedSignupInviteWithName extends SavedSignupInvite {
    inviterName: string
  }

}
