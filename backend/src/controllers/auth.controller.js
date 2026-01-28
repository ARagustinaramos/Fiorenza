import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { signToken } from "../utils/jwt.js";
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const { email, password, rol } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "USER_EXISTS" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        rol: rol || "mayorista",
      },
    });

    res.status(201).json({
      message: "USER_CREATED",
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("❌ REGISTER ERROR:", error); // 👈 ESTO
    res.status(500).json({ error: "REGISTER_ERROR" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.activo) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "LOGIN_ERROR" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (
      !reset ||
      reset.used ||
      reset.expiresAt < new Date()
    ) {
      return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    res.json({ message: "PASSWORD_UPDATED" });
  } catch (error) {
    console.error("❌ RESET PASSWORD ERROR:", error);
    res.status(500).json({ error: "RESET_PASSWORD_ERROR" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    
    if (!user) {
      return res.json({ message: "Revisa tu casilla de mail para resetear la contraseña" });
    }

    const token = crypto.randomUUID();

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
      },
    });

    res.json({
      message: "RESET_EMAIL_SENT",
      token, // ⚠️ solo porque usás EmailJS en front
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);
    res.status(500).json({ error: "FORGOT_PASSWORD_ERROR" });
  }
};