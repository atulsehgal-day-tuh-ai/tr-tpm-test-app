# TR TPM Test App

A basic test application to verify the recommended tech stack for the Talking Rain TPM system.

## Stack

- **Frontend/Framework**: Next.js 14 (React) with TypeScript
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **Authentication**: Azure AD (Entra ID) with MSAL

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running and accessible
- Azure AD app registration configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tr_tpm_db

# Azure AD Configuration
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id-here
NEXT_PUBLIC_AZURE_AD_REDIRECT_URI=http://localhost:3000
```

#### Using Azure Database for PostgreSQL (Flexible Server)

- **Get the connection string**: Azure Portal → your PostgreSQL server → **Connection strings**
- **SSL**: Azure Postgres requires SSL. This app enables SSL automatically when your `DATABASE_URL` contains `.postgres.database.azure.com`.

Example `DATABASE_URL` formats:

```env
# Example (Azure Database for PostgreSQL - Flexible Server)
# NOTE: Your username often looks like: adminuser@your-server-name
# NOTE: URL-encode special characters in passwords (e.g., @ becomes %40)
DATABASE_URL=postgresql://adminuser%40your-server-name:yourPassword@your-server-name.postgres.database.azure.com:5432/yourDbName
```

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE tr_tpm_db;
```

2. The application will automatically create the test table on first connection.

### Azure AD Setup

1. Register an application in Azure Portal (Azure Active Directory > App registrations)
2. Configure:
   - **Redirect URI**: `http://localhost:3000` (for development)
   - **Supported account types**: Based on your organization's needs
   - **API permissions**: Microsoft Graph > User.Read (for basic authentication)
3. Copy the **Application (client) ID** and **Directory (tenant) ID** to your `.env.local` file

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Test the components:
   - **Azure AD**: Click "Login with Azure AD" to test authentication
   - **PostgreSQL**: Click "Test Database Connection" to verify database connectivity

## Docker (containerized deployment)

This repo includes a `Dockerfile` that packages the app using Next.js **standalone** output.

### Build the image

```bash
docker build -t tr-tpm-test-app:local .
```

### Run the container locally

```bash
docker run --rm -p 3000:3000 --env-file .env.local tr-tpm-test-app:local
```

Then open `http://localhost:3000`.

## Deploy: Azure App Service (Linux Container)

### IT-friendly runbook (GitHub Actions → ACR → App Service)

This is the clean “enterprise” path when you **cannot (or don’t want to) run Docker locally**.

#### Executive summary (non-technical)

We deploy this Node.js/Next.js application as a **container image** (a packaged, self-contained “app box” that includes the code and everything it needs to run). Instead of building that container on a developer laptop, we use **GitHub Actions** as a controlled build system that creates the container image every time we push changes to the `main` branch.

The container image is stored in **Azure Container Registry (ACR)**, which is Azure’s private storage for container images. **Azure App Service** then runs the app by pulling the latest approved image from ACR. To keep this secure, App Service uses a **Managed Identity** with the minimum required permission (**AcrPull**) so it can pull images from ACR **without any registry passwords**.

Overall: **GitHub Actions builds → ACR stores → App Service runs**, and configuration (database URL, Azure AD IDs) is provided via **App Settings** in Azure rather than hard-coded in the application.

#### What we are building (concepts)

- **GitHub Actions**: a build server that runs in GitHub. It will build the container image for you on every push.
- **ACR (Azure Container Registry)**: a private Docker image registry in Azure (like a private Docker Hub).
- **Azure App Service (Linux Container)**: the web hosting service. It *pulls* the image from ACR and runs it.
- **Managed Identity + AcrPull**: a secure way for App Service to pull from ACR **without storing registry passwords**.

#### Prerequisites

- You have an Azure subscription (billing enabled).
- Azure CLI installed (`az version` works) or use Azure Cloud Shell.
- You have a GitHub repo for this code and can add GitHub Secrets.

---

### Step A1) Create (or pick) a Resource Group

Purpose: a Resource Group is a container for related Azure resources (ACR, App Service, etc.).

```bash
az group create -n tr-tpm-rg -l westus2
```

If it already exists, you can check its region:

```bash
az group show -n tr-tpm-rg --query location -o tsv
```

---

### Step A2) Create an Azure Container Registry (ACR)

Purpose: store your Docker images privately so App Service can run them.

```bash
az acr create -g tr-tpm-rg -n trtpmacr12345 --sku Basic
az acr show -g tr-tpm-rg -n trtpmacr12345 --query loginServer -o tsv
```

You should get a login server like: `trtpmacr12345.azurecr.io`.

---

### Step A3) Create an Azure Service Principal for GitHub Actions

Purpose: GitHub Actions needs a “machine identity” it can use to log in to Azure and push images to ACR.

```bash
ACR_ID=$(az acr show -n trtpmacr12345 -g tr-tpm-rg --query id -o tsv)

az ad sp create-for-rbac \
  --name "tr-tpm-gh-actions" \
  --role contributor \
  --scopes "$ACR_ID" \
  --sdk-auth
```

This prints a JSON blob. **Copy it.**

---

### Step A4) Add GitHub Secrets

Purpose: store credentials securely so they are not committed to git.

In GitHub repo → **Settings → Secrets and variables → Actions**:

- **Secret: `AZURE_CREDENTIALS`** = paste the JSON from Step A3
- **Secret: `ACR_LOGIN_SERVER`** = `trtpmacr12345.azurecr.io`

---

### Step A5) Add the GitHub Actions workflow

Purpose: automatically build and push a Docker image to ACR on every push to `main`.

