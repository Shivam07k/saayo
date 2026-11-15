#!/bin/bash
# Azure Infrastructure Setup for Saayo Tees
# Run: bash infra/azure-setup.sh

set -e

# ========== CONFIGURATION ==========
RESOURCE_GROUP="saayo-rg"
LOCATION="southcentralus"  # Student plan supported region for PostgreSQL
APP_NAME="saayo-tees"
POSTGRES_SERVER="saayo-postgres"
POSTGRES_DB="saayo"
POSTGRES_ADMIN="saayoadmin"
# Generate a secure password for PostgreSQL
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Your custom domain (CHANGE THIS)
CUSTOM_DOMAIN="your-domain.com"  # e.g., shop.example.com
WWW_DOMAIN="www.${CUSTOM_DOMAIN}"

# GitHub repo for CI/CD
GITHUB_REPO="Shivam07k/saayo"

echo "🚀 Setting up Azure infrastructure for Saayo Tees..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo "PostgreSQL Server: $POSTGRES_SERVER"
echo "Custom Domain: $CUSTOM_DOMAIN"
echo ""

# ========== LOGIN CHECK ==========
if ! az account show &>/dev/null; then
    echo "🔐 Please log in to Azure first:"
    az login
fi

# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "📋 Using subscription: $SUBSCRIPTION_ID"

# ========== CREATE RESOURCE GROUP ==========
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# ========== CREATE POSTGRESQL SINGLE SERVER (FREE TIER) ==========
echo "🐘 Creating PostgreSQL Single Server (Free tier)..."
az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --location $LOCATION \
    --admin-user $POSTGRES_ADMIN \
    --admin-password $POSTGRES_PASSWORD \
    --sku-name B_Gen5_1 \
    --tier Burstable \
    --version 13 \
    --storage-size 32 \
    --public-access all \
    --yes

# Create database
echo "🗄️ Creating database..."
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER \
    --database-name $POSTGRES_DB

# Get connection string
POSTGRES_HOST=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query fullyQualifiedDomainName -o tsv)
DATABASE_URL="postgresql://${POSTGRES_ADMIN}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}?schema=public&sslmode=require"

echo ""
echo "✅ PostgreSQL created!"
echo "Host: $POSTGRES_HOST"
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_ADMIN"
echo "Password: $POSTGRES_PASSWORD"
echo "Connection String: $DATABASE_URL"
echo ""

# ========== CREATE APP SERVICE PLAN (FREE TIER F1) ==========
echo "🌐 Creating App Service Plan (Free F1)..."
az appservice plan create \
    --resource-group $RESOURCE_GROUP \
    --name "${APP_NAME}-plan" \
    --location $LOCATION \
    --sku F1 \
    --is-linux

# ========== CREATE WEB APP ==========
echo "📱 Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan "${APP_NAME}-plan" \
    --name $APP_NAME \
    --runtime "NODE:20-lts" \
    --startup-file "npx prisma migrate deploy && node server.js"

# Configure app settings
echo "⚙️ Configuring app settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
    DATABASE_URL="$DATABASE_URL" \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    NEXTAUTH_URL="https://${APP_NAME}.azurewebsites.net" \
    NODE_ENV="production" \
    CURRENCY="INR" \
    PORT="8000" \
    WEBSITES_PORT="8000"

# Enable managed identity for Key Vault (optional but recommended)
az webapp identity assign --resource-group $RESOURCE_GROUP --name $APP_NAME

