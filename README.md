# BatteryEMS AI: Intelligent Solar and Battery Energy Management System Planning

## Overview
BatteryEMS AI is a specialized decision-support tool designed for the optimal planning and scheduling of Solar Photovoltaic (PV) and Battery Energy Storage Systems (BESS) in commercial and residential buildings. The platform utilizes advanced optimization algorithms to provide data-driven recommendations on system sizing, financial feasibility, and operational strategies.

## Methodology
The core analysis engine employs a multi-objective optimization framework that evaluates candidate system configurations against several key metrics:
- Economic Viability: Annual savings and simple payback period calculations based on local tariff structures (Flat or Time-of-Use).
- Energy Independence: Reduction in grid import dependency and maximization of solar self-consumption.
- Peak Demand Management: Mitigation of peak grid demand through intelligent battery scheduling.
- Sensitivity Analysis: Evaluation of system performance across varying solar irradiance and tariff scenarios.

## Key Features
- Dynamic System Sizing: AI-driven recommendations for solar capacity (kW) and battery storage (kWh).
- Advanced Scheduling: Rule-based scheduling logic for battery charge/discharge cycles based on load profiles and solar generation.
- Interactive Visualization: High-fidelity dashboards providing hourly energy profiles, state-of-charge (SOC) monitoring, and scenario comparisons.
- Building Presets: Pre-configured load profiles for various building types (e.g., Apartment Societies, Hospitals, Educational Institutes).

## Architecture
The system is built using a modern decoupled architecture:
- Backend: Developed with FastAPI (Python), handling complex numerical optimizations and data processing using NumPy and Pandas.
- Frontend: Built with Next.js 16 and React 19, utilizing Zustand for state management and Recharts for data visualization.
- API: A RESTful interface that facilitates seamless communication between the analytical engine and the user interface.

## Technical Specifications
- Optimization Engine: Grid-search based optimization with configurable constraints.
- Data Integration: Support for synthetic and real-world residential/commercial load profiles.
- Frontend Aesthetics: Premium dark-themed dashboard with glassmorphism design principles and responsive layouts.

## Academic Context
This project was developed as part of the EE3094E B.Tech Minor Project. It serves as an academic demonstration of transactive energy concepts and intelligent microgrid management.

## Installation and Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or pnpm

### Backend Setup
1. Navigate to the backend directory:
   cd backend
2. Install dependencies:
   pip install -r requirements.txt
3. Start the server:
   python -m uvicorn app.main:app --reload --port 8000

### Frontend Setup
1. Navigate to the frontend directory:
   cd frontend
2. Install dependencies:
   npm install
3. Start the development server:
   npm run dev

## License
This project is for academic purposes only. All rights reserved.
