<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <v-card>
        <v-card-title jest="headline">
          {{ greetingString }}
        </v-card-title>
        <v-card-text v-if="!$store.getters.activeUser">
          <v-row>
            <v-col class="info-text">
              <p>
                Sign in to connect to other EDE participants and see what projects they are involved in!
              </p>
            </v-col>
          </v-row>
          <login-form />
          <v-row>
            <v-col class="info-text">
              <h2>Privacy FAQ</h2>
              <h3 @click="toggle('q1')">
                What happens with my data?
              </h3>
              <div v-if="showParagraph.q1">
                <p>
                  <em>EDE Net</em> uses your login data to identify you to the system
                  and to other users.
                </p>
                <p>
                  <b>If you login with Google</b> an app-specific ID will be
                  generated that will be used to identify you in <em>EDE Net</em>'s
                  database. Your <b>e-mail address</b>, <b>name</b> and
                  <b>profile photo URL</b> will be copied to the <em>EDE Net</em>
                  database.
                </p>
                <p>
                  <b>If you login with e-mail</b>, you will be asked to supply
                  your <b>e-mail address</b>, <b>name</b>, and a <b>password</b>
                  that will be used to create your profile. An app-specific ID
                  will be generated that will be used to identify you in
                  <em>EDE Net</em>'s database.
                </p>
              </div>
              <h3 @click="toggle('q2')">
                What will other users know about me?
              </h3>
              <p v-if="showParagraph.q2">
                To support the app's functionality, your <b>name</b> and <b>profile photo</b> will be made visible to other users.
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text v-else>
					<p>Use the navigation to browse the directory of EDE contacts and see the map of active projects</p>
          <div v-if="$store.getters.activeUser" jest="logged-in-div" />
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<style>
.info-text {
  width: 400px;
}

h3 {
  cursor: pointer;
}
</style>

<script>
import LoginForm from '~/components/LoginForm.vue'

export default {
  components: {
    LoginForm
  },
  data() {
    return {
      showParagraph: { q1: false, q2: false }
    }
  },
  computed: {
    greetingString() {
      const greeting = 'Welcome to EDE Net'
      if (this.$store.state.profile.name != null) {
        return greeting + ', ' + this.$store.state.profile.name
      } else {
        return greeting
      }
    }
  },
  methods: {
    toggle(element) {
      this.showParagraph[element] = !this.showParagraph[element]
    }
  }
}
</script>
