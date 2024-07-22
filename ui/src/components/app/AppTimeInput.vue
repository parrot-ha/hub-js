<template>
  <div class="mb-3">
    <label class="form-label">{{ body.title }}</label>
    <input
      class="form-control"
      type="time"
      :value="dateTimeToTime(modelValue)"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>

<script>
export default {
  name: "AppTimeInput",
  props: ["modelValue", "body"],
  data() {
    return {};
  },
  methods: {
    dateTimeToTime: function (dateTime) {
      if (typeof dateTime === "undefined" || dateTime == null) {
        return null;
      }

      if (dateTime.length > 5) {
        //TODO: check format
        let dt = new Date(dateTime);
        return (
          `${dt.getHours()}`.padStart(2, "0") +
          ":" +
          `${dt.getMinutes()}`.padStart(2, "0")
        );
      } else {
        return dateTime;
      }
    },
  },
};
</script>
