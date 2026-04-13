# 📈 Polynomial Regression Dashboard

<div align="center">
  
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
[![Made with Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Made with React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)  

  **A modern, feature-rich real-time chat application built with the MERN stack**
  
  [Features](#-features) • [Demo](#-demo) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment)

</div>

An interactive dashboard for exploring polynomial regression,
built with React, TypeScript, and Vite.

🔗 **Live Demo**: [Click here](https://chandan-int.github.io/Polynomial-Regression-Dashboard/)

---

## ✨ Features

- **Interactive curve fitting** — adjust polynomial degree (1–10) in real time
- **Gradient Descent animation** — watch the model learn step by step with smooth 160-frame animation
- **Trail effect** — see previous curve positions fade out as the fit improves
- **Live metrics** — R², RMSE, Loss, and β coefficients update every frame
- **Loss curve** — dedicated mini-chart shows MSE dropping over training steps
- **Playback controls** — Play, Pause, Reset, Step-by-step, and Speed (0.5×–4×)
- **Multiple datasets** — Linear, Quadratic, Cubic, Sinusoidal, Exponential, Random
- **Residuals plot** — visualize prediction errors
- **Degree comparison** — see R² across all polynomial degrees side by side

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- Yarn

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/polynomial-regression-dashboard.git
cd polynomial-regression-dashboard
yarn
yarn dev
```

Open your browser at `http://localhost:5173`

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Recharts | Chart components |
| HTML Canvas | Animation rendering |

---

## 📊 How It Works

### Gradient Descent Animation
The animation simulates real model training:
1. Starts with near-zero random coefficients
2. Computes predictions using the current polynomial
3. Calculates MSE loss and gradients
4. Updates coefficients step by step
5. Repeats ~1920 steps, sub-sampled to 160 smooth frames

### Polynomial Fitting
Uses the **Normal Equation** method (equivalent to NumPy's `polyfit`):
- Builds a Vandermonde matrix
- Solves normal equations via Gaussian elimination
- Returns coefficients from highest to lowest degree

---

## 📁 Project Structure
src/ </br>
├── components </br>
│   ├── AnimatedCurve.tsx   # Gradient descent animation </br>
│   ├── ScatterChart.tsx    # Static fitted curve + data points  </br>
│   ├── ResidualsChart.tsx  # Residuals visualization </br>
│   ├── DegreeCompare.tsx   # R² by degree bar chart </br>
│   ├── StatsPanel.tsx      # Metrics sidebar </br>
│   └── Sidebar.tsx         # Controls panel </br>
├── utils/ </br>
│   └── polyMath.ts         # All math: polyFit, GD, R², RMSE  </br>
├── App.tsx  </br>
└── main.tsx </br>

## 🙋 Author

**Chandan-int**

- GitHub: [@Chandan-int](https://github.com/Chandan-int)

If you find this project helpful, please consider giving it a ⭐!

Made with ❤️ by Chandan-int
