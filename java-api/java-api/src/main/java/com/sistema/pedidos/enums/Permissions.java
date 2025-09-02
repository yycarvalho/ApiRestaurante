package com.sistema.pedidos.enums;

import java.util.Arrays;
import java.util.Optional;

/**
 * Enum com todas as permissões do sistema
 */
public enum Permissions {

	DASHBOARD_VIEWER("verDashboard"), VER_PEDIDOS("verPedidos"), VER_CLIENTES("verClientes"), VER_PERFIL("verPerfis"),
	VER_CARDAPIO("verCardapio"), CRIAR_EDITAR_PRODUTO("criarEditarProduto"), EXCLUIR_PRODUTO("excluirProduto"),
	DESATIVAR_PRODUTO("desativarProduto"), VER_CHAT("verChat"), ENVIAR_CHAT("enviarChat"),
	IMPRIMIR_PEDIDO("imprimirPedido"), ACESSAR_ENDERECO("acessarEndereco"),
	VISUALIZAR_VALOR_PEDIDO("visualizarValorPedido"), ACOMPANHAR_ENTREGAS("acompanharEntregas"),
	GERAR_RELATORIOS("gerarRelatorios"), GERENCIAR_PERFIS("gerenciarPerfis"),
	ALTERAR_STATUS_PEDIDO("alterarStatusPedido"), SELECIONAR_STATUS_ESPECIFICO("selecionarStatusEspecifico"),
	CRIAR_USUARIOS("criarUsuarios"), EDITAR_USUARIOS("editarUsuarios"), EXCLUIR_USUARIOS("excluirUsuarios");

	private final String key;

	Permissions(String key) {
		this.key = key;
	}

	public String getName() {
		return key;
	}

	public static Optional<Permissions> fromName(String text) {
		return Arrays.stream(values()).filter(p -> p.getName().equalsIgnoreCase(text)).findFirst();
	}

	public static boolean containsName(String text) {
		for (Permissions permission : values()) {
			if (permission.getName().equalsIgnoreCase(text))
				return true;
		}
		return false;
	}
}
