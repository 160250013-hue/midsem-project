import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getUserByEmail, getUserById, createUser } from "../models/userModel.js";
import { upsertStudentProfile } from "../models/studentModel.js";
import { updateUserEmailVerificationStatus } from "../models/emailVerificationModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await getUserByEmail(profile.emails[0].value);

        if (!user) {
          // Create new user from Google profile
          user = await createUser({
            fullName: profile.displayName,
            email: profile.emails[0].value,
            passwordHash: null,
            role: "student",
            phone: "0000000000"
          });

          // Create student profile for new Google user
          if (user.role === "student") {
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
          }

          // Mark email as verified for Google users
          await updateUserEmailVerificationStatus(user.id);
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

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
