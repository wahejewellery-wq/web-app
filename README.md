# Gold Jewellery Estimation Platform

A premium web application for estimating the value of gold jewellery using AI-powered analysis and real-time market data.

## Features

- **AI-Powered Analysis**: Upload a photo of your jewellery to automatically detect type and karat.
- **Accurate Valuation**: Get estimated market value based on current gold and diamond prices.
- **Portfolio Tracking**: Save your valuations and track the total value of your collection over time.
- **Premium Design**: A modern, gold-themed user interface built for a luxurious experience.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (CSS Modules & Global Variables)
- **Language**: TypeScript
- **State Management**: React Hooks
- **Persistence**: LocalStorage (for demo purposes)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/app`: Page routes and API endpoints.
- `src/components`: Reusable UI components.
- `src/lib`: Utility functions and storage logic.
- `public`: Static assets.

## Future Enhancements (Roadmap)

- Integration with real Metal Price API.
- Cloud storage for portfolio persistence (PostgreSQL/Supabase).
- Live camera capture support for mobile users.
- Authentication (NextAuth.js).
