import prisma from "../../config/prisma.js";
import { hashPassword, comparePassword } from "../../utils/hash.js";
import { signToken } from "../../utils/jwt.js";

export const registerUser = async ({ email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
    },
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.activo) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await comparePassword(password, user.password);

  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    rol: user.rol,
  });

  return { token, user };
};
