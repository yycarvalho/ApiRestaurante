package com.sistema.pedidos.util;

import java.util.Objects;
import java.util.function.Predicate;

/**
 * Utilitários para validação de dados
 */
public final class ValidationUtils {
    
    private ValidationUtils() {
        // Classe utilitária - construtor privado
    }
    
    /**
     * Verifica se uma string não é nula nem vazia
     */
    public static boolean isNotBlank(String str) {
        return str != null && !str.trim().isEmpty();
    }
    
    /**
     * Verifica se uma string é nula ou vazia
     */
    public static boolean isBlank(String str) {
        return !isNotBlank(str);
    }
    
    /**
     * Valida se um objeto não é nulo
     */
    public static <T> T requireNonNull(T obj, String message) {
        return Objects.requireNonNull(obj, message);
    }
    
    /**
     * Valida se uma string não é nula nem vazia
     */
    public static String requireNotBlank(String str, String message) {
        if (isBlank(str)) {
            throw new IllegalArgumentException(message);
        }
        return str;
    }
    
    /**
     * Valida se uma condição é verdadeira
     */
    public static void require(boolean condition, String message) {
        if (!condition) {
            throw new IllegalArgumentException(message);
        }
    }
    
    /**
     * Valida se um valor está dentro de um range
     */
    public static void requireInRange(long value, long min, long max, String message) {
        if (value < min || value > max) {
            throw new IllegalArgumentException(message);
        }
    }
    
    /**
     * Valida usando um predicado customizado
     */
    public static <T> T requireValid(T value, Predicate<T> validator, String message) {
        if (!validator.test(value)) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }
    
    /**
     * Valida se um email tem formato básico válido
     */
    public static boolean isValidEmail(String email) {
        return isNotBlank(email) && 
               email.contains("@") && 
               email.contains(".") &&
               email.indexOf("@") > 0 &&
               email.lastIndexOf(".") > email.indexOf("@");
    }
    
    /**
     * Valida se um telefone tem formato básico válido
     */
    public static boolean isValidPhone(String phone) {
        return isNotBlank(phone) && 
               phone.replaceAll("[^0-9]", "").length() >= 10;
    }
}