// Validaciones para formularios y negocio
export const Validator = {
    // Quita espacios en blanco alrededor
    limpiar(str) {
        return typeof str === 'string' ? str.trim() : '';
    },

    // Comprueba que no esté vacío
    requerido(str) {
        return this.limpiar(str).length > 0;
    },

    // Correo estándar con arroba
    emailValido(email) {
        if (!email) return false;
        const texto = this.limpiar(email);
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto) || (texto.includes('@') && texto.length >= 5);
    },

    // Password barbero entre 4 y 5 caracteres
    passwordCorta(pass) {
        const texto = this.limpiar(pass);
        return texto.length >= 4 && texto.length <= 5;
    },

    // Teléfono chileno: 8 dígitos exactos tras el +56 9
    telefonoChile(tel) {
        return /^\d{8}$/.test(this.limpiar(tel));
    }
};

if (typeof window !== 'undefined') {
    window.Validator = Validator;
}