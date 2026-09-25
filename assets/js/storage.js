import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Conexión a Firestore con respaldo local en localStorage
export const StorageManager = {
    // Lectura de citas en tiempo real
    suscribirCitas(callback) {
        try {
            return onSnapshot(collection(db, "citas"), (snapshot) => {
                const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                localStorage.setItem('local_citas', JSON.stringify(citas));
                callback(citas);
            }, () => {
                const local = JSON.parse(localStorage.getItem('local_citas') || '[]');
                callback(local);
            });
        } catch {
            const local = JSON.parse(localStorage.getItem('local_citas') || '[]');
            callback(local);
        }
    },

    // Lectura de horas y días bloqueados
    suscribirBloqueos(callback) {
        try {
            return onSnapshot(collection(db, "bloqueos"), (snapshot) => {
                const bloqueos = {};
                snapshot.docs.forEach(d => { bloqueos[d.id] = d.data(); });
                localStorage.setItem('local_bloqueos', JSON.stringify(bloqueos));
                callback(bloqueos);
            }, () => {
                const local = JSON.parse(localStorage.getItem('local_bloqueos') || '{}');
                callback(local);
            });
        } catch {
            const local = JSON.parse(localStorage.getItem('local_bloqueos') || '{}');
            callback(local);
        }
    },

    // Lectura de opiniones
    suscribirResenas(callback) {
        try {
            return onSnapshot(collection(db, "resenas"), (snapshot) => {
                const resenas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                localStorage.setItem('local_resenas', JSON.stringify(resenas));
                callback(resenas);
            }, () => {
                const local = JSON.parse(localStorage.getItem('local_resenas') || '[]');
                callback(local);
            });
        } catch {
            const local = JSON.parse(localStorage.getItem('local_resenas') || '[]');
            callback(local);
        }
    },

    async saveCita(cita) {
        try {
            await addDoc(collection(db, "citas"), cita);
            return true;
        } catch {
            const citas = JSON.parse(localStorage.getItem('local_citas') || '[]');
            citas.push({ id: 'loc_' + Date.now(), ...cita });
            localStorage.setItem('local_citas', JSON.stringify(citas));
            return true;
        }
    },

    async saveBloqueoFecha(fecha, config) {
        const local = JSON.parse(localStorage.getItem('local_bloqueos') || '{}');
        local[fecha] = config;
        localStorage.setItem('local_bloqueos', JSON.stringify(local));

        try {
            await setDoc(doc(db, "bloqueos", fecha), config);
            return true;
        } catch {
            return false;
        }
    },

    async deleteCita(id) {
        try {
            await deleteDoc(doc(db, "citas", id));
        } catch {
            const citas = JSON.parse(localStorage.getItem('local_citas') || '[]').filter(c => c.id !== id);
            localStorage.setItem('local_citas', JSON.stringify(citas));
        }
        return true;
    },

    async saveResena(resena) {
        try {
            await addDoc(collection(db, "resenas"), resena);
            return true;
        } catch {
            const res = JSON.parse(localStorage.getItem('local_resenas') || '[]');
            res.push({ id: 'loc_' + Date.now(), ...resena });
            localStorage.setItem('local_resenas', JSON.stringify(res));
            return true;
        }
    },

    async responderResena(id, respuesta) {
        try {
            await updateDoc(doc(db, "resenas", id), { respuestaBarbero: respuesta });
            return true;
        } catch {
            return false;
        }
    }
};