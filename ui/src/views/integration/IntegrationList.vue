<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <div
              class="card-title d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
            >
              <h5>Integrations</h5>
              <div class="btn-toolbar mb-2 mb-md-0">
                <router-link
                  class="btn btn-outline-secondary"
                  :to="{ name: 'IntegrationAdd' }"
                >
                  Add Integration
                </router-link>
              </div>
            </div>

            <div class="card-text">
              <table class="table">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style="width: 30%"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      style="width: 70%"
                    >
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="integration in integrations"
                    :key="integration.id"
                  >
                    <td>
                      <router-link
                        :to="{
                          name: 'Integration',
                          params: { id: integration.id },
                        }"
                      >
                        {{ integration.label }} ({{
                          integration.name
                        }})
                      </router-link>
                    </td>
                    <td>{{ integration.description }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "IntegrationList",
  data() {
    return {
      integrations: [],
    };
  },
  mounted: function () {
    fetch("/api/integrations?field=id&field=name&field=label&field=description")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.integrations = data;
        }
      });
  },
};
</script>
<style scoped></style>
