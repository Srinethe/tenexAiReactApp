# CyberAnalyticsApp - Cybersecurity Log Analysis Platform

A full-stack web application that analyzes security logs using AI-powered threat detection and provides actionable security insights.

## 🚀 Features

- **📊 Log Analysis**: Upload and analyze CSV log files
- **🤖 AI-Powered Insights**: Google Gemini AI for intelligent threat detection
- **🔍 Rule-Based Detection**: 15+ security rules for anomaly detection
- **📈 Confidence Scoring**: Risk assessment with confidence levels
- **🎯 Actionable Recommendations**: AI-generated security recommendations
- **🔐 User Authentication**: Secure login/signup system
- **📱 Modern UI**: Clean, responsive React interface

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use free cloud options)
- Google Gemini API key (free tier available)

### 1. Clone & Install
```bash
git clone https://github.com/Srinethe/tenexAiReactApp.git
cd tenexAiReactApp

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Database Setup
Choose one of these free options:

**Neon **
1. Go to [neon.tech](https://neon.tech) and create free account
2. Create new project and copy connection string
3. Add to `backend/.env`:
```bash
DATABASE_URL=postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/database
```

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) and create free project
2. Copy connection string from Settings > Database

### 3. Environment Setup
Create `backend/.env`:
```bash
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_super_secret_jwt_key_here
BCRYPT_ROUNDS=12
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create free API key
3. Add to your `.env` file

### 5. Initialize Database
```bash
cd backend
npm run test-db
```

### 6. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 7. Test the Application
1. Open http://localhost:5173
2. Sign up with test@example.com / testpassword123
3. Upload a CSV log file from `example-logs/`
4. Click "Analyze" to see AI-powered insights!

## 📁 Project Structure

```
tenexAiReactApp/
├── backend/                 # Node.js/TypeScript API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Auth middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utilities & AI services
│   │   └── server.ts        # Main server file
│   └── Dockerfile           # Production Docker config
├── frontend/                # React/TypeScript UI
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── context/         # React context
│   └── Dockerfile           # Production Docker config
├── example-logs/            # Sample CSV files for testing
├── k8s/                     # Kubernetes deployment files
└── docker-compose.yml       # Local development setup
```

## 🚀 Deployment Options

### Local Docker
```bash
docker-compose up --build
```

### Google Cloud Run (Recommended)
```bash
# Follow the deployment guide
gcloud run deploy tenexai-backend --source ./backend
gcloud run deploy tenexai-frontend --source ./frontend
```

### Kubernetes (GKE)
```bash
kubectl apply -f k8s/
```

See [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md) for detailed cloud deployment instructions.

## 🔧 Development

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test-db      # Test database connection
npm run test-gemini  # Test AI integration
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 📊 Supported Log Formats

The application analyzes CSV files with these columns:
- `timestamp` / `time` - Event timestamp
- `srcip` - Source IP address
- `dstip` / `url` - Destination IP or URL
- `action` - Action taken (Allowed/Blocked)
- `threatseverity` - Threat severity level
- `app_risk_score` - Application risk score

## 🤖 AI Analysis Features

- **Threat Detection**: Identifies 15+ security threat patterns
- **Risk Assessment**: Provides confidence scores for each detection
- **Intelligent Insights**: AI-generated explanations and recommendations
- **Pattern Recognition**: Identifies attack patterns and trends
- **Actionable Advice**: Specific security recommendations

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- File upload validation
- CORS protection
- Rate limiting
- Input sanitization

## 📈 Performance

- **Rule-based detection**: ~1000 logs/second
- **AI analysis**: ~10-50 logs/second (depending on complexity)
- **Database**: Optimized queries with indexing
- **Frontend**: React with Vite for fast builds

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Documentation**: Check the deployment guides
- **Testing**: Use files in `example-logs/` directory

---

Built with ❤️ using Node.js, React, TypeScript, and Google Gemini AI
