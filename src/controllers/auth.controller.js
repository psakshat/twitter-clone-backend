import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ error: "Email already in use" });

  const usernameExists = await User.findOne({ username });
  if (usernameExists)
    return res.status(400).json({ error: "Username already taken" });

  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
  });

  if (user) {
    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ error: "Invalid user data" });
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch)
    return res.status(401).json({ error: "Invalid email or password" });

  res.status(200).json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    token: generateToken(user._id),
  });
});
