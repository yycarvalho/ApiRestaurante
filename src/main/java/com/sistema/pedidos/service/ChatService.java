package com.sistema.pedidos.service ;

import java.time.LocalDateTime ;
import java.util.ArrayList ;
import java.util.HashMap ;
import java.util.HashSet ;
import java.util.List ;
import java.util.Map ;
import java.util.Set ;
import java.util.concurrent.ConcurrentHashMap ;
import java.util.logging.Level ;
import java.util.logging.Logger ;

import com.sistema.pedidos.model.Order.ChatMessage ;

/**
 * Serviço de chat para gerenciar mensagens em tempo real
 */
public class ChatService {

	private static final Logger LOGGER = Logger
			.getLogger (
					ChatService.class
							.getName ( ) ) ;

	// Armazenamento em memória para mensagens de chat (em produção, usar
	// banco de dados)
	private static final Map < String , List < ChatMessage > > chatHistory = new ConcurrentHashMap <> ( ) ;

	// Usuários online (em produção, usar WebSocket ou similar)
	private static final Set < String > onlineUsers = ConcurrentHashMap
			.newKeySet ( ) ;

	// Notificações pendentes
	private static final Map < String , List < String > > pendingNotifications = new ConcurrentHashMap <> ( ) ;

	/**
	 * Adiciona mensagem ao chat de um pedido
	 */
	public
			ChatMessage
			addMessage (
					String orderId ,
					String message ,
					String sender ,
					String senderName ) {
		try {
			ChatMessage chatMessage = new ChatMessage (
					message ,
					sender ,
					LocalDateTime
							.now ( ) ) ;
			chatMessage
					.setSender (
							senderName ) ;

			// Adicionar à história do chat
			chatHistory
					.computeIfAbsent (
							orderId ,
							k -> new ArrayList <> ( ) )
					.add (
							chatMessage ) ;

			// Notificar usuários online sobre nova mensagem
			notifyNewMessage (
					orderId ,
					chatMessage ) ;

			LOGGER
					.info (
							"Mensagem adicionada ao pedido " + orderId + " por "
									+ senderName ) ;

			return chatMessage ;

		} catch ( Exception e ) {
			LOGGER
					.log (
							Level.SEVERE ,
							"Erro ao adicionar mensagem ao chat" ,
							e ) ;
			throw new RuntimeException (
					"Erro ao adicionar mensagem" ,
					e ) ;
		}
	}

	/**
	 * Obtém histórico de chat de um pedido
	 */
	public
			List < ChatMessage >
			getChatHistory (
					String orderId ) {
		return chatHistory
				.getOrDefault (
						orderId ,
						new ArrayList <> ( ) ) ;
	}

	/**
	 * Obtém mensagens recentes de um pedido
	 */
	public
			List < ChatMessage >
			getRecentMessages (
					String orderId ,
					int limit ) {
		List < ChatMessage > messages = chatHistory
				.getOrDefault (
						orderId ,
						new ArrayList <> ( ) ) ;
		if ( messages
				.size ( ) <= limit ) {
			return new ArrayList <> (
					messages ) ;
		}
		return messages
				.subList (
						messages
								.size ( ) - limit ,
						messages
								.size ( ) ) ;
	}

	/**
	 * Marca usuário como online
	 */
	public
			void
			setUserOnline (
					String userId ) {
		onlineUsers
				.add (
						userId ) ;
		LOGGER
				.info (
						"Usuário " + userId + " está online" ) ;
	}

	/**
	 * Marca usuário como offline
	 */
	public
			void
			setUserOffline (
					String userId ) {
		onlineUsers
				.remove (
						userId ) ;
		LOGGER
				.info (
						"Usuário " + userId + " está offline" ) ;
	}

	/**
	 * Verifica se usuário está online
	 */
	public
			boolean
			isUserOnline (
					String userId ) {
		return onlineUsers
				.contains (
						userId ) ;
	}

	/**
	 * Obtém lista de usuários online
	 */
	public
			Set < String >
			getOnlineUsers ( ) {
		return new HashSet <> (
				onlineUsers ) ;
	}

	/**
	 * Notifica sobre nova mensagem
	 */
	private
			void
			notifyNewMessage (
					String orderId ,
					ChatMessage message ) {
		// Em produção, implementar notificação via WebSocket ou similar
		LOGGER
				.info (
						"Nova mensagem no pedido " + orderId + ": " + message
								.getMessage ( ) ) ;

		// Adicionar à lista de notificações pendentes
		pendingNotifications
				.computeIfAbsent (
						orderId ,
						k -> new ArrayList <> ( ) )
				.add (
						"Nova mensagem de " + message
								.getSender ( ) ) ;
	}

