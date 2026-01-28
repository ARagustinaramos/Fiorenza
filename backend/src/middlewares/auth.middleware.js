import { verifyToken } from "../utils/jwt.js";
import prisma from "../config/prisma.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no provisto" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { perfil: true },
    });

    if (!user || !user.activo) {
      return res.status(401).json({ message: "Usuario inválido o inactivo" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
