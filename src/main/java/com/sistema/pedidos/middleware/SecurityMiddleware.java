package com.sistema.pedidos.middleware ;

import java.io.IOException ;
import java.util.concurrent.ConcurrentHashMap ;
import java.util.concurrent.atomic.AtomicInteger ;
import java.util.logging.Level ;
import java.util.logging.Logger ;

import com.sistema.pedidos.config.AppConfig ;
import com.sistema.pedidos.util.JwtUtil ;
import com.sun.net.httpserver.HttpExchange ;
import com.sun.net.httpserver.HttpHandler ;

/**
 * Middleware de segurança para a API Implementa validação de JWT, rate
 * limiting e validação de CORS
 */
public class SecurityMiddleware {

	private static final Logger LOGGER = Logger
			.getLogger (
					SecurityMiddleware.class
							.getName ( ) ) ;

	// Rate limiting por IP
	private static final ConcurrentHashMap < String , AtomicInteger > requestCounts = new ConcurrentHashMap <> ( ) ;
	private static final ConcurrentHashMap < String , Long > lastRequestTime = new ConcurrentHashMap <> ( ) ;
	private static final int MAX_REQUESTS_PER_MINUTE = 100 ;

	/**
	 * Wrapper para handlers que requerem autenticação
	 */
	public static
			HttpHandler
			requireAuth (
					HttpHandler handler ) {
		return new HttpHandler ( ) {
			@ Override
			public
					void
					handle (
							HttpExchange exchange )
							throws IOException {
				try {
					// Validar CORS primeiro
					if ( ! handleCors (
							exchange ) ) {
						return ;
					}

					// Validar JWT
					if ( ! validateJWT (
							exchange ) ) {
						sendUnauthorized (
								exchange ,
								"Token inválido ou expirado" ) ;
						return ;
					}

					// Aplicar rate limiting
					if ( ! checkRateLimit (
							exchange ) ) {
						sendTooManyRequests (
								exchange ) ;
						return ;
					}

					// Executar handler original
					handler
							.handle (
									exchange ) ;

				} catch ( Exception e ) {
					LOGGER
							.log (
									Level.SEVERE ,
									"Erro no middleware de segurança" ,
									e ) ;
					sendInternalServerError (
							exchange ) ;
				}
			}
		} ;
	}

	/**
	 * Wrapper para handlers que não requerem autenticação
	 */
	public static
			HttpHandler
			publicEndpoint (
					HttpHandler handler ) {
		return new HttpHandler ( ) {
			@ Override
			public
					void
					handle (
							HttpExchange exchange )
							throws IOException {
				try {
					// Validar CORS primeiro
					if ( ! handleCors (
							exchange ) ) {
						return ;
					}

					// Aplicar rate limiting
					if ( ! checkRateLimit (
							exchange ) ) {
						sendTooManyRequests (
								exchange ) ;
						return ;
					}

					// Executar handler original
					handler
							.handle (
									exchange ) ;

				} catch ( Exception e ) {
					LOGGER
							.log (
									Level.SEVERE ,
									"Erro no middleware de segurança" ,
									e ) ;
					sendInternalServerError (
							exchange ) ;
				}
			}
		} ;
	}

	/**
	 * Valida e configura CORS
	 */
	private static
			boolean
			handleCors (
					HttpExchange exchange )
					throws IOException {
		String origin = exchange
				.getRequestHeaders ( )
				.getFirst (
						"Origin" ) ;

		// Verificar se a origem é permitida
		boolean isAllowedOrigin = false ;
		for ( String allowedOrigin : AppConfig.ALLOWED_ORIGINS ) {
			if ( allowedOrigin
					.equals (
							"*" ) || allowedOrigin
									.equals (
											origin ) ) {
				isAllowedOrigin = true ;
				break ;
			}
		}

		// Adicionar headers CORS
		if ( isAllowedOrigin && origin != null ) {
			exchange
					.getResponseHeaders ( )
					.add (
							"Access-Control-Allow-Origin" ,
							origin ) ;
		} else {
			exchange
					.getResponseHeaders ( )
					.add (
							"Access-Control-Allow-Origin" ,
							"*" ) ;
		}

		exchange
				.getResponseHeaders ( )
				.add (
						"Access-Control-Allow-Methods" ,
						"GET, POST, PUT, DELETE, PATCH, OPTIONS" ) ;
		exchange
				.getResponseHeaders ( )
				.add (
						"Access-Control-Allow-Headers" ,
						"Content-Type, Authorization, X-Requested-With" ) ;
		exchange
				.getResponseHeaders ( )
				.add (
						"Access-Control-Max-Age" ,
						"86400" ) ;

		// Responder a requisições OPTIONS (preflight)
		if ( "OPTIONS"
				.equals (
						exchange
								.getRequestMethod ( ) ) ) {
			exchange
					.sendResponseHeaders (
							200 ,
							0 ) ;
			exchange
					.close ( ) ;
			return false ;
		}

		return true ;
	}

