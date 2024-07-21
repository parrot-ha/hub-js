<template>
  <div>
    <app-header />
    <div class="container-fluid">
      <div class="row">
        <app-navigation />
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div
            class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3"
          >
            <router-view />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import AppNavigation from "@/components/AppNavigation.vue";
import AppHeader from "@/components/AppHeader.vue";
</script>
