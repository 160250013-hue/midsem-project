import { pool } from "../config/db.js";

const migrate = async () => {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
    `);
    console.log("✓ Ensured phone column exists");

    await pool.query(`
      UPDATE users
      SET phone = '0000000000'
      WHERE phone IS NULL;
    `);
    console.log("✓ Backfilled missing phone values");

    await pool.query(`
      ALTER TABLE users
      ALTER COLUMN phone SET NOT NULL;
    `);
    console.log("✓ Enforced phone NOT NULL");

    await pool.query(`
      ALTER TABLE users
      ALTER COLUMN phone TYPE VARCHAR(15)
      USING phone::VARCHAR(15);
    `);
    console.log("✓ Aligned phone column type to VARCHAR(15)");

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log("✓ Added is_verified column");

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'users_phone_format_check'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_phone_format_check CHECK (phone ~ '^[0-9]{10}$');
        END IF;
      END $$;
    `);
    console.log("✓ Enforced 10-digit phone format");

    // Add email_verified column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    `);
    console.log("✓ Added email_verified column");

    // Add google_id column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    `);
    console.log("✓ Added google_id column");

    // Create email_verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(6) NOT NULL,
        expiry_time TIMESTAMPTZ NOT NULL,
        attempt_count INT NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ Created email_verifications table");

    await pool.query(`
      ALTER TABLE email_verifications
      ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0;
    `);
    console.log("✓ Ensured email_verifications attempt_count column");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_verifications_expiry_time ON email_verifications(expiry_time);
    `);
    console.log("✓ Added email_verifications indexes");

    // Create password_resets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expiry_time TIMESTAMPTZ NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ Created password_resets table");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_resets_expiry_time ON password_resets(expiry_time);
    `);
    console.log("✓ Added password_resets indexes");

    // Mark existing users as verified
    await pool.query(`
      UPDATE users 
      SET email_verified = TRUE,
          is_verified = TRUE
      WHERE email_verified = FALSE;
    `);
    console.log("✓ Marked existing users as verified");

    console.log("\n✅ Migration complete!");
    await pool.end();
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    await pool.end();
    process.exit(1);
  }
};

migrate();
