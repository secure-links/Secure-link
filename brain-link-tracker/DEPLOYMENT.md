# Deployment Guide - Brain Link Tracker

This guide covers deploying the Brain Link Tracker application to production environments.

## 🚀 Quick Deployment

### Frontend (Vercel)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure build settings:
   - **Build Command**: `cd frontend && pnpm install && pnpm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `pnpm install`
4. Deploy automatically

### Backend (Railway/Render)
1. Create new service on Railway or Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy with automatic builds

## 📋 Pre-Deployment Checklist

### Frontend Preparation
- [ ] Update API base URL for production
- [ ] Test all components and routes
- [ ] Verify mobile responsiveness
- [ ] Check theme switching functionality
- [ ] Validate form submissions

### Backend Preparation
- [ ] Configure production database (PostgreSQL)
- [ ] Set up environment variables
- [ ] Test all API endpoints
- [ ] Configure CORS for production domain
- [ ] Set up database migrations

## 🔧 Environment Configuration

### Frontend Environment Variables
Create `.env.production` in frontend directory:
```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_APP_NAME=Brain Link Tracker
```

### Backend Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
SQLALCHEMY_DATABASE_URI=postgresql://user:password@host:port/database

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# Telegram Integration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Email (if needed)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# External APIs
IPAPI_KEY=your-ip-api-key
GEOLOCATION_API_KEY=your-geo-api-key
```

## 🗄️ Database Setup

### PostgreSQL Production Setup
```sql
-- Create database
CREATE DATABASE brain_link_tracker;

-- Create user
CREATE USER brain_tracker WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE brain_link_tracker TO brain_tracker;
```

### Database Migration
```bash
# In backend directory
python -c "
from src.main import app
from src.models.user import db
with app.app_context():
    db.create_all()
    print('Database tables created')
"
```

## 🌐 Vercel Deployment (Frontend)

### 1. Repository Setup
```bash
# Ensure your code is in GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Vercel Configuration
Create `vercel.json` in project root:
```json
{
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "buildCommand": "cd frontend && pnpm install && pnpm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && pnpm install"
}
```

### 3. Build Configuration
Update `frontend/package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 4. Vite Configuration
Update `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'recharts']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
```

## 🚂 Railway Deployment (Backend)

### 1. Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 2. Railway Configuration
Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && python src/main.py",
    "healthcheckPath": "/health"
  }
}
```

### 3. Procfile
Create `Procfile` in backend directory:
```
web: python src/main.py
```

### 4. Requirements
Ensure `backend/requirements.txt` is complete:
```txt
Flask==2.3.3
Flask-SQLAlchemy==3.0.5
Flask-CORS==4.0.0
psycopg2-binary==2.9.7
python-dotenv==1.0.0
Werkzeug==2.3.7
requests==2.31.0
```

## 🎯 Production Optimizations

### Frontend Optimizations
- Enable gzip compression
- Implement code splitting
- Optimize images and assets
- Add service worker for caching
- Minify CSS and JavaScript

### Backend Optimizations
- Use production WSGI server (Gunicorn)
- Enable database connection pooling
- Implement Redis for caching
- Add rate limiting middleware
- Configure logging and monitoring

## 🔒 Security Considerations

### Frontend Security
- Sanitize all user inputs
- Implement Content Security Policy
- Use HTTPS only
- Validate all API responses

### Backend Security
- Use environment variables for secrets
- Implement proper authentication
- Add request validation
- Enable CORS properly
- Use secure session cookies

## 📊 Monitoring & Analytics

### Application Monitoring
- Set up error tracking (Sentry)
- Monitor performance metrics
- Track user analytics
- Set up uptime monitoring

### Database Monitoring
- Monitor query performance
- Set up backup schedules
- Track database size and growth
- Monitor connection pools

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

#### Database Connection Issues
```bash
# Test database connection
python -c "
import psycopg2
conn = psycopg2.connect('your-database-url')
print('Database connected successfully')
"
```

#### CORS Issues
```python
# Update CORS configuration in Flask
from flask_cors import CORS

CORS(app, origins=['https://your-frontend-domain.com'])
```

## 📝 Post-Deployment Tasks

1. **Test all functionality**
   - Login/registration
   - Dashboard navigation
   - API endpoints
   - Mobile responsiveness

2. **Configure monitoring**
   - Set up error tracking
   - Configure alerts
   - Monitor performance

3. **Set up backups**
   - Database backups
   - Code repository backups
   - Configuration backups

4. **Update documentation**
   - API documentation
   - User guides
   - Deployment notes

## 🎉 Go Live Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and responding
- [ ] Database connected and populated
- [ ] All API endpoints working
- [ ] Authentication functioning
- [ ] Mobile interface tested
- [ ] Error monitoring active
- [ ] Backups configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Performance optimized

## 📞 Support

For deployment issues or questions:
- Check logs in deployment platform
- Review environment variables
- Test API endpoints individually
- Verify database connections
- Contact development team if needed

