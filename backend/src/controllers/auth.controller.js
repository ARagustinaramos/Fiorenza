import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { signToken } from "../utils/jwt.js";
import crypto from "crypto";

const buildSafeName = (value, fallback) => {
  const name = (value || "").toString().trim();
  if (name) return name;
  return fallback || "";
};

const fetchGoogleTokenInfo = async (idToken) => {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) {
    throw new Error("INVALID_GOOGLE_TOKEN");
  }
  const data = await res.json();
  if (!data?.email || !data?.sub) {
    throw new Error("INVALID_GOOGLE_TOKEN");
  }
  if (process.env.GOOGLE_CLIENT_ID && data.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_AUD_MISMATCH");
  }
  return data;
};

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
        rol: rol || "MAYORISTA",
        authProvider: "LOCAL",
        emailVerified: false,
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

export const registerMinorista = async (req, res) => {
  try {
    if (String(process.env.ENABLE_MINORISTA || "false").toLowerCase() !== "true") {
      return res.status(403).json({ error: "MINORISTA_DISABLED" });
    }
    const { email, password, nombreCompleto, telefono, direccion, dni } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "EMAIL_AND_PASSWORD_REQUIRED" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "PASSWORD_TOO_SHORT" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "USER_EXISTS" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        rol: "MINORISTA",
        authProvider: "LOCAL",
        emailVerified: false,
        perfilMinorista: {
          create: {
            nombreCompleto: buildSafeName(nombreCompleto, email.split("@")[0]),
            telefono: telefono || null,
            direccion: direccion || null,
            dni: dni || null,
          },
        },
      },
      select: {
        id: true,
        email: true,
        rol: true,
        perfilMinorista: {
          select: {
            nombreCompleto: true,
            telefono: true,
            direccion: true,
            dni: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "USER_CREATED",
      user,
    });
  } catch (error) {
    console.error("REGISTER_MINORISTA_ERROR:", error);
    res.status(500).json({ error: "REGISTER_ERROR" });
  }
};

export const loginWithGoogle = async (req, res) => {
  try {
    if (String(process.env.ENABLE_MINORISTA || "false").toLowerCase() !== "true") {
      return res.status(403).json({ error: "MINORISTA_DISABLED" });
    }
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "ID_TOKEN_REQUIRED" });
    }

    const tokenInfo = await fetchGoogleTokenInfo(idToken);
    const email = tokenInfo.email.toLowerCase();
    const googleId = tokenInfo.sub;
    const emailVerified = tokenInfo.email_verified === "true" || tokenInfo.email_verified === true;
    const nombreCompleto = buildSafeName(
      tokenInfo.name,
      tokenInfo.given_name || tokenInfo.family_name || email.split("@")[0]
    );

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
      include: { perfilMinorista: true },
    });

    if (user && user.authProvider === "LOCAL" && !user.googleId) {
      return res.status(400).json({ error: "ACCOUNT_EXISTS_DIFFERENT_PROVIDER" });
    }

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          rol: "MINORISTA",
          authProvider: "GOOGLE",
          googleId,
          emailVerified,
          perfilMinorista: {
            create: {
              nombreCompleto,
            },
          },
        },
        include: { perfilMinorista: true },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: "GOOGLE",
          googleId,
          emailVerified,
        },
        include: { perfilMinorista: true },
      });
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
        perfilMinorista: user.perfilMinorista || null,
      },
    });
  } catch (error) {
    console.error("GOOGLE_LOGIN_ERROR:", error);
    res.status(500).json({ error: "GOOGLE_LOGIN_ERROR" });
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
      token,
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_ERROR", error);
    res.status(500).json({ error: "FORGOT_PASSWORD_ERROR" });
  }
};
