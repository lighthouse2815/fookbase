# Product Management API

A clean RESTful API built with .NET 9 Web API for managing products.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ In-memory data storage using static List
- ✅ Auto-incrementing IDs
- ✅ Proper HTTP status codes and error handling
- ✅ Input validation
- ✅ Clean, well-structured code

## Project Structure

```
MyApi/
├── Models/
│   └── Product.cs              # Product model
├── Controllers/
│   └── ProductsController.cs   # API controller with all endpoints
├── Program.cs                  # Application entry point
└── Products.http               # HTTP test file
```

## Product Model

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
}
```

## API Endpoints

### 1. Get All Products
```http
GET /api/products
```
**Response:** `200 OK` with array of products

---

### 2. Get Product by ID
```http
GET /api/products/{id}
```
**Response:** 
- `200 OK` with product object
- `404 Not Found` if product doesn't exist

---

### 3. Create New Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics"
}
```
**Response:** 
- `201 Created` with product object (ID auto-generated)
- `400 Bad Request` if validation fails

**Note:** You don't need to provide an ID - it will be auto-generated.

---

### 4. Update Product
```http
PUT /api/products/{id}
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "price": 1299.99,
  "category": "Electronics"
}
```
**Response:** 
- `204 No Content` if successful
- `404 Not Found` if product doesn't exist
- `400 Bad Request` if validation fails

---

### 5. Delete Product
```http
DELETE /api/products/{id}
```
**Response:** 
- `204 No Content` if successful
- `404 Not Found` if product doesn't exist

---

## Running the API

1. **Build the project:**
   ```bash
   dotnet build
   ```

2. **Run the API:**
   ```bash
   dotnet run
   ```

3. **The API will start on HTTPS** (check console for the port, typically `https://localhost:7115`)

## Testing the API

### Option 1: Using the .http file (Recommended)
1. Open `Products.http` in Visual Studio Code or Cursor
2. Make sure the API is running
3. Click "Send Request" above any request
4. Update the `@baseUrl` variable if your port is different

### Option 2: Using curl

```bash
# Get all products
curl https://localhost:7115/api/products

# Get specific product
curl https://localhost:7115/api/products/1

# Create product
curl -X POST https://localhost:7115/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":299.99,"category":"Electronics"}'

# Update product
curl -X PUT https://localhost:7115/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Gaming Monitor","price":399.99,"category":"Electronics"}'

# Delete product
curl -X DELETE https://localhost:7115/api/products/1
```

### Option 3: Using Postman, Thunder Client, or similar tools

Import the endpoints from `Products.http` or create requests manually.

## Sample Data

The API comes pre-loaded with sample products:

| ID | Name | Price | Category |
|----|------|-------|----------|
| 1 | Laptop | $999.99 | Electronics |
| 2 | Mouse | $29.99 | Electronics |
| 3 | Desk Chair | $199.99 | Furniture |

## Validation Rules

- **Name:** Required, cannot be empty or whitespace
- **Price:** Must be greater than zero
- **Category:** Optional

## Error Responses

All error responses follow this format:

```json
{
  "message": "Error description here"
}
```

## Notes

- Data is stored in a **static List** - it will reset when you restart the application
- IDs are auto-incremented starting from 4 (after the 3 pre-loaded items)
- The API uses standard HTTP status codes (200, 201, 204, 400, 404)
- All responses use JSON format

## Future Improvements

To make this production-ready, consider:
- Replace static List with a real database (SQL Server, PostgreSQL, etc.)
- Add authentication and authorization
- Implement pagination for GET all products
- Add logging
- Add unit tests
- Implement DTOs for better separation of concerns
- Add Swagger/OpenAPI documentation
