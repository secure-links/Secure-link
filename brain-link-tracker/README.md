# Brain Link Tracker - Advanced Email Link Tracking System

A comprehensive email link tracking application with advanced analytics, security features, and real-time monitoring capabilities.

## 🚀 Features

### Core Functionality
- **Email Link Tracking**: Track email opens, clicks, and user engagement
- **Campaign Management**: Organize tracking links into campaigns with detailed analytics
- **Real-time Analytics**: Live dashboard with comprehensive metrics and visualizations
- **Geographic Tracking**: Interactive world map showing visitor locations
- **Security Monitoring**: Bot detection, proxy blocking, and threat analysis
- **Live Activity Feed**: Real-time monitoring of tracking events

### Advanced Features
- **Country Filtering**: Allow/block specific countries for targeted campaigns
- **Email Capture**: Capture recipient email addresses from tracking parameters
- **Telegram Integration**: Automated notifications and reporting via Telegram bot
- **Mobile Responsive**: Fully responsive design for all device types
- **Theme Support**: Dark/Light/Original theme switching
- **Admin Panel**: User management and system administration (placeholder)
- **Link Shortener**: Simple URL shortening service (placeholder)

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with Vite for fast development
- **UI Library**: Tailwind CSS + Shadcn/UI components
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icons
- **Maps**: React Simple Maps for geographic visualization
- **Routing**: React Router for navigation

### Backend (Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Session-based authentication
- **Security**: CORS enabled, bot detection, rate limiting
- **APIs**: RESTful API endpoints for all functionality

## 📁 Project Structure

```
brain-link-tracker/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── tabs/        # Dashboard tab components
│   │   │   ├── Dashboard.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── contexts/        # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Flask backend API
│   ├── src/
│   │   ├── models/          # Database models
│   │   │   └── user.py
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── links.py
│   │   │   ├── analytics.py
│   │   │   ├── tracking.py
│   │   │   ├── events.py
│   │   │   ├── security.py
│   │   │   └── campaigns.py
│   │   ├── utils/           # Utility functions
│   │   │   ├── auth.py
│   │   │   └── security.py
│   │   └── main.py          # Flask application entry point
│   ├── requirements.txt
│   └── .env
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.11+
- PostgreSQL (for production)

### Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

### Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## 🎯 Dashboard Tabs

### 1. Analytics Overview
- Real-time statistics dashboard
- Key performance indicators
- Quick access to important metrics

### 2. Tracking Links
- Create and manage tracking links
- Configure country filtering and email capture
- Link performance analytics

### 3. Link Shortener (Placeholder)
- Simple URL shortening without tracking
- Custom aliases and domains
- Basic click statistics

### 4. Advanced Analytics
- Detailed charts and graphs
- Time-based analysis
- Device and browser breakdowns

### 5. Geography
- Interactive world map
- Country and city statistics
- Geographic filtering options

### 6. Security
- Threat monitoring and blocking
- Bot detection settings
- IP address management

### 7. Live Activity
- Real-time event monitoring
- Live visitor tracking
- Activity filtering and search

### 8. Campaigns
- Campaign creation and management
- Detailed performance metrics
- Campaign-specific analytics

### 9. Settings
- Telegram integration setup
- Security configuration
- Notification preferences

### 10. Admin (Placeholder)
- User management
- System administration
- Performance monitoring

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Links Management
- `GET /api/links` - Get user's tracking links
- `POST /api/links` - Create new tracking link
- `PUT /api/links/:id` - Update tracking link
- `DELETE /api/links/:id` - Delete tracking link

### Analytics
- `GET /api/analytics/overview` - Dashboard statistics
- `GET /api/analytics/advanced` - Detailed analytics
- `GET /api/analytics/geography` - Geographic data

### Tracking
- `GET /t/:code` - Track link click and redirect
- `GET /api/events/live` - Live activity feed

### Campaigns
- `GET /api/campaigns` - Get campaigns
- `POST /api/campaigns` - Create campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Security
- `GET /api/security/overview` - Security dashboard
- `PUT /api/security/settings` - Update security settings

## 🚀 Deployment

### Vercel Deployment (Frontend)
1. Connect your GitHub repository to Vercel
2. Set build command: `cd frontend && pnpm run build`
3. Set output directory: `frontend/dist`
4. Deploy automatically on push

### Backend Deployment
- Can be deployed to Railway, Render, or Heroku
- Configure PostgreSQL database
- Set environment variables
- Update CORS settings for production domain

## 🔐 Security Features

- **Bot Detection**: Automatic detection and blocking of bot traffic
- **Proxy/VPN Blocking**: Block traffic from known proxy services
- **Rate Limiting**: Prevent abuse with request rate limiting
- **Geographic Filtering**: Allow/block specific countries
- **IP Monitoring**: Track and block suspicious IP addresses

## 📱 Mobile Responsiveness

- Fully responsive design for all screen sizes
- Touch-friendly interface elements
- Optimized navigation for mobile devices
- Consistent experience across platforms

## 🎨 Theming

- **Original Theme**: Purple gradient design matching previous version
- **Dark Theme**: Dark mode for low-light environments
- **Light Theme**: Clean light interface
- Persistent theme selection across sessions

## 📊 Analytics Features

- Real-time visitor tracking
- Geographic distribution analysis
- Device and browser statistics
- Campaign performance metrics
- Conversion tracking
- Time-based trend analysis

## 🤖 Telegram Integration

- Automated campaign reports
- Real-time activity notifications
- Security alerts
- Customizable notification frequency
- Easy bot setup and configuration

## 📝 Default Credentials

- **Username**: admin
- **Password**: admin123

## 🐛 Known Issues

- Database schema needs optimization for production
- Some API endpoints require database fixes
- Telegram integration needs testing with real bot

## 🔮 Future Enhancements

- Advanced user management system
- API rate limiting and quotas
- Webhook integrations
- Advanced reporting features
- Multi-language support
- Custom domain support for link shortener

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support and questions, please contact the development team.

