import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/devices",
      name: "Devices",
      component: () => import("../views/device/DeviceList.vue"),
    },
    {
      path: "/device-add",
      name: "DeviceAdd",
      component: () => import("../views/device/DeviceAdd.vue"),
    },
    {
      path: "/devices/:id",
      name: "device",
      component: () => import("../views/device/Device.vue"),
    },
    {
      path: "/devices/:id/config",
      name: "DeviceConfig",
      component: () => import("../views/device/DeviceConfig.vue"),
    },
    {
      path: "/devices/:id/events",
      name: "DeviceEvents",
      component: () => import("../views/device/DeviceEvents.vue"),
    },
    {
      path: "/devicetiles/:id",
      name: "devicetile",
      component: () => import("../views/device/DeviceTile.vue"),
    },
    {
      path: "/isas",
      name: "InstalledSmartApps",
      component: () => import("../views/app/InstalledSmartAppList.vue"),
    },
    {
      path: "/isas/:id",
      name: "InstalledSmartAppInfo",
      component: () => import("../views/app/InstalledSmartAppInfo.vue"),
    },
    {
      path: "/isas/:id/cfg",
      name: "InstalledSmartAppConfig",
      component: () => import("../views/app/InstalledSmartAppConfig.vue"),
    },
    {
      path: "/isas/:id/cfg",
      name: "InstalledSmartAppConfig",
      component: () => import("../views/app/InstalledSmartAppConfig.vue"),
    },
    {
      path: "/isas/:id/cfg/:approute(.*)",
      name: "InstalledSmartAppConfigSubRoute",
      component: () => import("../views/app/InstalledSmartAppConfig.vue"),
    },
    {
      path: "/isa-add",
      name: "InstalledSmartAppAdd",
      component: () => import("../views/app/InstalledSmartAppAdd.vue"),
    },
    {
      path: "/integrations",
      name: "Integrations",
      component: () => import("../views/integration/IntegrationList.vue"),
    },
    {
      path: "/integrations/:id",
      name: "Integration",
      component: () => import("../views/integration/Integration.vue"),
    },
    {
      path: "/integration-add",
      name: "IntegrationAdd",
      component: () => import("../views/integration/IntegrationAdd.vue"),
    },
    {
      path: "/location",
      name: "Location",
      component: () => import("../views/hub/Location.vue"),
    },
    {
      path: "/hub",
      name: "Hub",
      component: () => import("../views/hub/Hub.vue"),
    },
    {
      path: "/settings",
      name: "Settings",
      component: () => import("../views/Settings.vue"),
    },
    {
      path: "/settings/logger-config",
      name: "LoggerConfig",
      component: () => import("../views/settings/LoggerConfig.vue"),
    },
    {
      path: "/sa-code",
      name: "SmartAppCodeList",
      component: () => import("../views/app/SmartAppCodeList.vue"),
    },
    {
      path: "/sa-code/add",
      name: "SmartAppCodeAdd",
      component: () => import("../views/app/SmartAppCodeAdd.vue"),
    },
    {
      path: "/sa-code/:id/edit",
      name: "SmartAppCodeEdit",
      component: () => import("../views/app/SmartAppCodeEdit.vue"),
    },
    {
      path: "/sa-code/:id/settings",
      name: "SmartAppSettings",
      component: () => import("../views/app/SmartAppSettings.vue"),
    },
    {
      path: "/dh-code",
      name: "DeviceHandlerCodeList",
      component: () => import("../views/device/DeviceHandlerCodeList.vue"),
    },
    {
      path: "/dh-code/add",
      name: "DeviceHandlerCodeAdd",
      component: () => import("../views/device/DeviceHandlerCodeAdd.vue"),
    },
    {
      path: "/dh-code/:id/edit",
      name: "DeviceHandlerCodeEdit",
      component: () => import("../views/device/DeviceHandlerCodeEdit.vue"),
    },
    {
      path: "/extensions",
      name: "Extensions",
      component: () => import("../views/extensions/ExtensionList.vue"),
    },
  ],
});

export default router;
