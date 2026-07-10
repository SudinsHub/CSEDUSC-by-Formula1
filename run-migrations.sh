#!/bin/bash

# Script to run all database migrations
# This creates all the necessary tables for the CSEDU Students' Club Management System

set -e

echo "=========================================="
echo "Running Database Migrations"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker compose ps | grep -q "csedu-postgres.*Up"; then
    echo "❌ Error: PostgreSQL container is not running."
    echo "Please start the containers first: docker compose up -d"
    exit 1
fi

echo "✓ PostgreSQL is running. Starting migrations..."
echo ""

# Define migration files
declare -a migrations=(
    "ms1-auth/migrations/001_create_users.sql:MS1 (Auth & Users)"
    "ms1-auth/migrations/002_add_profile_fields.sql:MS1 (Auth & Users - Profile Fields)"
    "ms2-election/migrations/001_create_election_schema.sql:MS2 (Elections)"
    "ms2-election/migrations/002_update_election_phases.sql:MS2 (Election Phases)"
    "ms3/migrations/001_create_content_schema.sql:MS3 (Events & Notices)"
    "ms3/migrations/002_add_banner_image_and_fee.sql:MS3 (Events Add banner/fee)"
    "ms3/migrations/003_create_gallery_schema.sql:MS3 (Gallery creation)"
    "ms4-finance-notification-log/migrations/001_create_finance_schema.sql:MS4 (Finance & Logs)"
    "ms4-finance-notification-log/migrations/002_create_transactions.sql:MS4 (Finance Add transactions)"
    "ms4-finance-notification-log/migrations/003_create_notifications.sql:MS4 (Finance Add notifications)"
)

success_count=0
fail_count=0

for migration in "${migrations[@]}"; do
    IFS=':' read -r file service <<< "$migration"
    
    echo "Running migration: $service"
    
    if [ ! -f "$file" ]; then
        echo "  ⚠ SKIP: Migration file not found: $file"
        continue
    fi
    
    if docker compose exec -T postgres psql -U formula1 -d csedu_sc < "$file" > /dev/null 2>&1; then
        echo "  ✓ Migration completed successfully"
        success_count=$((success_count + 1))
    else
        echo "  ❌ Migration failed"
        fail_count=$((fail_count + 1))
    fi
    
    echo ""
done

echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo "Successful: $success_count"
echo "Failed: $fail_count"
echo ""

if [ $fail_count -eq 0 ]; then
    echo "✅ All migrations completed!"
    echo ""
    echo "You can now create your first admin user:"
    echo "  ./create-first-admin.sh"
    echo ""
    
    # Show created tables
    echo "Created tables:"
    docker compose exec -T postgres psql -U formula1 -d csedu_sc -c "\dt"
else
    echo "⚠ Some migrations failed. Please check the errors above."
    exit 1
fi