	/**
	 * Obtém notificações pendentes para um pedido
	 */
	public
			List < String >
			getPendingNotifications (
					String orderId ) {
		List < String > notifications = pendingNotifications
				.getOrDefault (
						orderId ,
						new ArrayList <> ( ) ) ;
		pendingNotifications
				.remove (
						orderId ) ; // Limpar após leitura
		return notifications ;
	}

	/**
	 * Obtém estatísticas do chat
	 */
	public
			Map < String , Object >
			getChatStats ( ) {
		Map < String , Object > stats = new HashMap <> ( ) ;

		int totalMessages = chatHistory
				.values ( )
				.stream ( )
				.mapToInt (
						List::size )
				.sum ( ) ;

		int totalOrders = chatHistory
				.size ( ) ;
		int onlineUsersCount = onlineUsers
				.size ( ) ;

		stats
				.put (
						"totalMessages" ,
						totalMessages ) ;
		stats
				.put (
						"totalOrders" ,
						totalOrders ) ;
		stats
				.put (
						"onlineUsers" ,
						onlineUsersCount ) ;
		stats
				.put (
						"averageMessagesPerOrder" ,
						totalOrders > 0
								? ( double ) totalMessages / totalOrders
								: 0 ) ;

		return stats ;
	}

	/**
	 * Limpa histórico de chat antigo (em produção, implementar limpeza
	 * automática)
	 */
	public
			void
			cleanupOldChats (
					int daysToKeep ) {
		LocalDateTime cutoffDate = LocalDateTime
				.now ( )
				.minusDays (
						daysToKeep ) ;

		chatHistory
				.entrySet ( )
				.removeIf (
						entry -> {
							List < ChatMessage > messages = entry
									.getValue ( ) ;
							if ( messages
									.isEmpty ( ) )
								return true ;

							// Verificar se a última mensagem é mais antiga
							// que o limite
							ChatMessage lastMessage = messages
									.get (
											messages
													.size ( ) - 1 ) ;
							return lastMessage
									.getTime ( )
									.isBefore (
											cutoffDate ) ;
						} ) ;

		LOGGER
				.info (
						"Limpeza de chats antigos concluída" ) ;
	}

	/**
	 * Exporta chat de um pedido para análise
	 */
	public
			String
			exportChat (
					String orderId ) {
		List < ChatMessage > messages = getChatHistory (
				orderId ) ;
		if ( messages
				.isEmpty ( ) ) {
			return "Nenhuma mensagem encontrada para o pedido " + orderId ;
		}

		StringBuilder export = new StringBuilder ( ) ;
		export
				.append (
						"=== Chat do Pedido " )
				.append (
						orderId )
				.append (
						" ===\n" ) ;
		export
				.append (
						"Data: " )
				.append (
						LocalDateTime
								.now ( ) )
				.append (
						"\n\n" ) ;

		for ( ChatMessage message : messages ) {
			export
					.append (
							"[" )
					.append (
							message
									.getTime ( ) )
					.append (
							"] " ) ;
			export
					.append (
							message
									.getSender ( ) )
					.append (
							": " ) ;
			export
					.append (
							message
									.getMessage ( ) )
					.append (
							"\n" ) ;
		}

		return export
				.toString ( ) ;
	}

	/**
	 * Busca mensagens por texto
	 */
	public
			List < ChatMessage >
			searchMessages (
					String query ) {
		List < ChatMessage > results = new ArrayList <> ( ) ;

		for ( List < ChatMessage > messages : chatHistory
				.values ( ) ) {
			for ( ChatMessage message : messages ) {
				if ( message
						.getMessage ( )
						.toLowerCase ( )
						.contains (
								query
										.toLowerCase ( ) ) ) {
					results
							.add (
									message ) ;
				}
			}
		}

		// Ordenar por data mais recente
		results
				.sort (
						(
								m1 ,
								m2 ) -> m2
										.getTime ( )
										.compareTo (
												m1
														.getTime ( ) ) ) ;

		return results ;
	}

	/**
	 * Obtém pedidos com atividade recente no chat
	 */
	public
			List < String >
			getActiveChatOrders (
					int minutesThreshold ) {
		LocalDateTime threshold = LocalDateTime
				.now ( )
				.minusMinutes (
						minutesThreshold ) ;
		List < String > activeOrders = new ArrayList <> ( ) ;

		for ( Map.Entry < String , List < ChatMessage > > entry : chatHistory
				.entrySet ( ) ) {
			List < ChatMessage > messages = entry
					.getValue ( ) ;
			if ( ! messages
					.isEmpty ( ) ) {
				ChatMessage lastMessage = messages
						.get (
								messages
										.size ( ) - 1 ) ;
				if ( lastMessage
						.getTime ( )
						.isAfter (
								threshold ) ) {
					activeOrders
							.add (
									entry
											.getKey ( ) ) ;
				}
			}
		}

		return activeOrders ;
	}
}