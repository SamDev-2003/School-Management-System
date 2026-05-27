# SMS – School Management System

Full-stack app: Node.js + Express + MongoDB backend, React + Vite + Tailwind frontend.

## QUICK START

### 1. Prerequisites
- Node.js v18+
- MongoDB running locally (uses "sms" database)

### 2. Backend Setup
```
cd backend
npm install
# .env is already configured for mongodb://127.0.0.1:27017/sms
npm run seed       # populate sample data
npm run dev        # starts on http://localhost:5000
```

### 3. Frontend Setup
```
cd frontend
npm install
npm run dev        # starts on http://localhost:5173
```

### 4. Open browser
http://localhost:5173

## LOGIN CREDENTIALS (after seeding)
| Role    | Email             | Password    |
|---------|-------------------|-------------|
| Admin   | admin@sms.com     | admin123    |
| Teacher | sarah@sms.com     | teacher123  |
| Teacher | james@sms.com     | teacher123  |
| Student | alice@sms.com     | student123  |
| Student | david@sms.com     | student123  |

## FEATURES
### Admin
- Dashboard with charts and stats
- Full CRUD: Students, Teachers, Courses
- Assign teachers to courses
- Generate academic reports

### Teacher  
- Record daily attendance (bulk)
- Enter exam marks with live grade preview
- View enrolled students per course

### Student
- View marks by subject with radar chart
- View attendance with per-course breakdown
- Full academic report with print option
