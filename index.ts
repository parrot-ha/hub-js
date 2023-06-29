const express = require("express");
// import * as express from "express";
// import * as fs from "fs";
const fs = require("fs");
const { NodeVM } = require("vm2");
// import NodeVM from "vm2";
// import { runDeviceMethod } from "./services/entity-service";
const { runDeviceMethod } = require("./services/entity-service");

// process device handlers before starting the api
const {
  processDeviceHandlers,
  getDeviceHandlers,
  addDevice,
  getDevices,
  getDevice,
  processDevices,
} = require("./services/device-service");
processDeviceHandlers();
processDevices();

const app = express();

app.set("view engine", "ejs");
app.use(express.json()); // for parsing application/json

app.get("/", function (req: any, res: any) {
  res.render("pages/index");
});

app.get("/devices", function (req: any, res: any) {
  res.render("pages/devices", { devices: getDevices() });
});

app.get("/devices/:id", function (req: any, res: any) {
  res.render("pages/device", getDevice(req.params.id));
});

app.get("/add-device", function (req: any, res: any) {
  res.render("pages/add-device", { deviceHandlers: getDeviceHandlers() });
});

//TODO: move to routes/controllers

app.get("/api/devices", (req: any, res: any) => {
  res.json(getDevices());
});

// add device
app.post("/api/devices", (req: any, res: any) => {
  let deviceParams = req.body;
  let deviceId = addDevice(
    deviceParams.nameInput,
    deviceParams.label,
    deviceParams.deviceNetworkId,
    deviceParams.deviceType
  );
  res.json({ id: deviceId });
});

app.get("/api/devices/:id", (req: any, res: any) => {
  res.json(getDevice(req.params.id));
});

app.post("/api/devices/:id/commands/:command", (req: any, res: any) => {
  const deviceId = req.params.id;
  const command = req.params.command;
  const body = req.body;
  if (body != null && Array.isArray(body) && body.length > 0) {
    runDeviceMethod(deviceId, command, body);
  } else {
    runDeviceMethod(deviceId, command);
  }
  res.status(202).end();
});

const port = process.env.PORT || 6501;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
