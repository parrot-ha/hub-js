<template>
  <div class="container-fluid">
    <h5>Definition</h5>

    <form>
      <div class="mb-3">
        <label class="form-label">Name</label>
        <input
          v-model="smartApp.name"
          type="text"
          class="form-control"
          disabled
        >
      </div>
      <div class="mb-3">
        <label class="form-label">Namespace</label>
        <input
          v-model="smartApp.namespace"
          type="text"
          class="form-control"
          disabled
        >
      </div>
    </form>

    <div class="col-12">
      <h5>Settings</h5>
      Add setting definitions in the source code and then set the values here
    </div>

    <br>
    <h5 class="card-title">
      OAuth
    </h5>

    <div v-if="!smartApp.oAuthEnabled">
      <br>
      <button
        class="btn btn-primary"
        outlined
        mx-2
        @click="smartApp.oAuthEnabled = true"
      >
        Enable OAuth in Smart App
      </button>
    </div>
    <div v-else>
      <div class="mb-3">
        <label class="form-label">Client ID</label>
        <input
          v-model="smartApp.oAuthClientId"
          type="text"
          class="form-control"
          placeholder="Public client ID for accessing this SmartApp via its REST API"
          readonly
        >
      </div>
      <div class="mb-3">
        <label class="form-label">Client Secret</label>
        <input
          v-model="smartApp.oAuthClientSecret"
          type="text"
          class="form-control"
          placeholder="Confidential secret key for accessing this SmartApp via its REST API"
          readonly
        >
      </div>
    </div>
    <br>
    <button
      class="btn btn-primary"
      @click="updateSmartApp"
    >
      Update
    </button>
  </div>
</template>
<script>
export default {
  name: "SmartAppSettings",
  data() {
    return {
      saId: "",
      smartApp: { oAuthEnabled: false },
    };
  },

  mounted: function () {
    this.saId = this.$route.params.id;

    fetch(`/api/smart-apps/${this.saId}`)
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.smartApp = data;
        }
      });
  },
  methods: {
    updateSmartApp: function () {
      var body = this.smartApp;
      fetch(`/api/smart-apps/${this.saId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("success");
          } else {
            console.log("problem saving smart app");
          }
        });
    },
  },
};
</script>
<style scoped></style>
