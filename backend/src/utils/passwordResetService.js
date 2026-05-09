import jwt from "jsonwebtoken";

export const generatePasswordResetToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: "15m"
  });
};

export const verifyPasswordResetToken = (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
};

export const getPasswordResetExpiryTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  return now;
};

export const isPasswordResetExpired = (expiryTime) => {
  return new Date() > new Date(expiryTime);
};
