<template>
  <div class="container-fluid">
    <div class="row gy-3">
      <div
        v-for="integrationType in integrationTypes"
        :key="integrationType.id"
        class="col-12"
      >
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              {{ integrationType.name }}
            </h5>
            <div class="card-text">
              {{ integrationType.description }}
              <br>
              <button
                class="btn btn-primary"
                color="primary"
                @click="addIntegration(integrationType.id)"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

export default {
  name: "IntegrationAdd",
  data() {
    return {
      integrationTypes: [],
    };
  },
  mounted: function () {
    fetch("/api/integration_types")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.integrationTypes = data;
        }
      });
  },
  methods: {
    addIntegration: function (integrationTypeId) {
      var body = { id: integrationTypeId };
      fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(handleErrors)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          console.log(JSON.stringify(data));
          this.$router.push(`/integrations/${data.id}`);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
<style scoped></style>
