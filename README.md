# 💰 BudgetVault

**Master Your Money** — A beautiful, intuitive personal finance tracker built with React & FastAPI.

Track expenses, set budgets, and achieve your savings goals with a world-class UI designed to encourage saving money.

![BudgetVault](https://img.shields.io/badge/Currency-Indian%20Rupees%20(₹)-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)

---

## ✨ Features

### 📊 Dashboard
- Monthly overview with income, expenses, and balance
- Visual spending breakdown with interactive pie charts
- Recent transactions at a glance
- Budget progress indicators with alerts

### 💳 Transaction Management
- Add income and expenses with categories
- Date picker for transaction dates
- Edit and delete transactions
- Filter by month and type

### 🎯 Budget Tracking
- Set monthly budget limits per category
- Visual progress bars
- Alerts at 80% and 100% thresholds
- Category-wise spending analysis

### 🐷 Savings Goals
- Create goals with target amounts and deadlines
- Track progress with visual indicators
- Add money to goals incrementally
- Custom icons and colors

### 📈 Analytics
- 6-month spending trends
- Income vs Expenses comparison
- Savings rate tracking
- Category breakdown charts

### 🎨 Design
- Beautiful "Emerald Vault" theme
- Auto dark/light mode
- Mobile responsive
- Smooth animations with Framer Motion

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion |
| **Backend** | FastAPI, Python 3.9+, Uvicorn |
| **Database** | MongoDB |
| **Fonts** | Fraunces (headings), Manrope (body), JetBrains Mono (numbers) |

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas) - free tier)

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/budget.git
cd budget
```

### 2. Setup MongoDB

**Option A: MongoDB Atlas (Recommended - Free)**
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Get your connection string

**Option B: Local MongoDB**
```bash
# macOS
brew install mongodb-community && brew services start mongodb-community

# Ubuntu
sudo apt install mongodb && sudo systemctl start mongodb
```

### 3. Configure Environment

Create `backend/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=budget_app
CORS_ORIGINS=http://localhost:3000
```

Create `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 4. Run the App

**Option A: One Command (Recommended)**
```bash
./run.sh
```

**Option B: Manual Setup**

Terminal 1 - Backend:
```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

### 5. Open the App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api

---

## 📁 Project Structure

```
budget/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # API client & utilities
│   │   └── hooks/        # Custom React hooks
│   ├── public/           # Static assets & PWA config
│   └── package.json      # Node dependencies
├── run.sh                # One-click startup script
└── README.md
```

---

## 🔌 API Endpoints

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create custom category |
| DELETE | `/api/categories/{id}` | Delete custom category |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get transactions (filter by month/type) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/{id}` | Update transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get budgets (filter by month) |
| POST | `/api/budgets` | Create/update budget |
| DELETE | `/api/budgets/{id}` | Delete budget |

### Savings Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/savings-goals` | Get all savings goals |
| POST | `/api/savings-goals` | Create savings goal |
| PUT | `/api/savings-goals/{id}` | Update savings goal |
| DELETE | `/api/savings-goals/{id}` | Delete savings goal |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Get monthly dashboard data |
| GET | `/api/analytics/trends` | Get spending trends |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Shadcn/UI](https://ui.shadcn.com/) for beautiful components
- [Recharts](https://recharts.org/) for charts
- [Lucide](https://lucide.dev/) for icons
- [Framer Motion](https://www.framer.com/motion/) for animations

---

<p align="center">
  Made with ❤️ for better financial habits
</p>
