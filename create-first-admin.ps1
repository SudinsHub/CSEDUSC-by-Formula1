# PowerShell script to create the first administrator user
# For Windows users

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Create First Administrator User" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if containers are running
$postgresStatus = docker compose ps postgres 2>&1 | Select-String "Up"
if (-not $postgresStatus) {
    Write-Host "[ERROR] PostgreSQL container is not running." -ForegroundColor Red
    Write-Host "Please start the containers first: docker compose up -d" -ForegroundColor Yellow
    exit 1
}

# Prompt for admin details
Write-Host "Enter administrator details:" -ForegroundColor Yellow
Write-Host ""

$ADMIN_NAME = Read-Host "Syed Naimul Islam"
if ([string]::IsNullOrWhiteSpace($ADMIN_NAME)) {
    Write-Host "[ERROR] Name cannot be empty" -ForegroundColor Red
    exit 1
}

$ADMIN_EMAIL = Read-Host "syednaimul-2021711213@cs.du.ac.bd"
if ([string]::IsNullOrWhiteSpace($ADMIN_EMAIL)) {
    Write-Host "[ERROR] Email cannot be empty" -ForegroundColor Red
    exit 1
}

# Validate email domain
if ($ADMIN_EMAIL -notmatch '@(cs|cse)\.du\.ac\.bd$') {
    Write-Host "[ERROR] Email must end with @cs.du.ac.bd or @cse.du.ac.bd" -ForegroundColor Red
    exit 1
}

$ADMIN_PASSWORD = Read-Host "csedusc_by_formula1" -AsSecureString
$ADMIN_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ADMIN_PASSWORD)
)

if ($ADMIN_PASSWORD_PLAIN.Length -lt 8) {
    Write-Host "[ERROR] Password must be at least 8 characters" -ForegroundColor Red
    exit 1
}

$BATCH_YEAR = Read-Host "2021"
if ([string]::IsNullOrWhiteSpace($BATCH_YEAR)) {
    Write-Host "[ERROR] Batch year cannot be empty" -ForegroundColor Red
    exit 1
}

# Validate batch year is a 4-digit number
if ($BATCH_YEAR -notmatch '^\d{4}$') {
    Write-Host "[ERROR] Batch year must be a 4-digit number" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating administrator account..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if email already exists
$checkQuery = "SELECT email FROM users WHERE email = '$ADMIN_EMAIL';"
$existingUser = docker compose exec -T postgres psql -U formula1 -d csedu_sc -t -c $checkQuery 2>$null | ForEach-Object { $_.Trim() }

if ($existingUser) {
    Write-Host "[ERROR] A user with email '$ADMIN_EMAIL' already exists." -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Do you want to delete the existing user and create a new one? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Deleting existing user..." -ForegroundColor Yellow
    $deleteQuery = "DELETE FROM users WHERE email = '$ADMIN_EMAIL';"
    docker compose exec -T postgres psql -U formula1 -d csedu_sc -c $deleteQuery | Out-Null
    Write-Host "[OK] Existing user deleted" -ForegroundColor Green
}

# Generate password hash using bcrypt (via ms1-auth container)
Write-Host "Generating secure password hash..." -ForegroundColor Yellow

$nodeScript = @"
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('$ADMIN_PASSWORD_PLAIN', 12);
console.log(hash);
"@

$PASSWORD_HASH = docker compose exec -T ms1-auth node -e $nodeScript 2>$null
$PASSWORD_HASH = $PASSWORD_HASH.Trim()

if ([string]::IsNullOrWhiteSpace($PASSWORD_HASH)) {
    Write-Host "[ERROR] Failed to generate password hash" -ForegroundColor Red
    Write-Host "Make sure the ms1-auth container is running: docker compose ps ms1-auth" -ForegroundColor Yellow
    exit 1
}

# Insert admin user into database
Write-Host "Inserting administrator into database..." -ForegroundColor Yellow

$insertQuery = @"
INSERT INTO users (name, email, password_hash, role, status, batch_year)
VALUES (
  '$ADMIN_NAME',
  '$ADMIN_EMAIL',
  '$PASSWORD_HASH',
  'Administrator',
  'ACTIVE',
  $BATCH_YEAR
);
"@

docker compose exec -T postgres psql -U formula1 -d csedu_sc -c $insertQuery | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Administrator created successfully!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login credentials:" -ForegroundColor Cyan
    Write-Host "  Email:    $ADMIN_EMAIL" -ForegroundColor White
    Write-Host "  Password: [hidden]" -ForegroundColor White
    Write-Host "  Role:     Administrator" -ForegroundColor White
    Write-Host "  Status:   ACTIVE" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now login at: http://localhost:4000/api/auth/login" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example login request:" -ForegroundColor Cyan
    Write-Host "curl -X POST http://localhost:4000/api/auth/login ``" -ForegroundColor Gray
    Write-Host "  -H 'Content-Type: application/json' ``" -ForegroundColor Gray
    Write-Host "  -d '{`"email`":`"$ADMIN_EMAIL`",`"password`":`"YOUR_PASSWORD`"}'" -ForegroundColor Gray
    Write-Host ""
    
    # Get the user ID
    $userIdQuery = "SELECT user_id FROM users WHERE email = '$ADMIN_EMAIL';"
    $USER_ID = docker compose exec -T postgres psql -U formula1 -d csedu_sc -t -c $userIdQuery | ForEach-Object { $_.Trim() }
    Write-Host "User ID: $USER_ID" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[ERROR] Failed to create administrator" -ForegroundColor Red
    exit 1
}

# Clear sensitive data
$ADMIN_PASSWORD_PLAIN = $null
