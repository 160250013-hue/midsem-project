import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createUser, getUserByEmail, getUserById } from "../models/userModel.js";
import { upsertStudentProfile } from "../models/studentModel.js";
import { updateUserEmailVerificationStatus } from "../models/emailVerificationModel.js";

dotenv.config();

const isPlaceholderGoogleValue = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  return (
    !normalized ||
    normalized === "your-google-client-id" ||
    normalized === "your-google-client-secret" ||
    normalized === "your_google_client_id" ||
    normalized === "your_google_client_secret" ||
    normalized.includes("replace")
  );
};

export const isGoogleOAuthConfigured = () =>
  !isPlaceholderGoogleValue(process.env.GOOGLE_CLIENT_ID) &&
  !isPlaceholderGoogleValue(process.env.GOOGLE_CLIENT_SECRET) &&
  Boolean(process.env.GOOGLE_CALLBACK_URL);

if (isGoogleOAuthConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google profile did not include an email"), null);
          }

          let user = await getUserByEmail(email);

          if (!user) {
            user = await createUser({
              name: profile.displayName || "Google User",
              email,
              passwordHash: null,
              role: "student",
              // Local registration enforces phone, so use safe placeholder for OAuth users.
              phone: "0000000000"
            });

            await upsertStudentProfile({
              userId: user.id,
              department: "",
              cgpa: 0,
              skills: [],
              resumeUrl: "",
              projects: [],
              preferences: {},
              graduationYear: null,
              facultyMentorId: null
            });

            await updateUserEmailVerificationStatus(user.id);
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    "[auth/google] Google OAuth is disabled because credentials are missing or placeholders are still set."
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
