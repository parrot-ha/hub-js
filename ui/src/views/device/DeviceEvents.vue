<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Device Events
            </h5>
            <div class="card-text">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Displayed Text</th>
                    <th>Changed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="event in sortedEvents"
                    :key="event.id"
                  >
                    <td>{{ new Date(event.date).toLocaleString() }}</td>
                    <td>{{ event.source }}</td>
                    <td>{{ event.name }}</td>
                    <td>{{ event.value }}</td>
                    <td>{{ event.descriptionText }}</td>
                    <td>{{ event.isStateChange }}</td>
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
  name: "DeviceEvents",
  data() {
    return {
      deviceId: "",
      events: [],
    };
  },
  computed: {
    sortedEvents() {
      let sortedEventsTmp = [...this.events].sort((a, b) => {
        const dateA = a.date.toUpperCase();
        const dateB = b.date.toUpperCase();
        if (dateA > dateB) {
          return -1;
        }
        if (dateA < dateB) {
          return 1;
        }

        return 0;
      });
      return sortedEventsTmp;
    },
  },
  mounted: function () {
    this.deviceId = this.$route.params.id;

    fetch(`/api/devices/${this.deviceId}/events`)
      .then((response) => response.json())
      .then((data) => {
        if (data != null) {
          this.events = data;
        }
      });
  },
};
</script>
<style scoped></style>
