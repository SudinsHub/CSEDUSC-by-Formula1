# PowerShell script to run all database migrations
# This creates all the necessary tables for the CSEDU Students' Club Management System

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Running Database Migrations" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL container is running
$postgresStatus = docker compose ps postgres 2>&1 | Select-String "Up"
if (-not $postgresStatus) {
    Write-Host "[ERROR] PostgreSQL container is not running." -ForegroundColor Red
    Write-Host "Please start the containers first: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL is running. Starting migrations..." -ForegroundColor Green
Write-Host ""

# Define migration files
$migrations = @(
    @{
        Service = "MS1 (Auth & Users)"
        File = "ms1-auth/migrations/001_create_users.sql"
    },
    @{
        Service = "MS2 (Elections)"
        File = "ms2-election/migrations/001_create_election_schema.sql"
    },
    @{
        Service = "MS3 (Events & Notices)"
        File = "ms3/migrations/001_create_content_schema.sql"
    },
    @{
        Service = "MS4 (Finance & Logs)"
        File = "ms4-finance-notification-log/migrations/001_create_finance_schema.sql"
    }
)

$successCount = 0
$failCount = 0

foreach ($migration in $migrations) {
    Write-Host "Running migration: $($migration.Service)" -ForegroundColor Yellow
    
    if (-not (Test-Path $migration.File)) {
        Write-Host "  [SKIP] Migration file not found: $($migration.File)" -ForegroundColor DarkYellow
        continue
    }
    
    try {
        # Read the SQL file content
        $sqlContent = Get-Content $migration.File -Raw
        
        # Execute the migration
        $sqlContent | docker compose exec -T postgres psql -U formula1 -d csedu_sc 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Migration completed successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  [ERROR] Migration failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  [ERROR] Failed to execute migration: $_" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "[SUCCESS] All migrations completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now create your first admin user:" -ForegroundColor Cyan
    Write-Host "  .\create-first-admin.ps1" -ForegroundColor White
    Write-Host ""
    
    # Show created tables
    Write-Host "Created tables:" -ForegroundColor Cyan
    docker compose exec -T postgres psql -U formula1 -d csedu_sc -c "\dt"
} else {
    Write-Host "[WARNING] Some migrations failed. Please check the errors above." -ForegroundColor Yellow
    exit 1
}
