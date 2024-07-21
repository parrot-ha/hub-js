<template>
  <div class="container-fluid">
    <div class="row g-3">
      <div class="col-auto me-auto">
        <h5>Device Handler Code</h5>
      </div>
      <div class="col-auto">
        <router-link
          class="btn btn-outline-secondary"
          :to="{ name: 'DeviceHandlerCodeAdd' }"
        >
          Add New
        </router-link>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Namespace</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="dh in sortedCodeList"
          :key="dh.id"
        >
          <td>
            <router-link
              :to="{
                name: 'DeviceHandlerCodeEdit',
                params: { id: dh.id },
              }"
            >
              {{ dh.name }}
            </router-link>
          </td>
          <td>{{ dh.namespace }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "DeviceHandlerCodeList",
  data() {
    return {
      codeList: [],
    };
  },
  computed: {
    sortedCodeList() {
      let sortedCodeList = [...this.codeList].sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        return 0;
      });
      return sortedCodeList;
    },
  },
  mounted: function () {
    fetch("/api/device-handlers?filter=user")
      .then((response) => response.json())
      .then((data) => {
        if (typeof data !== "undefined" && data != null) {
          this.codeList = data;
        }
      });
  },
};
</script>
<style scoped></style>
