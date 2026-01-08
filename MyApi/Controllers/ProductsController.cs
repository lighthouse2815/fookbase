using Microsoft.AspNetCore.Mvc;
using MyApi.Models;

namespace MyApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // Static list to simulate a database
    private static readonly List<Product> _products = new()
    {
        new Product { Id = 1, Name = "Laptop", Price = 999.99m, Category = "Electronics" },
        new Product { Id = 2, Name = "Mouse", Price = 29.99m, Category = "Electronics" },
        new Product { Id = 3, Name = "Desk Chair", Price = 199.99m, Category = "Furniture" }
    };

    private static int _nextId = 4; // For auto-incrementing IDs

    /// <summary>
    /// Get all products
    /// </summary>
    /// <returns>List of all products</returns>
    [HttpGet]
    public ActionResult<IEnumerable<Product>> GetAllProducts()
    {
        return Ok(_products);
    }

    /// <summary>
    /// Get a specific product by ID
    /// </summary>
    /// <param name="id">Product ID</param>
    /// <returns>Product if found, 404 if not found</returns>
    [HttpGet("{id}")]
    public ActionResult<Product> GetProductById(int id)
    {
        var product = _products.FirstOrDefault(p => p.Id == id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} not found." });
        }

        return Ok(product);
    }

    /// <summary>
    /// Create a new product
    /// </summary>
    /// <param name="product">Product data (ID will be auto-generated)</param>
    /// <returns>Created product with auto-generated ID</returns>
    [HttpPost]
    public ActionResult<Product> CreateProduct([FromBody] Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Name))
        {
            return BadRequest(new { message = "Product name is required." });
        }

        if (product.Price <= 0)
        {
            return BadRequest(new { message = "Product price must be greater than zero." });
        }

        // Auto-increment the ID
        product.Id = _nextId++;

        _products.Add(product);

        // Return 201 Created with location header
        return CreatedAtAction(
            nameof(GetProductById),
            new { id = product.Id },
            product
        );
    }

    /// <summary>
    /// Update an existing product
    /// </summary>
    /// <param name="id">Product ID to update</param>
    /// <param name="updatedProduct">Updated product data</param>
    /// <returns>NoContent if successful, 404 if not found</returns>
    [HttpPut("{id}")]
    public IActionResult UpdateProduct(int id, [FromBody] Product updatedProduct)
    {
        var existingProduct = _products.FirstOrDefault(p => p.Id == id);

        if (existingProduct == null)
        {
            return NotFound(new { message = $"Product with ID {id} not found." });
        }

        if (string.IsNullOrWhiteSpace(updatedProduct.Name))
        {
            return BadRequest(new { message = "Product name is required." });
        }

        if (updatedProduct.Price <= 0)
        {
            return BadRequest(new { message = "Product price must be greater than zero." });
        }

        // Update the product properties
        existingProduct.Name = updatedProduct.Name;
        existingProduct.Price = updatedProduct.Price;
        existingProduct.Category = updatedProduct.Category;

        return NoContent();
    }

    /// <summary>
    /// Delete a product
    /// </summary>
    /// <param name="id">Product ID to delete</param>
    /// <returns>NoContent if successful, 404 if not found</returns>
    [HttpDelete("{id}")]
    public IActionResult DeleteProduct(int id)
    {
        var product = _products.FirstOrDefault(p => p.Id == id);

        if (product == null)
        {
            return NotFound(new { message = $"Product with ID {id} not found." });
        }

        _products.Remove(product);

        return NoContent();
    }
}
