# FlyPoint - Backend

## Features

- User authentication and JWT-based authorization
- Role-based access control (Admin, User, DeliveryMen)
- Parcel booking, tracking, and management
- Payment integration with Stripe
- Review and rating system for delivery men
- Statistical data endpoints for admin

## Technologies Used

- Node.js
- Express
- MongoDB
- JWT for authentication
- Stripe for payment processing
- dotenv for environment variables

## Installation

1. Clone the repository:

```bash
git clone https://github.com/abdullahrafi1234/flyPoint-server.git
```

2. Install dependencies:

```bash
cd parcel-pro-server
npm install
```

3. Create a .env file in the root directory and add your MongoDB and other credentials:

 ```env
DB_USER=your-mongodb-user
DB_PASS=your-mongodb-pass
ACCESS_TOKEN_SECRET=jwt-access-token
STRIPE_SECRET_KEY=stripe-secret-key
```

4. Start the development server:

```bash
nodemon index.js
```
