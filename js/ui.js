/**
 * Gerenciador de Interface do Usuário
 * Responsável por componentes visuais, modais, toasts, loading, etc.
 */
class UIManager {
    constructor() {
        this.activeModals = [];
        this.toastContainer = null;
        this.loadingElement = null;
        this.init();
    }

    init() {
        this.toastContainer = document.getElementById('toastContainer');
        this.loadingElement = document.getElementById('loading');
        this.setupGlobalEventListeners();
    }

    // Configurar event listeners globais
    setupGlobalEventListeners() {
        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                this.closeModal();
            }
        });

        // Fechar modais clicando no backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal();
            }
        });
    }

    // Mostrar loading global
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
        }
    }

    // Esconder loading global
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.add('hidden');
        }
    }

    // Mostrar toast notification
    showToast(message, type = 'info', duration = CONFIG.TIMEOUTS.TOAST) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        // Adicionar ao container
        this.toastContainer.appendChild(toast);

        // Remover automaticamente após o tempo especificado
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Permitir remoção manual clicando
        toast.addEventListener('click', () => {
            this.removeToast(toast);
        });

        return toast;
    }

    // Remover toast
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // Criar modal
    createModal(options = {}) {
        const {
            title = 'Modal',
            content = '',
            size = 'md',
            closable = true,
            footer = null,
            onClose = null
        } = options;

        // Criar estrutura do modal
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop';
        modalBackdrop.setAttribute('role', 'dialog');
        modalBackdrop.setAttribute('aria-modal', 'true');
        modalBackdrop.setAttribute('aria-labelledby', 'modal-title');

        const modalContent = document.createElement('div');
        modalContent.className = `modal-content modal-${size}`;

        // Header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('h3');
        modalTitle.id = 'modal-title';
        modalTitle.textContent = title;

        modalHeader.appendChild(modalTitle);

        if (closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.setAttribute('aria-label', 'Fechar modal');
            closeBtn.onclick = () => this.closeModal(modalBackdrop, onClose);
            modalHeader.appendChild(closeBtn);
        }

        // Body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        
        if (typeof content === 'string') {
            modalBody.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            modalBody.appendChild(content);
        }

        // Footer
        let modalFooter = null;
        if (footer) {
            modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            
            if (typeof footer === 'string') {
                modalFooter.innerHTML = footer;
            } else if (footer instanceof HTMLElement) {
                modalFooter.appendChild(footer);
            }
        }

        // Montar modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        if (modalFooter) {
            modalContent.appendChild(modalFooter);
        }

        modalBackdrop.appendChild(modalContent);

        return {
            backdrop: modalBackdrop,
            content: modalContent,
            header: modalHeader,
            body: modalBody,
            footer: modalFooter,
            title: modalTitle
        };
    }

    // Mostrar modal
    showModal(options = {}) {
        const modal = this.createModal(options);
        
        // Adicionar ao DOM
        document.body.appendChild(modal.backdrop);
        
        // Adicionar à lista de modais ativos
        this.activeModals.push(modal);

        // Focar no modal para acessibilidade
        modal.backdrop.focus();

        return modal;
    }

    // Fechar modal
    closeModal(modalElement = null, onClose = null) {
        let modalToClose = modalElement;
        
        if (!modalToClose && this.activeModals.length > 0) {
            modalToClose = this.activeModals[this.activeModals.length - 1].backdrop;
        }

        if (modalToClose) {
            // Remover da lista de modais ativos
            this.activeModals = this.activeModals.filter(modal => modal.backdrop !== modalToClose);
            
            // Remover do DOM
            if (modalToClose.parentNode) {
                modalToClose.parentNode.removeChild(modalToClose);
            }

            // Executar callback de fechamento
            if (onClose && typeof onClose === 'function') {
                onClose();
            }
        }
    }

    // Criar formulário dinâmico
    createForm(fields = [], options = {}) {
        const {
            submitText = 'Salvar',
            cancelText = 'Cancelar',
            onSubmit = null,
            onCancel = null
        } = options;

        const form = document.createElement('form');
        form.className = 'dynamic-form';
        form.noValidate = true;

        // Criar campos
        fields.forEach(field => {
            const formGroup = this.createFormField(field);
            form.appendChild(formGroup);
        });

        // Criar footer com botões
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        if (onCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = cancelText;
            cancelBtn.onclick = onCancel;
            footer.appendChild(cancelBtn);
        }

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.innerHTML = `
            <span class="btn-text">${submitText}</span>
            <span class="btn-loading hidden">
                <i class="fas fa-spinner fa-spin"></i>
                Salvando...
            </span>
        `;
        footer.appendChild(submitBtn);

        // Event listener para submit
        if (onSubmit) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    this.setFormLoading(form, true);
                    await onSubmit(data, form);
                } catch (error) {
                    console.error('Erro no submit do formulário:', error);
                } finally {
                    this.setFormLoading(form, false);
                }
            });
        }

        return { form, footer };
    }

    // Criar campo de formulário
    createFormField(field) {
        const {
            type = 'text',
            name,
            label,
            placeholder = '',
            required = false,
            options = [],
            value = ''
        } = field;

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        // Label
        const labelElement = document.createElement('label');
        labelElement.setAttribute('for', name);
        labelElement.textContent = label;
        if (required) {
            labelElement.innerHTML += ' <span class="text-danger">*</span>';
        }
        formGroup.appendChild(labelElement);

        // Input
        let inputElement;

        if (type === 'select') {
            inputElement = document.createElement('select');
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                if (option.value === value) {
                    optionElement.selected = true;
                }
                inputElement.appendChild(optionElement);
            });
        } else if (type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.value = value;
        } else {
            inputElement = document.createElement('input');
            inputElement.type = type;
            inputElement.value = value;
        }

        inputElement.id = name;
        inputElement.name = name;
        inputElement.placeholder = placeholder;
        inputElement.required = required;

        formGroup.appendChild(inputElement);

        // Mensagem de erro
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.id = `${name}-error`;
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'polite');
        formGroup.appendChild(errorElement);

        return formGroup;
    }

    // Configurar estado de loading do formulário
    setFormLoading(form, isLoading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            if (isLoading) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }
    }

    // Mostrar erro em campo específico
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Limpar erros do formulário
    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    // Criar confirmação
    showConfirmation(message, options = {}) {
        const {
            title = 'Confirmação',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'warning'
        } = options;

        return new Promise((resolve) => {
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="confirmation-content">
                    <div class="confirmation-icon ${type}">
                        <i class="fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-question-circle'}"></i>
                    </div>
                    <p class="confirmation-message">${message}</p>
                </div>
            `;

            const footer = document.createElement('div');
            footer.innerHTML = `
                <button type="button" class="btn btn-secondary" id="cancel-btn">${cancelText}</button>
                <button type="button" class="btn btn-${type}" id="confirm-btn">${confirmText}</button>
            `;

            const modal = this.showModal({
                title,
                content,
                footer,
                size: 'sm',
                closable: false
            });

            // Event listeners
            footer.querySelector('#cancel-btn').onclick = () => {
                this.closeModal(modal.backdrop);
                resolve(false);
            };

            footer.querySelector('#confirm-btn').onclick = () => {
                this.closeModal(modal.backdrop);
                resolve(true);
            };
        });
    }

    // Utilitários para elementos
    show(element) {
        if (element) {
            element.classList.remove('hidden');
        }
    }

    hide(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }

    toggle(element) {
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    // Adicionar classe CSS
    addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    // Remover classe CSS
    removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    // Alternar classe CSS
    toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }
}

// CSS adicional para componentes dinâmicos
const additionalCSS = `
.confirmation-content {
    text-align: center;
    padding: 1rem 0;
}

.confirmation-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.confirmation-icon.warning {
    color: var(--warning);
}

.confirmation-icon.danger {
    color: var(--danger);
}

.confirmation-message {
    font-size: 1.1rem;
    color: var(--text-color);
    margin: 0;
}

.modal-sm .modal-content {
    max-width: 400px;
}

.modal-lg .modal-content {
    max-width: 800px;
}

.modal-xl .modal-content {
    max-width: 1200px;
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

// Adicionar CSS ao documento
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Instância global do gerenciador de UI
window.UI = new UIManager();

