import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schema";
import * as ctrl from "./auth.controller";

const router = Router();

// POST /api/auth/login
router.post("/login", validate(loginSchema), ctrl.loginHandler);

// POST /api/auth/refresh
router.post("/refresh", validate(refreshSchema), ctrl.refreshHandler);

// POST /api/auth/logout
router.post("/logout", ctrl.logoutHandler);

// POST /api/auth/register  (creates org + first admin user)
router.post("/register", validate(registerSchema), ctrl.registerHandler);

// GET /api/auth/me  (protected)
router.get("/me", authenticate, ctrl.meHandler);

export default router;
