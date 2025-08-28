package com.sistema.pedidos.service;

import com.sistema.pedidos.model.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Serviço de gerenciamento de produtos
 */
public class ProductService {
    
    private final Map<Long, Product> products = new HashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public ProductService() {
        initializeDefaultProducts();
    }

    /**
     * Inicializa produtos padrão do sistema
     */
    private void initializeDefaultProducts() {
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

    /**
     * Método auxiliar para criar produtos iniciais
     */
    private void createProduct(String name, String description, BigDecimal price, String category) {
        Product product = new Product(name, description, price, category);
        product.setId(idGenerator.getAndIncrement());
        products.put(product.getId(), product);
    }

    /**
     * Busca todos os produtos
     */
    public List<Product> findAll() {
        return new ArrayList<>(products.values());
    }

    /**
     * Busca produto por ID
     */
    public Product findById(Long id) {
        return products.get(id);
    }

    /**
     * Busca produtos por categoria
     */
    public List<Product> findByCategory(String category) {
        return products.values().stream()
                .filter(product -> product.getCategory().equals(category))
                .collect(Collectors.toList());
    }

    /**
     * Busca produtos ativos
     */
    public List<Product> findActiveProducts() {
        return products.values().stream()
                .filter(Product::isActive)
                .collect(Collectors.toList());
    }

    /**
     * Busca produtos por nome (busca parcial)
     */
    public List<Product> findByNameContaining(String name) {
        return products.values().stream()
                .filter(product -> product.getName().toLowerCase().contains(name.toLowerCase()))
                .collect(Collectors.toList());
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

        // Gerar ID e salvar
        product.setId(idGenerator.getAndIncrement());
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        
        products.put(product.getId(), product);
        return product;
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

        // Atualizar campos
        if (updatedProduct.getName() != null) {
            existingProduct.setName(updatedProduct.getName());
        }
        if (updatedProduct.getDescription() != null) {
            existingProduct.setDescription(updatedProduct.getDescription());
        }
        if (updatedProduct.getPrice() != null) {
            existingProduct.setPrice(updatedProduct.getPrice());
        }
        if (updatedProduct.getCategory() != null) {
            existingProduct.setCategory(updatedProduct.getCategory());
        }
        
        existingProduct.setActive(updatedProduct.isActive());
        existingProduct.setUpdatedAt(LocalDateTime.now());

        return existingProduct;
    }

    /**
     * Remove um produto
     */
    public boolean delete(Long id) {
        Product product = findById(id);
        if (product == null) {
            return false;
        }

        products.remove(id);
        return true;
    }

    /**
     * Altera status de um produto
     */
    public Product toggleProductStatus(Long id) {
        Product product = findById(id);
        if (product == null) {
            throw new IllegalArgumentException("Produto não encontrado");
        }

        product.setActive(!product.isActive());
        product.setUpdatedAt(LocalDateTime.now());
        
        return product;
    }

    /**
     * Obtém produtos por faixa de preço
     */
    public List<Product> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return products.values().stream()
                .filter(product -> product.getPrice().compareTo(minPrice) >= 0 && 
                                 product.getPrice().compareTo(maxPrice) <= 0)
                .collect(Collectors.toList());
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
        return products.values().stream()
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
        return products.values().stream()
                .filter(product -> {
                    if (name != null && !product.getName().toLowerCase().contains(name.toLowerCase())) {
                        return false;
                    }
                    if (category != null && !product.getCategory().equals(category)) {
                        return false;
                    }
                    if (minPrice != null && product.getPrice().compareTo(minPrice) < 0) {
                        return false;
                    }
                    if (maxPrice != null && product.getPrice().compareTo(maxPrice) > 0) {
                        return false;
                    }
                    if (active != null && product.isActive() != active) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
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

