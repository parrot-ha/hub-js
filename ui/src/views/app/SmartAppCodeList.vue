<template>
  <div class="container-fluid">
    <div class="row g-3">
      <div class="col-auto me-auto">
        <h5>Smart App Code</h5>
      </div>
      <div class="col-auto">
        <router-link
          class="btn btn-outline-secondary"
          :to="{ name: 'SmartAppCodeAdd' }"
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
          v-for="sa in sortedCodeList"
          :key="sa.id"
        >
          <td>
            <router-link
              :to="{
                name: 'SmartAppCodeEdit',
                params: { id: sa.id },
              }"
            >
              {{ sa.name }}
            </router-link>
          </td>
          <td>{{ sa.namespace }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
export default {
  name: "SmartAppCodeList",
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
    fetch("/api/smart-apps?filter=user")
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
