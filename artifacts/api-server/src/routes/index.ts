import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vercelRouter from "./vercel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vercelRouter);

export default router;
