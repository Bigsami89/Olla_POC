/**
 * ==========================================
 * CONFIGURACIÓN
 * ==========================================
 */

// URL del backend - se ajusta automáticamente al host actual
const API_URL = `${window.location.origin}/api/chat`;

/**
 * ==========================================
 * ELEMENTOS DEL DOM
 * ==========================================
 */

const chatButton = document.getElementById('chat-button');
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

/**
 * ==========================================
 * FUNCIONES DE UI
 * ==========================================
 */

/**
 * Toggle del chat (abrir/cerrar)
 */
function toggleChat() {
    chatContainer.classList.toggle('active');
    chatButton.classList.toggle('active');
    
    if (chatContainer.classList.contains('active')) {
        chatInput.focus();
    }
}

/**
 * Agregar un mensaje al chat
 * @param {string} content - Contenido del mensaje
 * @param {boolean} isUser - Si es un mensaje del usuario o del bot
 */
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.insertBefore(messageDiv, typingIndicator);
    
    // Scroll al final con animación suave
    scrollToBottom();
}

/**
 * Scroll automático al final del chat
 */
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Mostrar u ocultar el indicador de escritura
 * @param {boolean} show - Mostrar o ocultar
 */
function toggleTyping(show) {
    if (show) {
        typingIndicator.classList.add('active');
    } else {
        typingIndicator.classList.remove('active');
    }
    scrollToBottom();
}

/**
 * Habilitar o deshabilitar los controles de input
 * @param {boolean} enabled - Estado de los controles
 */
function setInputEnabled(enabled) {
    chatInput.disabled = !enabled;
    sendButton.disabled = !enabled;
    
    if (enabled) {
        chatInput.focus();
    }
}

/**
 * ==========================================
 * FUNCIONES DE COMUNICACIÓN CON EL BACKEND
 * ==========================================
 */

/**
 * Enviar mensaje al backend y recibir respuesta
 */
async function sendMessage() {
    const pregunta = chatInput.value.trim();
    
    // Validar que haya contenido
    if (!pregunta) {
        return;
    }

    // Agregar mensaje del usuario al chat
    addMessage(pregunta, true);
    
    // Limpiar input
    chatInput.value = '';
    
    // Deshabilitar controles mientras se procesa
    setInputEnabled(false);
    toggleTyping(true);

    try {
        // Realizar petición al backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pregunta }),
        });

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error del servidor: ${response.status}`);
        }

        // Obtener datos de respuesta
        const data = await response.json();
        
        // Simular un pequeño delay para mejor UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ocultar indicador de escritura y mostrar respuesta
        toggleTyping(false);
        
        const respuesta = data.respuesta || 'Lo siento, no pude obtener una respuesta.';
        addMessage(respuesta);

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        toggleTyping(false);
        
        // Mensajes de error específicos
        let errorMessage = 'Lo siento, hubo un error al procesar tu pregunta.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '❌ No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
        } else if (error.message.includes('503')) {
            errorMessage = '⏳ El sistema aún está cargando los documentos. Intenta de nuevo en unos momentos.';
        } else if (error.message) {
            errorMessage = `❌ ${error.message}`;
        }
        
        addMessage(errorMessage);
    } finally {
        // Habilitar controles nuevamente
        setInputEnabled(true);
    }
}

/**
 * ==========================================
 * EVENT LISTENERS
 * ==========================================
 */

// Toggle del chat al hacer clic en el botón
chatButton.addEventListener('click', toggleChat);

// Enviar mensaje al hacer clic en el botón de enviar
sendButton.addEventListener('click', sendMessage);

// Enviar mensaje al presionar Enter
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Cerrar el chat al presionar Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatContainer.classList.contains('active')) {
        toggleChat();
    }
});

/**
 * ==========================================
 * INICIALIZACIÓN
 * ==========================================
 */

// Asegurar que los controles estén habilitados al cargar
window.addEventListener('load', () => {
    setInputEnabled(true);
    console.log('🤖 Chatbot RAG inicializado');
    console.log(`📡 Conectado a: ${API_URL}`);
});

/**
 * ==========================================
 * FUNCIONES DE UTILIDAD
 * ==========================================
 */

/**
 * Verificar conexión con el backend
 */
async function checkBackendConnection() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pregunta: 'test' }),
        });
        
        if (response.ok) {
            console.log('✅ Conexión con backend exitosa');
            return true;
        } else {
            console.warn('⚠️ Backend respondió con error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ No se pudo conectar con el backend:', error);
        return false;
    }
}

// Verificar conexión al cargar (opcional)
// Descomenta la siguiente línea si quieres verificar la conexión automáticamente
// window.addEventListener('load', checkBackendConnection);