# Backend

ASP.NET Core Web API project targeting `.NET 8`.

```powershell
dotnet restore ..\AD_BroCode.sln
dotnet run --project .\Backend.csproj
```

Useful local URLs:

- Health check: `http://localhost:5217/api/healthz`
- Swagger UI: `http://localhost:5217/swagger`

To point the Vite frontend at the real API instead of the local mock API:

```powershell
cd ..\frontend\artifacts\customer-portal
$env:API_PROXY_TARGET = "http://localhost:5217"
pnpm dev
```