	/**
	 * Valida JWT token
	 */
	private static
			boolean
			validateJWT (
					HttpExchange exchange ) {
		String authHeader = exchange
				.getRequestHeaders ( )
				.getFirst (
						"Authorization" ) ;

		if ( authHeader == null || ! authHeader
				.startsWith (
						"Bearer " ) ) {
			return false ;
		}

		String token = authHeader
				.substring (
						7 ) ;

		try {
			// Validar token
			if ( JwtUtil
					.validateToken (
							token ) ) {
				// Adicionar informações do usuário ao exchange para uso
				// posterior
				String userId = JwtUtil
						.getUsernameFromToken (
								token ) ;
				exchange
						.setAttribute (
								"userId" ,
								userId ) ;
				return true ;
			}
		} catch ( Exception e ) {
			LOGGER
					.log (
							Level.WARNING ,
							"Erro ao validar JWT" ,
							e ) ;
		}

		return false ;
	}

	/**
	 * Implementa rate limiting por IP
	 */
	private static
			boolean
			checkRateLimit (
					HttpExchange exchange ) {
		String clientIP = getClientIP (
				exchange ) ;
		long currentTime = System
				.currentTimeMillis ( ) ;

		// Limpar contadores antigos (mais de 1 minuto)
		if ( lastRequestTime
				.containsKey (
						clientIP ) ) {
			long timeDiff = currentTime - lastRequestTime
					.get (
							clientIP ) ;
			if ( timeDiff > 60000 ) { // 1 minuto
				requestCounts
						.remove (
								clientIP ) ;
				lastRequestTime
						.remove (
								clientIP ) ;
			}
		}

		// Incrementar contador de requisições
		AtomicInteger count = requestCounts
				.computeIfAbsent (
						clientIP ,
						k -> new AtomicInteger (
								0 ) ) ;
		int currentCount = count
				.incrementAndGet ( ) ;

		// Atualizar tempo da última requisição
		lastRequestTime
				.put (
						clientIP ,
						currentTime ) ;

		// Verificar limite
		if ( currentCount > MAX_REQUESTS_PER_MINUTE ) {
			LOGGER
					.warning (
							"Rate limit excedido para IP: " + clientIP ) ;
			return false ;
		}

		return true ;
	}

	/**
	 * Obtém IP do cliente
	 */
	private static
			String
			getClientIP (
					HttpExchange exchange ) {
		String forwardedFor = exchange
				.getRequestHeaders ( )
				.getFirst (
						"X-Forwarded-For" ) ;
		if ( forwardedFor != null && ! forwardedFor
				.isEmpty ( ) ) {
			return forwardedFor
					.split (
							"," ) [ 0 ]
									.trim ( ) ;
		}

		String realIP = exchange
				.getRequestHeaders ( )
				.getFirst (
						"X-Real-IP" ) ;
		if ( realIP != null && ! realIP
				.isEmpty ( ) ) {
			return realIP ;
		}

		return exchange
				.getRemoteAddress ( )
				.getAddress ( )
				.getHostAddress ( ) ;
	}

	/**
	 * Resposta de não autorizado
	 */
	private static
			void
			sendUnauthorized (
					HttpExchange exchange ,
					String message )
					throws IOException {
		String response = "{\"error\":\"Unauthorized\",\"message\":\"" + message
				+ "\"}" ;
		exchange
				.getResponseHeaders ( )
				.add (
						"Content-Type" ,
						"application/json" ) ;
		exchange
				.sendResponseHeaders (
						401 ,
						response
								.length ( ) ) ;
		exchange
				.getResponseBody ( )
				.write (
						response
								.getBytes ( ) ) ;
		exchange
				.close ( ) ;
	}

	/**
	 * Resposta de muitas requisições
	 */
	private static
			void
			sendTooManyRequests (
					HttpExchange exchange )
					throws IOException {
		String response = "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded\"}" ;
		exchange
				.getResponseHeaders ( )
				.add (
						"Content-Type" ,
						"application/json" ) ;
		exchange
				.sendResponseHeaders (
						429 ,
						response
								.length ( ) ) ;
		exchange
				.getResponseBody ( )
				.write (
						response
								.getBytes ( ) ) ;
		exchange
				.close ( ) ;
	}

	/**
	 * Resposta de erro interno
	 */
	private static
			void
			sendInternalServerError (
					HttpExchange exchange )
					throws IOException {
		String response = "{\"error\":\"Internal Server Error\",\"message\":\"An unexpected error occurred\"}" ;
		exchange
				.getResponseHeaders ( )
				.add (
						"Content-Type" ,
						"application/json" ) ;
		exchange
				.sendResponseHeaders (
						500 ,
						response
								.length ( ) ) ;
		exchange
				.getResponseBody ( )
				.write (
						response
								.getBytes ( ) ) ;
		exchange
				.close ( ) ;
	}
}