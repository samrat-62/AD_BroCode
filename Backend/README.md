# Backend

ASP.NET Core Web API project targeting `.NET 8`.

## Project structure

- `Controllers`: API endpoints and HTTP concerns.
- `DTOs`: request and response contracts exposed to clients.
- `Models`: internal domain/application models.
- `Services`: business logic and application workflows.
- `Data`: data access abstractions and implementations.
- `Extensions`: dependency injection and startup extension methods.

## PostgreSQL

The API reads PostgreSQL settings from `ConnectionStrings:DefaultConnection` in `appsettings.json` and `appsettings.Development.json`.

Example local connection string:

```json
"DefaultConnection": "Host=localhost;Port=5432;Database=DB_Bro_Code;Username=postgres;Password=YOUR_POSTGRES_PASSWORD"
```

You can also set it without editing tracked files:

```powershell
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=DB_Bro_Code;Username=postgres;Password=YOUR_POSTGRES_PASSWORD"
$env:Jwt__Key = "replace-with-a-secure-local-development-jwt-signing-key"
```

Database-aware health check:

```powershell
Invoke-RestMethod http://localhost:5217/api/healthz/database
```

```powershell
dotnet restore ..\AD_BroCode.sln
dotnet run --project .\Backend.csproj
```

Useful local URLs:

- Health check: `http://localhost:5217/api/healthz`
- Database health check: `http://localhost:5217/api/healthz/database`
- Swagger UI: `http://localhost:5217/swagger`

## Email Sending

Email sending uses MailKit with settings from the `EmailSettings` configuration section.
Do not store SMTP passwords in `appsettings.json`.

For local development, store the Gmail App Password in user secrets:

```powershell
dotnet user-secrets set "EmailSettings:Password" "YOUR_NEW_16_CHARACTER_APP_PASSWORD" --project .\Backend.csproj
```

Gmail setup notes:

- Enable 2-Step Verification on the sender Google account.
- Create a Gmail App Password from Google Account security settings.
- Use the app password for `EmailSettings:Password`, not the normal Gmail password.
- If an app password is exposed, revoke it and create a new one.

Current low-stock alerts are sent to the configured `EmailSettings:AdminAlertEmail`.

## Authentication Sessions

Successful admin, staff, and customer login responses include:

- `token`: JWT bearer token for API requests.
- `sessionId`: database session id stored in `UserSessions`.
- `expiresAtUtc`: session/token expiry.

Protected APIs validate both the JWT and the active `UserSessions` row.

## Staff API

Development seed login:

- Email: `staff@autoparts.com`
- Password: `password123`

Main staff endpoints:

- `POST /api/staff/auth/login`
- `GET /api/staff/dashboard/stats`
- `GET /api/staff/dashboard/recent-sales`
- `GET /api/staff/dashboard/alerts`
- `GET /api/staff/customers`
- `GET /api/staff/customers/search`
- `POST /api/staff/customers`
- `GET /api/staff/customers/{id}`
- `GET /api/staff/customers/{id}/vehicles`
- `GET /api/staff/customers/{id}/purchases`
- `GET /api/staff/customers/{id}/services`
- `GET /api/staff/customers/{id}/credit`
- `GET /api/staff/customers/{id}/notes`
- `POST /api/staff/customers/{id}/notes`
- `GET /api/staff/parts`
- `GET /api/staff/parts/low-stock`
- `POST /api/staff/sales`
- `GET /api/staff/invoices`
- `GET /api/staff/invoices/{id}`
- `POST /api/staff/invoices/{id}/mark-paid`
- `POST /api/staff/invoices/{id}/email`
- `GET /api/staff/notifications`
- `POST /api/staff/notifications/read-all`
- `GET /api/staff/reports/regular-customers`
- `GET /api/staff/reports/high-spenders`
- `GET /api/staff/reports/pending-credits`
- `GET /api/staff/reports/sales-summary`
- `POST /api/staff/reports/credit-reminders`

Staff accounts are created and managed only through admin-authenticated staff management endpoints:

- `GET /api/admin/staff`
- `POST /api/admin/staff`
- `PUT /api/admin/staff/{id}`
- `DELETE /api/admin/staff/{id}`

To point the Vite frontend at the real API instead of the local mock API:

```powershell
cd ..\frontend\artifacts\customer-portal
$env:API_PROXY_TARGET = "http://localhost:5217"
pnpm dev
```
