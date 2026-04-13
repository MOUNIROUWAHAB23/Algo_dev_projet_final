import express from "express"
import { getHebergement, getHebergementById } from "../controllers/hebergment.controller.js";

const router = express.Router();

router.get("/", getHebergement);
router.get("/getById",getHebergementById)
export default router;
