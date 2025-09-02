package com.sistema.pedidos.enums;

import java.util.Arrays;
import java.util.Optional;

/**
 * Enum com todas as permissões do sistema
 */
public enum Status {

	ATENDIMENTO("atendimento"), PAGAMENTO("pagamento"), PEDIDO_FEITO("feito"), VER_PERFIL("preparo"), PRONTO("pronto"),
	COLETADO("coletado"), FINALIZADO("finalizado");

	private final String key;

	Status(String key) {
		this.key = key;
	}

	public String getName() {
		return key;
	}

	public static Optional<Status> fromName(String text) {
		return Arrays.stream(values()).filter(p -> p.getName().equalsIgnoreCase(text)).findFirst();
	}

	public static boolean containsName(String text) {
		for (Status permission : values()) {
			if (permission.getName().equalsIgnoreCase(text))
				return true;
		}
		return false;
	}

	public static Status getNextStatus(String text) {
		Status[] statuses = values();
		for (int i = 0; i < statuses.length; i++) {
			if (statuses[i].getName().equalsIgnoreCase(text)) {
				int nextIndex = (i + 1) % statuses.length;
				return statuses[nextIndex];
			}
		}
		return null;
	}
}