# ========== CUSTOM DOMAIN SETUP ==========
if [[ "$CUSTOM_DOMAIN" != "your-domain.com" ]]; then
    echo "🌍 Setting up custom domain: $CUSTOM_DOMAIN"
    
    # Add custom domain to web app
    az webapp config hostname add \
        --resource-group $RESOURCE_GROUP \
        --webapp-name $APP_NAME \
        --hostname $CUSTOM_DOMAIN
    
    if [[ "$WWW_DOMAIN" != "www.your-domain.com" ]]; then
        az webapp config hostname add \
            --resource-group $RESOURCE_GROUP \
            --webapp-name $APP_NAME \
            --hostname $WWW_DOMAIN
    fi
    
    # Enable HTTPS (managed certificate - free)
    az webapp config ssl bind \
        --resource-group $RESOURCE_GROUP \
        --name $APP_NAME \
        --certificate-thumbprint "$(az webapp config ssl list --resource-group $RESOURCE_GROUP --name $APP_NAME --query "[?hostName=='$CUSTOM_DOMAIN'].thumbprint" -o tsv)" \
        --ssl-type SNI
    
    echo ""
    echo "📝 DNS Records to add at your domain registrar:"
    echo "Type: CNAME"
    echo "Name: @ (or www)"
    echo "Value: ${APP_NAME}.azurewebsites.net"
    echo ""
    echo "For apex domain (example.com), use ALIAS/ANAME record if your DNS provider supports it,"
    echo "or use a subdomain like shop.example.com with CNAME."
fi

# ========== GITHUB ACTIONS SECRETS ==========
echo ""
echo "🔐 GitHub Secrets to add in: https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo ""
echo "Required secrets:"
cat << EOF
AZURE_CREDENTIALS: (Run: az ad sp create-for-rbac --name "saayo-github-actions" --role contributor --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP} --sdk-auth)
DATABASE_URL: ${DATABASE_URL}
NEXTAUTH_SECRET: (generate: openssl rand -base64 32)
NEXTAUTH_URL: https://${CUSTOM_DOMAIN:-${APP_NAME}.azurewebsites.net}
STRIPE_SECRET_KEY: (your Stripe secret key)
STRIPE_WEBHOOK_SECRET: (from Stripe Dashboard -> Webhooks)
RAZORPAY_KEY_ID: (your Razorpay key ID)
RAZORPAY_KEY_SECRET: (your Razorpay key secret)
RAZORPAY_WEBHOOK_SECRET: (from Razorpay Dashboard)
SMTP_HOST: (your SMTP host)
SMTP_PORT: (e.g., 587)
SMTP_USER: (your SMTP username)
SMTP_PASS: (your SMTP password)
SMTP_FROM: (e.g., Saayo Tees <noreply@${CUSTOM_DOMAIN}>)
CLOUDINARY_CLOUD_NAME: (your Cloudinary cloud name)
CLOUDINARY_API_KEY: (your Cloudinary API key)
CLOUDINARY_API_SECRET: (your Cloudinary API secret)
CUSTOM_DOMAIN: ${CUSTOM_DOMAIN}
EOF

# ========== SERVICE PRINCIPAL FOR GITHUB ACTIONS ==========
echo ""
echo "🔑 Creating Service Principal for GitHub Actions..."
SP_OUTPUT=$(az ad sp create-for-rbac --name "saayo-github-actions" --role contributor --scopes "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}" --sdk-auth)
echo "$SP_OUTPUT" > .azure-sp.json
echo ""
echo "✅ Service Principal created! Save this JSON as AZURE_CREDENTIALS secret:"
cat .azure-sp.json

# ========== SUMMARY ==========
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ AZURE SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📱 Web App URL: https://${APP_NAME}.azurewebsites.net"
echo "🐘 PostgreSQL: ${POSTGRES_HOST}"
echo "📊 Resource Group: ${RESOURCE_GROUP}"
echo ""
echo "Next steps:"
echo "1. Add all GitHub secrets listed above"
echo "2. Push to main branch to trigger deployment"
echo "3. Configure DNS for custom domain"
echo "4. Set up Stripe/Razorpay webhooks pointing to your domain"
echo ""
echo "💰 Cost on Student Plan: ~$0/month (Free tiers)"
echo "   - App Service F1: Free"
echo "   - PostgreSQL Flexible Server: Free for 12 months"
echo "   - Custom Domain + SSL: Free"