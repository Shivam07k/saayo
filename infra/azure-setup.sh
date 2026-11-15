#!/bin/bash
# Azure Infrastructure Setup for Saayo Tees - Web App Only
# Uses EXTERNAL PostgreSQL (Neon/Supabase) - avoids Student plan restrictions
# Run: bash infra/azure-setup.sh

set -e

# ========== CONFIGURATION ==========
RESOURCE_GROUP="saayo-rg"
LOCATION="eastus2"  # Commonly available for Student plans
APP_NAME="saayo-tees"

# Your custom domain (CHANGE THIS)
CUSTOM_DOMAIN="your-domain.com"  # e.g., shop.example.com

# GitHub repo for CI/CD
GITHUB_REPO="Shivam07k/saayo"

echo "🚀 Setting up Azure Web App for Saayo Tees..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo "Custom Domain: $CUSTOM_DOMAIN"
echo ""
echo "📋 NOTE: This script creates ONLY the Web App."
echo "   You need an EXTERNAL PostgreSQL (Neon.tech / Supabase / Railway)"
echo "   Get a free connection string from https://neon.tech or https://supabase.com"
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

# ========== CREATE APP SERVICE PLAN (BASIC B1 - covered by $100 student credit) ==========
echo "🌐 Creating App Service Plan (Basic B1 ~$13/mo, covered by student credit)..."
az appservice plan create \
    --resource-group $RESOURCE_GROUP \
    --name "${APP_NAME}-plan" \
    --location $LOCATION \
    --sku B1 \
    --is-linux

# ========== CREATE WEB APP ==========
echo "📱 Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan "${APP_NAME}-plan" \
    --name $APP_NAME \
    --runtime "NODE:20-lts" \
    --startup-file "npx prisma migrate deploy && node server.js"

# Enable managed identity
az webapp identity assign --resource-group $RESOURCE_GROUP --name $APP_NAME

# ========== CUSTOM DOMAIN SETUP ==========
if [[ "$CUSTOM_DOMAIN" != "your-domain.com" ]]; then
    echo "🌍 Setting up custom domain: $CUSTOM_DOMAIN"
    
    # Add custom domain to web app
    az webapp config hostname add \
        --resource-group $RESOURCE_GROUP \
        --webapp-name $APP_NAME \
        --hostname $CUSTOM_DOMAIN
    
    WWW_DOMAIN="www.${CUSTOM_DOMAIN}"
    az webapp config hostname add \
        --resource-group $RESOURCE_GROUP \
        --webapp-name $APP_NAME \
        --hostname $WWW_DOMAIN
    
    echo ""
    echo "📝 DNS Records to add at your domain registrar:"
    echo "Type: CNAME"
    echo "Name: @ (or www)"
    echo "Value: ${APP_NAME}.azurewebsites.net"
    echo ""
    echo "For apex domain (example.com), use ALIAS/ANAME record if your DNS provider supports it,"
    echo "or use a subdomain like shop.example.com with CNAME."
fi

# ========== SERVICE PRINCIPAL FOR GITHUB ACTIONS ==========
echo ""
echo "🔑 Creating Service Principal for GitHub Actions..."
SP_OUTPUT=$(az ad sp create-for-rbac --name "saayo-github-actions" --role contributor --scopes "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}" --sdk-auth)
echo "$SP_OUTPUT" > .azure-sp.json

# ========== GITHUB ACTIONS SECRETS ==========
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ AZURE WEB APP CREATED!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📱 Web App URL: https://${APP_NAME}.azurewebsites.net"
echo "📊 Resource Group: ${RESOURCE_GROUP}"
echo ""
echo "🔐 GitHub Secrets to add in: https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo ""
cat << EOF
REQUIRED SECRETS:

AZURE_CREDENTIALS: (copy the JSON below from .azure-sp.json)
$(cat .azure-sp.json)

DATABASE_URL: (GET FROM NEON.TECH OR SUPABASE - see below)
NEXTAUTH_SECRET: $(openssl rand -base64 32)
NEXTAUTH_URL: https://${CUSTOM_DOMAIN:-${APP_NAME}.azurewebsites.net}
STRIPE_SECRET_KEY: (your Stripe live secret key)
STRIPE_WEBHOOK_SECRET: (from Stripe Dashboard -> Webhooks)
RAZORPAY_KEY_ID: (your Razorpay key ID)
RAZORPAY_KEY_SECRET: (your Razorpay key secret)
RAZORPAY_WEBHOOK_SECRET: (from Razorpay Dashboard)
SMTP_HOST: (your SMTP host)
SMTP_PORT: (e.g., 587)
SMTP_USER: (your SMTP username)
SMTP_PASS: (your SMTP password)
SMTP_FROM: Saayo Tees <noreply@${CUSTOM_DOMAIN:-${APP_NAME}.azurewebsites.net}>
CLOUDINARY_CLOUD_NAME: (your Cloudinary cloud name)
CLOUDINARY_API_KEY: (your Cloudinary API key)
CLOUDINARY_API_SECRET: (your Cloudinary API secret)
CUSTOM_DOMAIN: ${CUSTOM_DOMAIN}
EOF

# Supabase connection string (provided by user)
DATABASE_URL="postgresql://postgres.bidjnbsyfytiodwuwuyq:Shivam%408683@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=public&sslmode=require"

# Configure app settings with Supabase
echo "⚙️ Configuring app settings with Supabase..."
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

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ AZURE WEB APP CREATED WITH SUPABASE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📱 Web App URL: https://${APP_NAME}.azurewebsites.net"
echo "📊 Resource Group: ${RESOURCE_GROUP}"
echo "🐘 Database: Supabase (aws-1-ap-southeast-2.pooler.supabase.com)"
echo ""
echo "🔐 GitHub Secrets to add in: https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo ""
cat << EOF
REQUIRED SECRETS:

AZURE_CREDENTIALS: (copy the JSON below from .azure-sp.json)
$(cat .azure-sp.json)

DATABASE_URL: $DATABASE_URL
NEXTAUTH_SECRET: $(openssl rand -base64 32)
NEXTAUTH_URL: https://${CUSTOM_DOMAIN:-${APP_NAME}.azurewebsites.net}
STRIPE_SECRET_KEY: (your Stripe live secret key)
STRIPE_WEBHOOK_SECRET: (from Stripe Dashboard -> Webhooks)
RAZORPAY_KEY_ID: (your Razorpay key ID)
RAZORPAY_KEY_SECRET: (your Razorpay key secret)
RAZORPAY_WEBHOOK_SECRET: (from Razorpay Dashboard)
SMTP_HOST: (your SMTP host)
SMTP_PORT: (e.g., 587)
SMTP_USER: (your SMTP username)
SMTP_PASS: (your SMTP password)
SMTP_FROM: Saayo Tees <noreply@${CUSTOM_DOMAIN:-${APP_NAME}.azurewebsites.net}>
CLOUDINARY_CLOUD_NAME: (your Cloudinary cloud name)
CLOUDINARY_API_KEY: (your Cloudinary API key)
CLOUDINARY_API_SECRET: (your Cloudinary API secret)
CUSTOM_DOMAIN: ${CUSTOM_DOMAIN}
EOF

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "💰 Cost on Student Plan: ~$0/month"
echo "   - App Service F1: Free"
echo "   - Supabase: Free tier"
echo "   - Custom Domain + SSL: Free"
echo "═══════════════════════════════════════════════════════════"