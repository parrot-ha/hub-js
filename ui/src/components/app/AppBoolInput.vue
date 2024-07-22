<template>
  <div class="form-check form-switch mb-3">
    <br>
    <input
      class="form-check-input"
      type="checkbox"
      role="switch"
      :checked="checked"
      @input="$emit('update:checked', $event.target.checked)"
    >
    <label class="form-check-label">{{ body.title }}</label>
  </div>
</template>

<script>
export default {
  name: "AppBoolInput",
  props: ["checked", "body"],
  emits: ["update:checked"],
  data() {
    return {};
  },
  methods: {},
};
</script>

<style scoped></style>
