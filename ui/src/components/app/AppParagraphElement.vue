<template>
  <div class="card">
    <img
      v-if="body.image"
      class="card-img-top"
      :src="body.image"
      alt="image"
    >
    <div class="card-body">
      <h5 class="card-title">
        {{ body.title }}
      </h5>
      <div
        class="card-text"
        style="white-space: pre-wrap"
      >
        {{ body.description }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AppParagraphElement",
  props: ["body"],
  data() {
    return {};
  },
  methods: {},
};
</script>

<style scoped>
.app-paragraph-element {
  border: 0px;
}
.v-card__text,
.v-card__title {
  padding: 0px;
}
</style>
