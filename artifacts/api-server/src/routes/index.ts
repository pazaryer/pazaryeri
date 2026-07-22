import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import listingsRouter from "./listings";
import favoritesRouter from "./favorites";
import conversationsRouter from "./conversations";
import miscRouter from "./misc";
import uploadRouter from "./upload";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(listingsRouter);
router.use(favoritesRouter);
router.use(conversationsRouter);
router.use(miscRouter);
router.use(uploadRouter);

export default router;
