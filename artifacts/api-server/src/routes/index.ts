import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import loginAttemptsRouter from "./loginAttempts.js";
import emotionsRouter from "./emotions.js";
import anomaliesRouter from "./anomalies.js";
import blockchainRouter from "./blockchain.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/login-attempts", loginAttemptsRouter);
router.use("/emotions", emotionsRouter);
router.use("/anomalies", anomaliesRouter);
router.use("/blockchain", blockchainRouter);

export default router;
