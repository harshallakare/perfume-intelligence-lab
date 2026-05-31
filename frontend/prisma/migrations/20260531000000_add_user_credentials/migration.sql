-- CreateTable
CREATE TABLE "user_credentials" (
    "id"            TEXT     NOT NULL PRIMARY KEY,
    "email"         TEXT     NOT NULL,
    "name"          TEXT     NOT NULL,
    "role"          TEXT     NOT NULL DEFAULT 'admin',
    "password_hash" TEXT     NOT NULL,
    "reset_token"   TEXT,
    "reset_expiry"  DATETIME,
    "created_at"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_email_key" ON "user_credentials"("email");
