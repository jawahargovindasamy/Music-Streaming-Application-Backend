# Music Streaming Backend

A Node.js/Express backend for a music streaming application. This project provides RESTful APIs for user authentication, music streaming, playlist management, artist and album management, and more. It uses MongoDB for data storage and supports file uploads via Cloudinary.

## Features
- User authentication (JWT-based)
- Admin, artist, and user roles
- Song, album, and artist management
- Playlist creation and management
- Music streaming endpoints
- Search functionality
- Email notifications (via Nodemailer)
- File uploads (album art, profile pictures, songs) using Cloudinary\


## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB instance (local or cloud)
- Cloudinary account (for file uploads)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd music-streaming-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add variables like:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```

### Running the Server
- For development (with auto-reload):
  ```bash
  npm run dev
  ```
- For production:
  ```bash
  npm start
  ```

The server will run on `http://localhost:5000` by default.

## API Endpoints

- `/api/auth`      - Authentication (register, login, etc.)
- `/api/user`      - User profile and actions
- `/api/song`      - Song management and streaming
- `/api/album`     - Album management
- `/api/admin`     - Admin-specific actions
- `/api/artist`    - Artist management
- `/api/stream`    - Streaming endpoints
- `/api/playlist`  - Playlist management

Refer to the route files in the `Routes/` folder for detailed endpoint definitions.

## Technologies Used
- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- Cloudinary (file uploads)
- Multer (handling multipart/form-data)
- Nodemailer (email notifications)
- dotenv (environment variables)
- bcrypt (password hashing)
- CORS
