<template>
  <div>
    <div v-if="command.arguments">
      <div class="input-group mb-3">
        <div class="input-group-prepend">
          <button
            type="button"
            class="btn btn-primary"
            @click="commandClick(deviceId, command.name)"
          >
            {{ command.name }}
          </button>
        </div>
        <span
          v-for="(arg, i) in command.arguments"
          :key="i"
        >
          <input
            v-if="arg.dataType.toUpperCase() == 'TIME'"
            v-model="arg.value"
            type="time"
            class="form-control"
            :placeholder="arg.name"
          >
          <input
            v-else
            v-model="arg.value"
            type="text"
            class="form-control"
            :placeholder="arg.name"
          >
        </span>
      </div>
    </div>
    <div v-else>
      <button
        type="button"
        class="btn btn-primary"
        @click="commandClick(deviceId, command.name)"
      >
        {{ command.name }}
      </button>
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
  name: "DeviceCommand",
  props: ["deviceId", "command"],
  data() {
    return {};
  },
  methods: {
    commandClick: function (deviceId, command) {
      var url = `/api/devices/${deviceId}/commands/${command}`;
      var setArgs = [];
      if (this.command.arguments != null) {
        for (var arg of this.command.arguments) {
          if (arg.value) {
            setArgs.push({
              name: arg.name,
              value: arg.value,
              dataType: arg.dataType,
            });
          } else {
            // break out after first null
            break;
          }
        }
      }
      //TODO: handle response
      if (setArgs.length > 0) {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setArgs),
        })
          .then(handleErrors)
          .then(() => {});
      } else {
        fetch(url, {
          method: "POST",
          body: null,
        })
          .then(handleErrors)
          .then(() => {});
      }
    },
  },
};
</script>

<style scoped></style>
