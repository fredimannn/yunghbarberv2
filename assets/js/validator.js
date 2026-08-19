/**
 * Módulo de Validación de Datos y Reglas de Negocio - Yunghbarber
 */

export const Validator = {
    /**
     * Limpia y remueve espacios al inicio y al final
     */
    trimInput(str) {
        return typeof str === 'string' ? str.trim() : '';
    },

    /**
     * Valida que un campo no esté vacío ni contenga solo espacios
     */
    validateRequired(str) {
        if (!str) return false;
        return this.trimInput(str).length > 0;
    },

    /**
     * Validación de correo: debe contener '@' y al menos 3 caracteres
     */
    validarEmailSimple(email) {
        if (!email) return false;
        const clean = this.trimInput(email);
        return clean.includes('@') && clean.length >= 3;
    },

    /**
     * Valida que la contraseña tenga entre 4 y 5 caracteres
     */
    validarPasswordCorta(pass) {
        if (!pass) return false;
        const clean = this.trimInput(pass);
        return clean.length >= 4 && clean.length <= 5;
    },

    /**
     * Valida los 8 dígitos restantes del número chileno (después del +56 9)
     */
    validarTelefonoChileRestante(tel) {
        if (!tel) return false;
        const clean = this.trimInput(tel);
        return /^\d{8}$/.test(clean);
    },

    /**
     * Valida formato de correo estándar
     */
    validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * Valida que una fecha y hora no sean pasadas
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
     * Verifica colisiones de horario
     */
    existeConflictoHorario(barbero, fecha, hora, citasExistentes) {
        return citasExistentes.some(cita => {
            if (cita.estado === 'Cancelada') return false;
            const mismoBarbero = barbero ? cita.barbero === barbero : true;
            return mismoBarbero && cita.fecha === fecha && cita.hora === hora;
        });
    }
};

// Exportación global para pruebas unitarias en consola F12
if (typeof window !== 'undefined') {
    window.Validator = Validator;
}