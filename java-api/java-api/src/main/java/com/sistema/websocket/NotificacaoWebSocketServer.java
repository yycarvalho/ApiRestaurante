package com.sistema.websocket;

import java.net.InetSocketAddress;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import com.sistema.pedidos.controller.ApiController;
import com.sistema.pedidos.model.User;

public class NotificacaoWebSocketServer extends WebSocketServer {

	private static final Set<WebSocket> clientes = Collections.synchronizedSet(new HashSet<>());

	public NotificacaoWebSocketServer(InetSocketAddress address) {
		super(address);
	}

	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
		// 🔥 Passo 1: Obter o token do handshake
		// O cliente deve enviar o token como um parâmetro na URL, por exemplo:
		// ws://localhost:8081/api/notificacoes?token=seu_token_aqui
		String token = getQueryParam(handshake.getResourceDescriptor(), "token");

		// 🔥 Passo 2: Validar o token
		if (token == null || !validarToken(token)) {
			System.out.println("Tentativa de conexão com token inválido ou ausente. Fechando conexão.");
			conn.close(1008, "Token inválido."); // Código 1008 é para violação de política
			return; // Encerra o método para evitar a adição do cliente
		}
		User user = ApiController.getInstance().getAuthService().getUserFromToken(token);
		user.setWebSocket(conn);
		clientes.add(conn);
		System.out.println("Novo cliente conectado: " + conn.getRemoteSocketAddress() + " (Token válido)");
		conn.send("Bem-vindo ao servidor WebSocket!");
	}

	// --- Métodos de Suporte ---

	/**
	 * Extrai um parâmetro de consulta da URL.
	 * 
	 * @param url       O descritor de recurso do handshake (a URL).
	 * @param paramName O nome do parâmetro a ser extraído.
	 * @return O valor do parâmetro ou null se não for encontrado.
	 */
	private String getQueryParam(String url, String paramName) {
		if (!url.contains("?")) {
			return null;
		}
		String query = url.substring(url.indexOf("?") + 1);
		String[] params = query.split("&");
		for (String param : params) {
			String[] pair = param.split("=");
			if (pair.length > 1 && pair[0].equals(paramName)) {
				return pair[1];
			}
		}
		return null;
	}

	/**
	 * Lógica real de validação do token. Isso pode incluir verificar em um banco de
	 * dados, decodificar um JWT, etc.
	 * 
	 * @param token O token a ser validado.
	 * @return true se o token for válido, false caso contrário.
	 */
	private boolean validarToken(String token) {

		if (!ApiController.getInstance().getAuthService().validateToken(token))
			return false;
		return token != null && !token.isEmpty();
	}

	// O restante do seu código (onClose, onMessage, onError, onStart,
	// enviarNotificacao) permanece o mesmo...
	@Override
	public void onClose(WebSocket conn, int code, String reason, boolean remote) {
		clientes.remove(conn);
		System.out.println("Cliente desconectado: " + conn.getRemoteSocketAddress());
	}

	@Override
	public void onMessage(WebSocket conn, String message) {
		System.out.println("Mensagem recebida: " + message);
		conn.send("Eco: " + message);
	}

	@Override
	public void onError(WebSocket conn, Exception ex) {
		ex.printStackTrace();
	}

	@Override
	public void onStart() {
		System.out.println("Servidor WebSocket iniciado na porta: " + getPort());
	}

	public static void enviarNotificacao(String mensagem) {
		synchronized (clientes) {
			for (WebSocket cliente : clientes) {
				if (cliente.isOpen()) {
					cliente.send(mensagem);
				}
			}
		}
	}
}