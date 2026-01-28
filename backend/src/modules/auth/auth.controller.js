import { registerUser, loginUser } from "./auth.service.js";

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.body);
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
