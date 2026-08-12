/**
 * Módulo de Validación de Datos y Reglas de Negocio
 */

const Validator = {
    /**
     * Limpia y sanitiza una cadena de texto
     * @param {string} str 
     * @returns {string}
     */
    trimInput(str) {
        return typeof str === 'string' ? str.trim() : '';
    },

    /**
     * Valida que una fecha u hora no sea pasada en comparación a la fecha actual
     * @param {string} fechaStr Formato YYYY-MM-DD
     * @param {string} horaStr Formato HH:MM
     * @returns {Object} { isValid: boolean, message: string }
     */
    validarFechaHoraFutura(fechaStr, horaStr) {
        if (!fechaStr || !horaStr) {
            return { isValid: false, message: 'Debe seleccionar una fecha y hora válidas.' };
        }

        const fechaCita = new Date(`${fechaStr}T${horaStr}`);
        const ahora = new Date();

        if (isNaN(fechaCita.getTime())) {
            return { isValid: false, message: 'El formato de fecha u hora es inválido.' };
        }

        if (fechaCita < ahora) {
            return { isValid: false, message: 'No puedes agendar una cita en una fecha u hora pasada.' };
        }

        return { isValid: true, message: '' };
    },

    /**
     * Verifica si existe una colisión de horario (Double Booking)
     * @param {string} servicioBarbero Opcional si se valida por barbero específico
     * @param {string} fecha YYYY-MM-DD
     * @param {string} hora HH:MM
     * @param {Array} citasExistentes Array de citas actuales en Storage
     * @returns {boolean} true si hay conflicto
     */
    existeConflictoHorario(barbero, fecha, hora, citasExistentes) {
        return citasExistentes.some(cita => {
            // Ignorar citas canceladas
            if (cita.estado === 'Cancelada') return false;
            
            const mismoBarbero = barbero ? cita.barbero === barbero : true;
            return mismoBarbero && cita.fecha === fecha && cita.hora === hora;
        });
    },

    /**
     * Valida la estructura básica de un correo electrónico
     * @param {string} email 
     * @returns {boolean}
     */
    validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * Valida un número de teléfono básico (mínimo 8 dígitos)
     * @param {string} telefono 
     * @returns {boolean}
     */
    validarTelefono(telefono) {
        const re = /^[0-9+ ]{8,15}$/;
        return re.test(telefono);
    }
};