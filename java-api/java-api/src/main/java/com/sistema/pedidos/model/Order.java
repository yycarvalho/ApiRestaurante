package com.sistema.pedidos.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Modelo de dados para Pedido
 */
public class Order {
    private String id;
    private String customer;
    private String phone;
    private String address;
    private String type; // delivery, pickup
    private String status; // atendimento, pagamento, feito, preparo, pronto, coletado, finalizado
    private List<OrderItem> items;
    private BigDecimal total;
    private List<ChatMessage> chat;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Construtores
    public Order() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "atendimento";
    }

    public Order(String customer, String phone, String type) {
        this();
        this.customer = customer;
        this.phone = phone;
        this.type = type;
    }

    // Getters e Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCustomer() {
        return customer;
    }

    public void setCustomer(String customer) {
        this.customer = customer;
        this.updatedAt = LocalDateTime.now();
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
        this.updatedAt = LocalDateTime.now();
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
        this.updatedAt = LocalDateTime.now();
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
        this.updatedAt = LocalDateTime.now();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
        this.calculateTotal();
        this.updatedAt = LocalDateTime.now();
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public List<ChatMessage> getChat() {
        return chat;
    }

    public void setChat(List<ChatMessage> chat) {
        this.chat = chat;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Métodos utilitários
    public void calculateTotal() {
        if (items != null) {
            this.total = items.stream()
                    .map(item -> {
                        BigDecimal itemPrice = item.getPrice();
                        if (itemPrice == null) {
                            return BigDecimal.ZERO;
                        }
                        return itemPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            this.total = BigDecimal.ZERO;
        }
    }

    public void addChatMessage(String message, String sender) {
        if (chat != null) {
            chat.add(new ChatMessage(message, sender, LocalDateTime.now()));
        }
    }

    @Override
    public String toString() {
        return "Order{" +
                "id='" + id + '\'' +
                ", customer='" + customer + '\'' +
                ", status='" + status + '\'' +
                ", total=" + total +
                ", createdAt=" + createdAt +
                '}';
    }

    // Classe interna para itens do pedido
    public static class OrderItem {
        private Long productId;
        private String productName;
        private int quantity;
        private BigDecimal price;

        public OrderItem() {}

        public OrderItem(Long productId, String productName, int quantity, BigDecimal price) {
            this.productId = productId;
            this.productName = productName;
            this.quantity = quantity;
            this.price = price;
        }

        // Getters e Setters
        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public String getProductName() {
            return productName;
        }

        public void setProductName(String productName) {
            this.productName = productName;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        @Override
        public String toString() {
            return "OrderItem{" +
                    "productId=" + productId +
                    ", quantity=" + quantity +
                    ", price=" + price +
                    '}';
        }
    }

    // Classe interna para mensagens do chat
    public static class ChatMessage {
        private String message;
        private String sender;
        private LocalDateTime time;

        public ChatMessage() {}

        public ChatMessage(String message, String sender, LocalDateTime time) {
            this.message = message;
            this.sender = sender;
            this.time = time;
        }

        // Getters e Setters
        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public LocalDateTime getTime() {
            return time;
        }

        public void setTime(LocalDateTime time) {
            this.time = time;
        }

        @Override
        public String toString() {
            return "ChatMessage{" +
                    "message='" + message + '\'' +
                    ", sender='" + sender + '\'' +
                    ", time=" + time +
                    '}';
        }
    }
}
