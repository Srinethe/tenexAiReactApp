# Setup Guide

Quick setup instructions for CyberAnalyticsApp.

## 🗄️ Database Setup

###Neon 
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create new project
3. Copy connection string from dashboard
4. Add to `backend/.env`:
```bash
DATABASE_URL=postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/database
```



## 🤖 Gemini AI Setup

### Get API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create free API key
3. Add to `backend/.env`:
```bash
GEMINI_API_KEY=your_api_key_here
```

### Test AI Integration
```bash
cd backend
npm run test-gemini
```

## 🔧 Environment Variables

Create `backend/.env`:
```bash
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
BCRYPT_ROUNDS=12
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🚀 Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:5173 and sign up with test@example.com / testpassword123

## 📊 Test with Sample Data

Upload files from `example-logs/` directory to test the application.

---

**Need more help?** Check the main [README.md](README.md) for detailed instructions. 