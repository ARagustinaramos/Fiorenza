import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        perfil: {
          select: {
            nombreCompleto: true,
            telefono: true,
            cuitCuil: true,
            empresa: true,
            cargo: true,
          },
        },
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_GET_USERS" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        rol: true,
        perfil: {
          select: {
            nombreCompleto: true,
            telefono: true,
            cuitCuil: true,
            empresa: true,
            cargo: true,
            coeficienteVenta: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_GET_PROFILE" });
  }
};



export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      nombreCompleto,
      telefono,
      cuitCuil,
      empresa,
      cargo,
      coeficienteVenta,
      avatarUrl,
    } = req.body;

    console.log("[DEBUG updateMyProfile] Datos recibidos:", {
      nombreCompleto,
      telefono,
      cuitCuil,
      empresa,
      cargo,
      coeficienteVenta,
      avatarUrl,
    });

    if (!nombreCompleto || nombreCompleto.trim() === "") {
      return res.status(400).json({ error: "NOMBRE_COMPLETO_REQUIRED" });
    }

    if (!cuitCuil || cuitCuil.trim() === "") {
      return res.status(400).json({ error: "CUIT_CUIL_REQUIRED" });
    }

    if (!empresa || empresa.trim() === "") {
      return res.status(400).json({ error: "EMPRESA_REQUIRED" });
    }

    if (
      coeficienteVenta !== undefined &&
      (isNaN(coeficienteVenta) || coeficienteVenta < 0 || coeficienteVenta > 500)
    ) {
      return res.status(400).json({ error: "INVALID_COEFICIENTE_VENTA" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        perfil: {
          upsert: {
            update: {
              nombreCompleto,
              telefono,
              cuitCuil,
              empresa,
              cargo,
              coeficienteVenta,
              avatarUrl,
            },
            create: {
              nombreCompleto,
              telefono,
              cuitCuil,
              empresa,
              cargo,
              coeficienteVenta,
              avatarUrl: avatarUrl || null,
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        rol: true,
        perfil: {
          select: {
            nombreCompleto: true,
            telefono: true,
            cuitCuil: true,
            empresa: true,
            cargo: true,
            coeficienteVenta: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_UPDATE_PROFILE" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        coeficiente: true,
        perfil: {
          select: {
            nombreCompleto: true,
            telefono: true,
            cuitCuil: true,
            empresa: true,
            cargo: true,
            coeficienteVenta: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_GET_USER" });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo, coeficiente, nombreCompleto, telefono, cuitCuil, empresa, cargo } = req.body;

    // Validar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    // Construir objeto de datos a actualizar
    const updateData = {};

    if (activo !== undefined) {
      updateData.activo = Boolean(activo);
    }

    if (coeficiente !== undefined) {
      updateData.coeficiente = Number(coeficiente);
    }

    // Si hay datos de perfil, actualizar también
    if (
      nombreCompleto !== undefined ||
      telefono !== undefined ||
      cuitCuil !== undefined ||
      empresa !== undefined ||
      cargo !== undefined
    ) {
      updateData.perfil = {
        upsert: {
          update: {
            ...(nombreCompleto && { nombreCompleto }),
            ...(telefono && { telefono }),
            ...(cuitCuil && { cuitCuil }),
            ...(empresa && { empresa }),
            ...(cargo && { cargo }),
          },
          create: {
            nombreCompleto: nombreCompleto || "",
            telefono: telefono || "",
            cuitCuil: cuitCuil || "",
            empresa: empresa || "",
            cargo: cargo || "",
          },
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        coeficiente: true,
        perfil: {
          select: {
            nombreCompleto: true,
            telefono: true,
            cuitCuil: true,
            empresa: true,
            cargo: true,
            coeficienteVenta: true,
          },
        },
      },
    });

    console.log(`[updateUserById] Usuario ${id} actualizado. Activo: ${updatedUser.activo}`);
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ERROR_UPDATE_USER" });
  }
};

export const createUser = async (req, res) => {
  const { email, password, rol } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "EMAIL_AND_PASSWORD_REQUIRED" });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(400).json({ error: "USER_EXISTS" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      rol,
      activo: true,
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
};