File path:

```text
.github/workflows/acr-build-push.yml
```

Once committed to `main`, go to GitHub → **Actions** and confirm the workflow run is green.

---

### Step A6) Create the App Service Plan (Linux)

Purpose: the compute “plan” the web app runs on.

```bash
az appservice plan create -g tr-tpm-rg -n tr-tpm-plan --is-linux --sku B1 -l westus2
```

---

### Step A7) Create the Web App (Linux Container)

Purpose: the actual website endpoint that will run your container.

```bash
az webapp create \
  -g tr-tpm-rg \
  -p tr-tpm-plan \
  -n tr-tpm-test-app-v1
```

Note: You may see warnings about deprecated flags; those are okay for now.

---

### Step A8) Allow the Web App to pull from ACR (Managed Identity)

Purpose: App Service must be able to pull your image from ACR. We do this securely using Managed Identity.

```bash
# Enable system-assigned identity on the web app
az webapp identity assign -g tr-tpm-rg -n tr-tpm-test-app-v1

# Grant AcrPull to the web app identity on the ACR
PRINCIPAL_ID=$(az webapp identity show -g tr-tpm-rg -n tr-tpm-test-app-v1 --query principalId -o tsv)
ACR_ID=$(az acr show -n trtpmacr12345 -g tr-tpm-rg --query id -o tsv)
az role assignment create --assignee-object-id "$PRINCIPAL_ID" --assignee-principal-type ServicePrincipal --role AcrPull --scope "$ACR_ID"

# Tell the web app to use Managed Identity creds when pulling from ACR
SUB_ID=$(az account show --query id -o tsv)
az resource update --ids "/subscriptions/$SUB_ID/resourceGroups/tr-tpm-rg/providers/Microsoft.Web/sites/tr-tpm-test-app-v1/config/web" --set properties.acrUseManagedIdentityCreds=true
```

---

### Step A9) Point the Web App to your image in ACR

Purpose: configure which container image App Service should run.

```bash
az webapp config container set \
  -g tr-tpm-rg \
  -n tr-tpm-test-app-v1 \
  --docker-custom-image-name trtpmacr12345.azurecr.io/tr-tpm-test-app:latest \
  --docker-registry-server-url https://trtpmacr12345.azurecr.io
```

Also set required container settings:

```bash
az webapp config appsettings set -g tr-tpm-rg -n tr-tpm-test-app-v1 --settings \
  WEBSITES_PORT=3000 \
  WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
```

---

### Step A10) Set the app environment variables (runtime configuration)

Purpose: provide DB and Azure AD settings securely at runtime (not in source code).

```bash
az webapp config appsettings set -g tr-tpm-rg -n tr-tpm-test-app-v1 --settings \
  DATABASE_URL="<YOUR_DATABASE_URL>" \
  NEXT_PUBLIC_AZURE_AD_CLIENT_ID="<CLIENT_ID>" \
  NEXT_PUBLIC_AZURE_AD_TENANT_ID="<TENANT_ID>" \
  NEXT_PUBLIC_AZURE_AD_REDIRECT_URI="https://tr-tpm-test-app-v1.azurewebsites.net"
```

---

### Step A11) Restart and verify

```bash
az webapp restart -g tr-tpm-rg -n tr-tpm-test-app-v1
```

Open:

- `https://tr-tpm-test-app-v1.azurewebsites.net`

Verification checklist:

- App loads
- Azure AD login works
- “Test Database Connection” works

---

### Common troubleshooting

- **“No credential was provided to access Azure Container Registry”**
  - This usually means the Web App is not configured to use Managed Identity to pull images, or the identity lacks `AcrPull`.
  - Re-run Steps A8–A9.

- **App starts but shows errors**
  - Check App Service logs: Azure Portal → Web App → **Log stream**

- **DB connection errors**
  - Confirm `DATABASE_URL` is set in App Service configuration.
  - Confirm Azure Postgres firewall/network allows the App Service outbound IPs (see Web App → Properties → outbound IPs).
  - Ensure SSL is enabled (Azure Postgres requires it).

## Deploy: AWS ECS (Fargate)

High-level steps:

1. **Create an ECR repo** (or use an existing one).
2. **Build + push the image** to ECR.
3. **Create an ECS Task Definition** exposing port `3000`.
4. **Create an ECS Service** (Fargate) behind an ALB.
5. **Set env vars / secrets** (ECS task env vars or AWS Secrets Manager):
   - `DATABASE_URL`
   - `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`
   - `NEXT_PUBLIC_AZURE_AD_TENANT_ID`
   - `NEXT_PUBLIC_AZURE_AD_REDIRECT_URI` (should be your app URL)

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── test-db/       # Database test endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page with test UI
│   ├── providers.tsx      # MSAL provider setup
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   ├── db.ts              # PostgreSQL connection and utilities
│   └── authConfig.ts      # Azure AD MSAL configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ PostgreSQL database connection
- ✅ Azure AD authentication with MSAL
- ✅ Test page to verify all components
- ✅ Basic error handling

## Next Steps

This is a minimal test app. For the full TPM application, you'll need to:

1. Expand database schema for Budget, Forecast, Actual data
2. Implement proper authentication flows and role-based access
3. Add data models for Accounts, Promotions, Products
4. Create API routes for CRUD operations
5. Build user interface for data entry and reporting
6. Add data validation and business logic

## Notes

- Make sure your PostgreSQL database is running before testing
- Azure AD authentication requires proper app registration in Azure Portal
- The app uses MSAL React for client-side authentication
- Database connection pooling is configured for production use