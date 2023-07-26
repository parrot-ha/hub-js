import { Request, Response } from "express";
import { IntegrationService } from "../../integration/integration-service";

const express = require("express");

module.exports = function (integrationService: IntegrationService) {
  const router = express.Router();
  router.get("/", (req: Request, res: Response) => {
    res.json(integrationService.getIntegrationTypes());
  });

  return router;
};
