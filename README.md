# Sunny Backrey Inventory Management

This is a React frontend for the Sunny Backrey inventory management system.

## Setup Instructions

1. Create a `.env` file in the root of the sunny-backrey directory with the following content:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Backend Connection

The application is configured to connect to the backend API at the URL specified in the `.env` file. Make sure the backend server is running before starting the frontend.

## Features

- Real-time inventory management
- Add, update, and delete inventory items
- Prepare inventory for next day
- Authentication for admin functions