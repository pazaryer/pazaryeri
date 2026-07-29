import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import listingsRouter from "./listings";
import favoritesRouter from "./favorites";
import conversationsRouter from "./conversations";
import offersRouter from "./offers";
import reviewsRouter from "./reviews";
import listingCommentsRouter from "./listing-comments";
import miscRouter from "./misc";
import uploadRouter from "./upload";
import authRouter from "./auth";
import sitemapRouter from "./sitemap";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sitemapRouter);
router.use(uploadRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(listingsRouter);
router.use(favoritesRouter);
router.use(conversationsRouter);
router.use(offersRouter);
router.use(reviewsRouter);
router.use(listingCommentsRouter);
router.use(miscRouter);

export default router;
