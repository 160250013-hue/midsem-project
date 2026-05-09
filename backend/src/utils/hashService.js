import bcrypt from "bcryptjs";

const parseSaltRounds = () => {
  const configuredValue = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
  if (Number.isNaN(configuredValue) || configuredValue < 10) {
    return 12;
  }

  return configuredValue;
};

const SALT_ROUNDS = parseSaltRounds();

export const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS);

export const comparePassword = async (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);
