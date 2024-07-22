<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              {{ hub.name }}
            </h5>
            <div class="card-text">
              <table class="table">
                <tbody>
                  <tr>
                    <th scope="row">
                      Name
                    </th>
                    <td>{{ hub.name }}</td>
                  </tr>
                  <tr>
                    <th>Hub ID</th>
                    <td>{{ hub.id }}</td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Version
                    </th>
                    <td>{{ hub.version }}</td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Date Created
                    </th>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">
                      IP Address
                    </th>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">
                      MAC Address
                    </th>
                    <td />
                  </tr>
                  <tr
                    v-for="(integration, i) in integrations"
                    :key="i"
                  >
                    <th scope="row">
                      {{ integration.name }}
                    </th>
                    <td>
                      <ul>
                        <li
                          v-for="(value, name) in integration.settings"
                          :key="name"
                        >
                          {{ name }}: <strong>{{ value }}</strong>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Events
                    </th>
                    <td />
                  </tr>
                  <tr>
                    <th scope="row">
                      Utilities
                    </th>
                    <td />
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
  name: "HubView",
  data() {
    return {
      hub: {},
      integrations: {},
    };
  },
  mounted: function () {
    fetch("/api/location/hub")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.hub = data;
        }
      });

    fetch("/api/integrations")
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
