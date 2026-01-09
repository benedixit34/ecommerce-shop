# eCommerce Shop Documentation

A backend **eCommerce API** built with **TypeScript**, **Express.js**, **MongoDB**, and **Docker**, providing endpoints for Products, Categories, Orders, and (optionally) Users.

---

## 1. Introduction

This project implements a RESTful backend for an eCommerce store using **Node.js**, **Express**, **MongoDB**, and **TypeScript**. It includes essential endpoints to manage products, categories, orders, and optionally users and authentication. It also supports **Docker** for easy deployment.

---

## 2. Features

* CRUD for **Products**
* CRUD for **Categories**
* CRUD for **Orders**
* MongoDB integration via **Mongoose**
* Automatically generates URL-friendly **slugs**
* Dockerized environment for local development
* Structured TypeScript code for maintainability

---

## 3. Tech Stack

| Component        | Technology              |
| ---------------- | ----------------------- |
| Backend          | Node.js + Express.js    |
| Language         | TypeScript              |
| Database         | MongoDB                 |
| ORM              | Mongoose                |
| Containerization | Docker & Docker Compose |

---

## 4. Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/benedixit34/ecommerce-shop.git
cd ecommerce-shop
```

### Install Dependencies

```bash
npm install
```

---

## 5. Environment Variables

Create a `.env` file at the root:

```
PORT=5000
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRE=1d
```

---

## 6. Running the App

### Local (Development)

```bash
npm run dev
```

Your API will be available at:

```
http://localhost:5000
```

### Using Docker

```bash
docker-compose up --build
```

---

## 7. API Documentation

Here are the core API endpoints with request and response examples.

---

### **Categories**

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| GET    | `/api/v1/categories`     | List all categories   |
| POST   | `/api/v1/categories`     | Create a new category |
| GET    | `/api/v1/categories/:id` | Get a category by ID  |
| PUT    | `/api/v1/categories/:id` | Update a category     |
| DELETE | `/api/v1/categories/:id` | Delete a category     |

**Example JSON — Create Category**

```json
{
  "name": "Electronics",
  "description": "Devices, accessories and gadgets",
  "parent": null,
  "image": "https://example.com/electronics.jpg",
  "isActive": true
}
```

---

### **Products**

| Method | Endpoint               | Description                |
| ------ | ---------------------- | -------------------------- |
| GET    | `/api/v1/products`     | Get all products           |
| POST   | `/api/v1/products`     | Create a new product       |
| GET    | `/api/v1/products/:id` | Get a specific product     |
| PUT    | `/api/v1/products/:id` | Update product information |
| DELETE | `/api/v1/products/:id` | Delete product             |

**Example JSON — Create Product**

```json
{
  "name": "Smartphone",
  "price": 599.99,
  "description": "Latest model with high performance",
  "category": "64f4b0c3b4a3a72b1d3e4f1a",
  "image": "https://example.com/smartphone.jpg",
  "isActive": true
}
```

---

### **Orders**

| Method | Endpoint             | Description              |
| ------ | -------------------- | ------------------------ |
| GET    | `/api/v1/orders`     | Get all orders           |
| POST   | `/api/v1/orders`     | Create a new order       |
| GET    | `/api/v1/orders/:id` | Get order by ID          |
| PUT    | `/api/v1/orders/:id` | Update an existing order |
| DELETE | `/api/v1/orders/:id` | Delete an order          |

**Example JSON — Create Order**

```json
{
  "products": [
    {
      "productId": "64f4b2c3b4a3a72b1d3e4f2b",
      "quantity": 2
    }
  ],
  "totalAmount": 1199.98,
  "user": "64f4b3d3b4a3a72b1d3e4f3c",
  "status": "pending"
}
```

---

### **Users (Optional)**

| Method | Endpoint              | Description             |
| ------ | --------------------- | ----------------------- |
| POST   | `/api/v1/auth/signup` | Register a new user     |
| POST   | `/api/v1/auth/login`  | Login and obtain token  |
| GET    | `/api/v1/users`       | List users (admin only) |
| GET    | `/api/v1/users/:id`   | Get user profile        |

---

## 8. Data Models

### **Category Model**

```js
{
  name: String,
  slug: String,
  description: String,
  parent: ObjectId | null,
  image: String,
  isActive: Boolean
}
```

### **Product Model**

```js
{
  name: String,
  price: Number,
  description: String,
  category: ObjectId,
  image: String,
  isActive: Boolean
}
```

### **Order Model**

```js
{
  products: [{ productId: ObjectId, quantity: Number }],
  totalAmount: Number,
  user: ObjectId,
  status: String
}
```

---

## 9. Error Handling

All API responses should include structured JSON with appropriate HTTP status codes. Example error:

```json
{
  "status": "error",
  "message": "Product not found"
}
```

---

## 10. Testing

You can use **Postman**, **Curl** or **Insomnia** to test endpoints. Example (Postman):

**GET All Products**

```
GET http://localhost:5000/api/v1/products
```

---

## 11. Deployment

1. Build with Docker
2. Push to container registry
3. Deploy to cloud provider (DigitalOcean, AWS, etc.)
4. Configure environment variables in your production environment

---

## 12. Contributing

1. **Fork** the repo
2. Create a branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'Add awesome feature'`)
4. Push to branch (`git push origin feature/awesome-feature`)
5. Open a **Pull Request**

---