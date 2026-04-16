import express from "express"
import { getHebergement, getHebergementById } from "../controllers/hebergment.controller.js";
import { getHebergementMap } from "../controllers/hebergement.map.controller.js";

const router = express.Router();

router.get("/", getHebergement);
router.get("/map", getHebergementMap);
router.get("/getById",getHebergementById);

export default router;
