import express from "express"
import { getHebergement } from "../controllers/hebergment.controller.js";

const router = express.Router();

router.get("/", getHebergement);

export default router;
