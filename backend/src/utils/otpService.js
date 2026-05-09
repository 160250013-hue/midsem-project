import crypto from "crypto";

export const generateOTP = () => {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
};

export const getOTPExpiryTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
};

export const isOTPExpired = (expiryTime) => {
  return new Date() > new Date(expiryTime);
};
