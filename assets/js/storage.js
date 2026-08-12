/**
 * Módulo de Almacenamiento Local (Storage)
 */

const STORAGE_KEY_CITAS = 'yunghbarber_citas';
const STORAGE_KEY_RESENAS = 'yunghbarber_resenas';
const STORAGE_KEY_BLOQUEOS = 'yunghbarber_bloqueos';

const StorageManager = {
    // --- CITAS ---
    getCitas() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_CITAS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al leer citas:', error);
            return [];
        }
    },

    saveCita(cita) {
        try {
            const citas = this.getCitas();
            if (!cita.id) cita.id = 'cita_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            if (!cita.estado) cita.estado = 'Pendiente';
            citas.push(cita);
            localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citas));
            return true;
        } catch (error) {
            console.error('Error al guardar cita:', error);
            return false;
        }
    },

    updateCita(id, nuevosDatos) {
        try {
            const citas = this.getCitas();
            const index = citas.findIndex(c => c.id === id);
            if (index !== -1) {
                citas[index] = { ...citas[index], ...nuevosDatos };
                localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citas));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar cita:', error);
            return false;
        }
    },

    deleteCita(id) {
        try {
            let citas = this.getCitas();
            citas = citas.filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citas));
            return true;
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            return false;
        }
    },

    // --- RESEÑAS ---
    getResenas() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_RESENAS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error al leer reseñas:', error);
            return [];
        }
    },

    saveResena(resena) {
        try {
            const resenas = this.getResenas();
            if (!resena.id) resena.id = 'resena_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            resenas.unshift(resena);
            localStorage.setItem(STORAGE_KEY_RESENAS, JSON.stringify(resenas));
            return true;
        } catch (error) {
            console.error('Error al guardar reseña:', error);
            return false;
        }
    },

    updateResenaRespuesta(id, respuestaTexto) {
        try {
            const resenas = this.getResenas();
            const index = resenas.findIndex(r => r.id === id);
            if (index !== -1) {
                resenas[index].respuestaBarbero = respuestaTexto;
                localStorage.setItem(STORAGE_KEY_RESENAS, JSON.stringify(resenas));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al actualizar respuesta:', error);
            return false;
        }
    },

    deleteResena(id) {
        try {
            let resenas = this.getResenas();
            resenas = resenas.filter(r => r.id !== id);
            localStorage.setItem(STORAGE_KEY_RESENAS, JSON.stringify(resenas));
            return true;
        } catch (error) {
            console.error('Error al eliminar reseña:', error);
            return false;
        }
    },

    // --- BLOQUEOS Y DISPONIBILIDAD ---
    getBloqueos() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_BLOQUEOS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error al leer bloqueos:', error);
            return {};
        }
    },

    getBloqueoFecha(fecha) {
        const bloqueos = this.getBloqueos();
        return bloqueos[fecha] || { diaBloqueado: false, horasDesactivadas: [] };
    },

    saveBloqueoFecha(fecha, configuracion) {
        try {
            const bloqueos = this.getBloqueos();
            bloqueos[fecha] = configuracion;
            localStorage.setItem(STORAGE_KEY_BLOQUEOS, JSON.stringify(bloqueos));
            return true;
        } catch (error) {
            console.error('Error al guardar bloqueo:', error);
            return false;
        }
    }
};