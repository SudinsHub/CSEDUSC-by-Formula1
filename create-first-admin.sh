#!/bin/bash

# Script to create the first administrator user in the CSEDU Students' Club Management System
# This bypasses the normal registration flow to create an ACTIVE admin directly in the database

set -e

echo "=========================================="
echo "Create First Administrator User"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if containers are running
if ! docker compose ps | grep -q "csedu-postgres.*Up"; then
    echo "❌ Error: PostgreSQL container is not running."
    echo "Please start the containers first: docker compose up -d"
    exit 1
fi

# Prompt for admin details
echo "Enter administrator details:"
echo ""

read -p "Full Name: " ADMIN_NAME
if [ -z "$ADMIN_NAME" ]; then
    echo "❌ Error: Name cannot be empty"
    exit 1
fi

read -p "Email (@cs.du.ac.bd or @cse.du.ac.bd): " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo "❌ Error: Email cannot be empty"
    exit 1
fi

# Validate email domain
if [[ ! "$ADMIN_EMAIL" =~ @(cs|cse)\.du\.ac\.bd$ ]]; then
    echo "❌ Error: Email must end with @cs.du.ac.bd or @cse.du.ac.bd"
    exit 1
fi

read -sp "Password (min 8 characters): " ADMIN_PASSWORD
echo ""
if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    echo "❌ Error: Password must be at least 8 characters"
    exit 1
fi

read -p "Batch Year (e.g., 2024): " BATCH_YEAR
if [ -z "$BATCH_YEAR" ]; then
    echo "❌ Error: Batch year cannot be empty"
    exit 1
fi

# Validate batch year is a 4-digit number
if ! [[ "$BATCH_YEAR" =~ ^[0-9]{4}$ ]]; then
    echo "❌ Error: Batch year must be a 4-digit number"
    exit 1
fi

echo ""
echo "=========================================="
echo "Creating administrator account..."
echo "=========================================="

# Check if email already exists
EXISTING_USER=$(docker compose exec -T postgres psql -U formula1 -d csedu_sc -t -c "SELECT email FROM users WHERE email = '$ADMIN_EMAIL';" 2>/dev/null | xargs)

if [ ! -z "$EXISTING_USER" ]; then
    echo "❌ Error: A user with email '$ADMIN_EMAIL' already exists."
    echo ""
    read -p "Do you want to delete the existing user and create a new one? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Operation cancelled."
        exit 1
    fi
    
    echo "Deleting existing user..."
    docker compose exec -T postgres psql -U formula1 -d csedu_sc -c "DELETE FROM users WHERE email = '$ADMIN_EMAIL';" > /dev/null
    echo "✓ Existing user deleted"
fi

# Generate password hash using bcrypt (via ms1-auth container)
echo "Generating secure password hash..."
PASSWORD_HASH=$(docker compose exec -T ms1-auth node -e "
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('$ADMIN_PASSWORD', 12);
console.log(hash);
" 2>/dev/null | tr -d '\r\n')

if [ -z "$PASSWORD_HASH" ]; then
    echo "❌ Error: Failed to generate password hash"
    echo "Make sure the ms1-auth container is running: docker compose ps ms1-auth"
    exit 1
fi

# Insert admin user into database
echo "Inserting administrator into database..."
docker compose exec -T postgres psql -U formula1 -d csedu_sc > /dev/null 2>&1 <<EOF
INSERT INTO users (name, email, password_hash, role, status, batch_year)
VALUES (
  '$ADMIN_NAME',
  '$ADMIN_EMAIL',
  '$PASSWORD_HASH',
  'Administrator',
  'ACTIVE',
  $BATCH_YEAR
);
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Administrator created successfully!"
    echo "=========================================="
    echo ""
    echo "Login credentials:"
    echo "  Email:    $ADMIN_EMAIL"
    echo "  Password: [hidden]"
    echo "  Role:     Administrator"
    echo "  Status:   ACTIVE"
    echo ""
    echo "You can now login at: http://localhost:4000/api/auth/login"
    echo ""
    echo "Example login request:"
    echo "curl -X POST http://localhost:4000/api/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"YOUR_PASSWORD\"}'"
    echo ""
    
    # Get the user ID
    USER_ID=$(docker compose exec -T postgres psql -U formula1 -d csedu_sc -t -c "SELECT user_id FROM users WHERE email = '$ADMIN_EMAIL';" | xargs)
    echo "User ID: $USER_ID"
    echo ""
else
    echo "❌ Error: Failed to create administrator"
    exit 1
fi
