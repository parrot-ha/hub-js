<template>
  <div>
    <label class="form-label">{{ body.title }}</label>
    <select
      class="form-select"
      :aria-label="body.title"
      :value="value"
      :multiple="body.multiple"
      @change="$emit('input', $event)"
    >
      <option
        v-for="item in itemList"
        :key="item.key"
        :value="item.key"
      >
        {{ item.text }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: "DeviceEnumInput",
  props: ["value", "options", "body"],
  data() {
    return {};
  },
  computed: {
    itemList: function () {
      var tempItemList = [];
      if (Array.isArray(this.options)) {
        this.options.forEach((element) =>
          tempItemList.push({ key: element, text: element }),
        );
      } else {
        for (const key in this.options) {
          tempItemList.push({ key: key, text: this.options[key] });
        }
      }
      return tempItemList;
    },
  },
  methods: {},
};
</script>

<style scoped></style>
