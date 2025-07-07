# Deploy to Google Cloud Platform

Quick deployment guide for CyberAnalyticsApp on GCP.

#Cloud Run 

Fastest way to deploy with auto-scaling and pay-per-use.

### Prerequisites
```bash
# Install Google Cloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Deploy Backend
```bash
# Enable required services
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy backend
gcloud run deploy tenexai-backend \
  --source ./backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --memory 1Gi \
  --set-env-vars NODE_ENV=production,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,GEMINI_API_KEY=$GEMINI_API_KEY
```

### Deploy Frontend
```bash
# Deploy frontend
gcloud run deploy tenexai-frontend \
  --source ./frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80 \
  --memory 512Mi
```

### Get URLs
```bash
gcloud run services list
```


### Deploy
```bash
# Get credentials
gcloud container clusters get-credentials tenexai-cluster --zone us-central1-a

# Create secrets
kubectl create secret generic tenexai-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=GEMINI_API_KEY="$GEMINI_API_KEY"

# Deploy services
kubectl apply -f k8s/
```

## 💾 Database Options

### Cloud SQL (Recommended)
```bash
# Create PostgreSQL instance
gcloud sql instances create tenexai-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database and user
gcloud sql databases create tenexai --instance=tenexai-db
gcloud sql users create tenexai-user --instance=tenexai-db --password=YOUR_PASSWORD
```

### External Database
Use Neon, Supabase, or your own PostgreSQL server.

## 🔒 Security

### Use Secret Manager
```bash
# Store secrets securely
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Reference in deployment
--set-secrets JWT_SECRET=jwt-secret:latest,GEMINI_API_KEY=gemini-api-key:latest
```

## 📊 Monitoring

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision"

# Check service status
gcloud run services describe tenexai-backend --region us-central1
```

## 💰 Cost Optimization

- **Cloud Run**: Scales to zero when not in use
- **Cloud SQL**: Use f1-micro for development
- **Monitor**: Check Cloud Billing dashboard

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_URL and network access
2. **API Keys**: Check Gemini API key is valid
3. **Memory Issues**: Increase memory limits if needed

### Useful Commands
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision"

# Scale service
gcloud run services update tenexai-backend --region us-central1 --max-instances 10

# Check health
curl https://your-service-url/api/health
```

---

**Need help?** Check the main [README.md](README.md) for local setup instructions. 