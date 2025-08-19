import os
from main import app

# Production WSGI configuration
if __name__ == "__main__":
    # Only for local development
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
else:
    # Production mode for Vercel
    application = app

