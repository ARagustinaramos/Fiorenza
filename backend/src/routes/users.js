import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  getUsers,
  getMyProfile,
  updateMyProfile,
  getUserById,
  updateUserById,
  createUser,
} from "../controllers/users.controller.js";

const router = Router();

router.get("/me", auth, getMyProfile);


router.put("/me", auth, updateMyProfile);

router.post(
  "/",
  auth,
  requireRole("ADMIN"),
  createUser
);


router.get(
  "/",
  auth,
  requireRole("ADMIN"),
  getUsers
);


router.get(
  "/:id",
  auth,
  requireRole("ADMIN"),
  getUserById
);


router.put(
  "/:id",
  auth,
  requireRole("ADMIN"),
  updateUserById
);

export default router;
