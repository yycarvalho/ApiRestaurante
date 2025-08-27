package com.sistema.pedidos.service;

import com.sistema.pedidos.model.Product;
import com.sistema.pedidos.util.Db;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Serviço de gerenciamento de produtos
 */
public class ProductService {
    
    public ProductService() {
        initializeDefaultProducts();
    }

    /**
     * Inicializa produtos padrão do sistema
     */
    private void initializeDefaultProducts() {
        // Verificar se já existem produtos
        if (findAll().isEmpty()) {
            // Lanches
            createProduct("X-Burger Clássico", "Hambúrguer, queijo, alface, tomate e molho especial", 
                         new BigDecimal("15.90"), "lanches");
            createProduct("X-Bacon", "Hambúrguer, bacon, queijo, alface, tomate e molho especial", 
                         new BigDecimal("18.90"), "lanches");
            createProduct("X-Tudo", "Hambúrguer duplo, bacon, queijo, ovo, alface, tomate e molho especial", 
                         new BigDecimal("22.90"), "lanches");
            createProduct("X-Frango", "Filé de frango grelhado, queijo, alface, tomate e maionese", 
                         new BigDecimal("16.90"), "lanches");

            // Bebidas
            createProduct("Coca-Cola 350ml", "Refrigerante Coca-Cola lata 350ml", 
                         new BigDecimal("4.50"), "bebidas");
            createProduct("Guaraná Antarctica 350ml", "Refrigerante Guaraná Antarctica lata 350ml", 
                         new BigDecimal("4.50"), "bebidas");
            createProduct("Suco de Laranja 300ml", "Suco natural de laranja 300ml", 
                         new BigDecimal("6.00"), "bebidas");
            createProduct("Água Mineral 500ml", "Água mineral sem gás 500ml", 
                         new BigDecimal("3.00"), "bebidas");

            // Acompanhamentos
            createProduct("Batata Frita", "Porção de batata frita crocante", 
                         new BigDecimal("8.90"), "acompanhamentos");
            createProduct("Onion Rings", "Anéis de cebola empanados e fritos", 
                         new BigDecimal("9.90"), "acompanhamentos");
            createProduct("Nuggets (10 unidades)", "Nuggets de frango empanados", 
                         new BigDecimal("12.90"), "acompanhamentos");

            // Sobremesas
            createProduct("Milkshake de Chocolate", "Milkshake cremoso sabor chocolate", 
                         new BigDecimal("8.90"), "sobremesas");
            createProduct("Milkshake de Morango", "Milkshake cremoso sabor morango", 
                         new BigDecimal("8.90"), "sobremesas");
            createProduct("Sorvete 2 Bolas", "Sorvete de baunilha e chocolate", 
                         new BigDecimal("7.50"), "sobremesas");
        }
    }

    /**
     * Método auxiliar para criar produtos iniciais
     */
    private void createProduct(String name, String description, BigDecimal price, String category) {
        Product product = new Product(name, description, price, category);
        create(product);
    }

