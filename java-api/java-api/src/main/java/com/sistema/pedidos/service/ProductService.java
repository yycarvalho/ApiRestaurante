package com.sistema.pedidos.service;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.util.Db;

public class ProductService {

	/** CREATE */
	public Product create(Product product) throws Exception {
		validateProduct(product);

		if (findByName(product.getName()) != null) {
			throw new IllegalArgumentException("Já existe um produto com este nome");
		}

		String sql = "INSERT INTO products (name, description, price, category, active) VALUES (?, ?, ?, ?, ?)";
		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

			stmt.setString(1, product.getName());
			stmt.setString(2, product.getDescription());
			stmt.setBigDecimal(3, product.getPrice());
			stmt.setString(4, product.getCategory());
			stmt.setBoolean(5, product.isActive());
			stmt.executeUpdate();

			try (ResultSet keys = stmt.getGeneratedKeys()) {
				if (keys.next()) {
					product.setId(keys.getLong(1));
				}
			}
		}

		return findById(product.getId()); // retorna com createdAt/updatedAt preenchidos
	}

	/** READ */
	public Product findById(Long id) throws Exception {
		String sql = "SELECT * FROM products WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setLong(1, id);
			try (ResultSet rs = stmt.executeQuery()) {
				if (rs.next()) {
					return mapResultSetToProduct(rs);
				}
			}
		}
		return null;
	}

	public Product findByName(String name) throws Exception {
		String sql = "SELECT * FROM products WHERE LOWER(name) = LOWER(?)";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, name);
			try (ResultSet rs = stmt.executeQuery()) {
				if (rs.next()) {
					return mapResultSetToProduct(rs);
				}
			}
		}
		return null;
	}

	public List<Product> findAll() throws Exception {
		String sql = "SELECT * FROM products";
		List<Product> products = new ArrayList<>();
		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql);
				ResultSet rs = stmt.executeQuery()) {

			while (rs.next()) {
				products.add(mapResultSetToProduct(rs));
			}
		}
		return products;
	}

	public List<Product> findByCategory(String category) throws Exception {
		String sql = "SELECT * FROM products WHERE category = ?";
		List<Product> products = new ArrayList<>();
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, category);
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					products.add(mapResultSetToProduct(rs));
				}
			}
		}
		return products;
	}

	public List<Product> findActiveProducts() throws Exception {
		String sql = "SELECT * FROM products WHERE active = 1";
		List<Product> products = new ArrayList<>();
		try (Connection conn = Db.getConnection();
				PreparedStatement stmt = conn.prepareStatement(sql);
				ResultSet rs = stmt.executeQuery()) {

			while (rs.next()) {
				products.add(mapResultSetToProduct(rs));
			}
		}
		return products;
	}

	public List<Product> findByNameContaining(String name) throws Exception {
		String sql = "SELECT * FROM products WHERE LOWER(name) LIKE LOWER(?)";
		List<Product> products = new ArrayList<>();
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, "%" + name + "%");
			try (ResultSet rs = stmt.executeQuery()) {
				while (rs.next()) {
					products.add(mapResultSetToProduct(rs));
				}
			}
		}
		return products;
	}

	/** UPDATE */
	public Product update(Long id, Product updatedProduct) throws Exception {
		Product existing = findById(id);
		if (existing == null)
			throw new IllegalArgumentException("Produto não encontrado");

		if (!existing.getName().equalsIgnoreCase(updatedProduct.getName())
				&& findByName(updatedProduct.getName()) != null) {
			throw new IllegalArgumentException("Já existe um produto com este nome");
		}

		String sql = "UPDATE products SET name = ?, description = ?, price = ?, category = ?, active = ?, updated_at = NOW() WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setString(1, updatedProduct.getName());
			stmt.setString(2, updatedProduct.getDescription());
			stmt.setBigDecimal(3, updatedProduct.getPrice());
			stmt.setString(4, updatedProduct.getCategory());
			stmt.setBoolean(5, updatedProduct.isActive());
			stmt.setLong(6, id);
			stmt.executeUpdate();
		}

		return findById(id);
	}

	/** DELETE */
	public boolean delete(Long id) throws Exception {
		String sql = "DELETE FROM products WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setLong(1, id);
			return stmt.executeUpdate() > 0;
		}
	}

	/** TOGGLE STATUS */
	public Product toggleProductStatus(Long id) throws Exception {
		Product product = findById(id);
		if (product == null)
			throw new IllegalArgumentException("Produto não encontrado");

		String sql = "UPDATE products SET active = ?, updated_at = NOW() WHERE id = ?";
		try (Connection conn = Db.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

			stmt.setBoolean(1, !product.isActive());
			stmt.setLong(2, id);
			stmt.executeUpdate();
		}

		return findById(id);
	}

	/** HELPERS */
	private Product mapResultSetToProduct(ResultSet rs) throws Exception {
		Product product = new Product();
		product.setId(rs.getLong("id"));
		product.setName(rs.getString("name"));
		product.setDescription(rs.getString("description"));
		product.setPrice(rs.getBigDecimal("price"));
		product.setCategory(rs.getString("category"));
		product.setActive(rs.getBoolean("active"));

		Timestamp createdAt = rs.getTimestamp("created_at");
		if (createdAt != null)
			product.setCreatedAt(createdAt.toLocalDateTime());

		Timestamp updatedAt = rs.getTimestamp("updated_at");
		if (updatedAt != null)
			product.setUpdatedAt(updatedAt.toLocalDateTime());

		return product;
	}

	private void validateProduct(Product product) {
		if (product == null)
			throw new IllegalArgumentException("Produto não pode ser nulo");
		if (product.getName() == null || product.getName().trim().isEmpty())
			throw new IllegalArgumentException("Nome do produto é obrigatório");
		if (product.getDescription() == null || product.getDescription().trim().isEmpty())
			throw new IllegalArgumentException("Descrição do produto é obrigatória");
		if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0)
			throw new IllegalArgumentException("Preço deve ser maior que zero");
		if (product.getCategory() == null || product.getCategory().trim().isEmpty())
			throw new IllegalArgumentException("Categoria é obrigatória");

		List<String> categorias = Arrays.asList("lanches", "bebidas", "acompanhamentos", "sobremesas");
		if (!categorias.contains(product.getCategory())) {
			throw new IllegalArgumentException("Categoria inválida");
		}
	}
}
