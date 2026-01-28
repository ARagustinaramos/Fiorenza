import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/jwt.js";

export const registerUser = async ({ email, password }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("USER_EXISTS");

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("INVALID_CREDENTIALS");

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  const token = jwt.sign(
    { id: user.id, rol: user.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, user };
};