    /**
     * Busca todos os produtos
     */
    public List<Product> findAll() {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT id, name, description, price, category, active, created_at, updated_at " +
                     "FROM products ORDER BY name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                products.add(map(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produtos", e);
        }
        return products;
    }

    /**
     * Busca produto por ID
     */
    public Product findById(Long id) {
        String sql = "SELECT id, name, description, price, category, active, created_at, updated_at " +
                     "FROM products WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produto por ID", e);
        }
        return null;
    }

    /**
     * Busca produtos por categoria
     */
    public List<Product> findByCategory(String category) {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT id, name, description, price, category, active, created_at, updated_at " +
                     "FROM products WHERE category = ? ORDER BY name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setString(1, category);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    products.add(map(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produtos por categoria", e);
        }
        return products;
    }

    /**
     * Busca produtos ativos
     */
    public List<Product> findActiveProducts() {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT id, name, description, price, category, active, created_at, updated_at " +
                     "FROM products WHERE active = true ORDER BY name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            
            while (rs.next()) {
                products.add(map(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produtos ativos", e);
        }
        return products;
    }

    /**
     * Busca produtos por nome (busca parcial)
     */
    public List<Product> findByNameContaining(String name) {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT id, name, description, price, category, active, created_at, updated_at " +
                     "FROM products WHERE LOWER(name) LIKE LOWER(?) ORDER BY name";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setString(1, "%" + name + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    products.add(map(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produtos por nome", e);
        }
        return products;
    }

    /**
     * Cria um novo produto
     */
    public Product create(Product product) {
        // Validar dados
        validateProduct(product);

        // Verificar se nome já existe
        if (findByNameContaining(product.getName()).stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(product.getName()))) {
            throw new IllegalArgumentException("Já existe um produto com este nome");
        }

        String sql = "INSERT INTO products (name, description, price, category, active, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            ps.setString(1, product.getName());
            ps.setString(2, product.getDescription());
            ps.setBigDecimal(3, product.getPrice());
            ps.setString(4, product.getCategory());
            ps.setBoolean(5, product.isActive());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            ps.setTimestamp(7, Timestamp.valueOf(LocalDateTime.now()));
            
            ps.executeUpdate();
            
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    product.setId(rs.getLong(1));
                }
            }
            
            return product;
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao criar produto", e);
        }
    }

    /**
     * Atualiza um produto existente
     */
    public Product update(Long id, Product updatedProduct) {
        Product existingProduct = findById(id);
        if (existingProduct == null) {
            throw new IllegalArgumentException("Produto não encontrado");
        }

        // Verificar se novo nome já existe (se foi alterado)
        if (!existingProduct.getName().equalsIgnoreCase(updatedProduct.getName())) {
            if (findByNameContaining(updatedProduct.getName()).stream()
                    .anyMatch(p -> p.getName().equalsIgnoreCase(updatedProduct.getName()) && !p.getId().equals(id))) {
                throw new IllegalArgumentException("Já existe um produto com este nome");
            }
        }

        String sql = "UPDATE products SET name = ?, description = ?, price = ?, category = ?, active = ?, updated_at = ? " +
                     "WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setString(1, updatedProduct.getName());
            ps.setString(2, updatedProduct.getDescription());
            ps.setBigDecimal(3, updatedProduct.getPrice());
            ps.setString(4, updatedProduct.getCategory());
            ps.setBoolean(5, updatedProduct.isActive());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(7, id);
            
            ps.executeUpdate();
            
            return findById(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar produto", e);
        }
    }

    /**
     * Remove um produto
     */
    public boolean delete(Long id) {
        Product product = findById(id);
        if (product == null) {
            return false;
        }

        String sql = "DELETE FROM products WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir produto", e);
        }
    }

    /**
     * Altera status de um produto
     */
    public Product toggleProductStatus(Long id) {
        Product product = findById(id);
        if (product == null) {
            throw new IllegalArgumentException("Produto não encontrado");
        }

        String sql = "UPDATE products SET active = ?, updated_at = ? WHERE id = ?";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setBoolean(1, !product.isActive());
            ps.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
            ps.setLong(3, id);
            
            ps.executeUpdate();
            
            return findById(id);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao alterar status do produto", e);
        }
    }

    /**
     * Obtém produtos por faixa de preço
     */
    public List<Product> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT id, name, description, price, category, active, created_at, updated_at " +
                     "FROM products WHERE price >= ? AND price <= ? ORDER BY price";
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql)) {
            
            ps.setBigDecimal(1, minPrice);
            ps.setBigDecimal(2, maxPrice);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    products.add(map(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produtos por faixa de preço", e);
        }
        return products;
    }

    /**
     * Obtém categorias disponíveis
     */
    public List<String> getAvailableCategories() {
        return Arrays.asList("lanches", "bebidas", "acompanhamentos", "sobremesas");
    }

    /**
     * Obtém produtos mais vendidos (simulado)
     */
    public List<Product> getMostSoldProducts(int limit) {
        // Simulação baseada no ID (produtos com ID menor são "mais vendidos")
        return findAll().stream()
                .filter(Product::isActive)
                .sorted((p1, p2) -> p1.getId().compareTo(p2.getId()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Obtém estatísticas dos produtos
     */
    public Map<String, Object> getProductStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<Product> allProducts = findAll();
        long activeProducts = allProducts.stream().filter(Product::isActive).count();
        long inactiveProducts = allProducts.size() - activeProducts;
        
        // Contagem por categoria
        Map<String, Long> productsByCategory = allProducts.stream()
                .collect(Collectors.groupingBy(Product::getCategory, Collectors.counting()));
        
        // Preço médio
        OptionalDouble averagePrice = allProducts.stream()
                .filter(Product::isActive)
                .mapToDouble(product -> product.getPrice().doubleValue())
                .average();
        
        // Produto mais caro e mais barato
        Optional<Product> mostExpensive = allProducts.stream()
                .filter(Product::isActive)
                .max((p1, p2) -> p1.getPrice().compareTo(p2.getPrice()));
        
        Optional<Product> cheapest = allProducts.stream()
                .filter(Product::isActive)
                .min((p1, p2) -> p1.getPrice().compareTo(p2.getPrice()));
        
        stats.put("totalProducts", allProducts.size());
        stats.put("activeProducts", activeProducts);
        stats.put("inactiveProducts", inactiveProducts);
        stats.put("productsByCategory", productsByCategory);
        stats.put("averagePrice", averagePrice.orElse(0.0));
        stats.put("mostExpensiveProduct", mostExpensive.orElse(null));
        stats.put("cheapestProduct", cheapest.orElse(null));
        
        return stats;
    }

    /**
     * Busca produtos com filtros avançados
     */
    public List<Product> findWithFilters(String name, String category, BigDecimal minPrice, 
                                       BigDecimal maxPrice, Boolean active) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT id, name, description, price, category, active, created_at, updated_at ");
        sql.append("FROM products WHERE 1=1");
        
        List<Object> params = new ArrayList<>();
        int paramIndex = 1;
        
        if (name != null && !name.trim().isEmpty()) {
            sql.append(" AND LOWER(name) LIKE LOWER(?)");
            params.add("%" + name + "%");
        }
        
        if (category != null && !category.trim().isEmpty()) {
            sql.append(" AND category = ?");
            params.add(category);
        }
        
        if (minPrice != null) {
            sql.append(" AND price >= ?");
            params.add(minPrice);
        }
        
        if (maxPrice != null) {
            sql.append(" AND price <= ?");
            params.add(maxPrice);
        }
        
        if (active != null) {
            sql.append(" AND active = ?");
            params.add(active);
        }
        
        sql.append(" ORDER BY name");
        
        List<Product> products = new ArrayList<>();
        
        try (Connection c = Db.getConnection(); 
             PreparedStatement ps = c.prepareStatement(sql.toString())) {
            
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    products.add(map(rs));
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar produtos com filtros", e);
        }
        
        return products;
    }

    /**
     * Mapeia ResultSet para Product
     */
    private Product map(ResultSet rs) throws SQLException {
        Product product = new Product();
        product.setId(rs.getLong("id"));
        product.setName(rs.getString("name"));
        product.setDescription(rs.getString("description"));
        product.setPrice(rs.getBigDecimal("price"));
        product.setCategory(rs.getString("category"));
        product.setActive(rs.getBoolean("active"));
        
        // Timestamps
        Timestamp createdAt = rs.getTimestamp("created_at");
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        
        product.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : LocalDateTime.now());
        product.setUpdatedAt(updatedAt != null ? updatedAt.toLocalDateTime() : LocalDateTime.now());
        
        return product;
    }

    /**
     * Valida os dados do produto
     */
    private void validateProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("Produto não pode ser nulo");
        }
        
        if (product.getName() == null || product.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do produto é obrigatório");
        }
        
        if (product.getDescription() == null || product.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Descrição do produto é obrigatória");
        }
        
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Preço deve ser maior que zero");
        }
        
        if (product.getCategory() == null || product.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Categoria é obrigatória");
        }
        
        if (!getAvailableCategories().contains(product.getCategory())) {
            throw new IllegalArgumentException("Categoria inválida");
        }
    }
}

