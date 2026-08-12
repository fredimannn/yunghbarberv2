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

export const StorageManager = {
    suscribirCitas(callback) {
        try {
            return onSnapshot(collection(db, "citas"), (snapshot) => {
                const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                callback(citas);
            }, (error) => {
                console.warn("Error leyendo citas de Firebase, usando fallback local:", error);
                callback([]);
            });
        } catch (e) {
            callback([]);
        }
    },

    suscribirBloqueos(callback) {
        try {
            return onSnapshot(collection(db, "bloqueos"), (snapshot) => {
                const bloqueos = {};
                snapshot.docs.forEach(d => {
                    bloqueos[d.id] = d.data();
                });
                callback(bloqueos);
            }, (error) => {
                console.warn("Error leyendo bloqueos de Firebase:", error);
                callback({});
            });
        } catch (e) {
            callback({});
        }
    },

    suscribirResenas(callback) {
        try {
            return onSnapshot(collection(db, "resenas"), (snapshot) => {
                const resenas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                callback(resenas);
            }, (error) => {
                callback([]);
            });
        } catch (e) {
            callback([]);
        }
    },

    async saveCita(cita) {
        try {
            await addDoc(collection(db, "citas"), cita);
            return true;
        } catch (e) {
            console.error("Error guardando cita:", e);
            return false;
        }
    },

    async saveBloqueoFecha(fechaFormatted, config) {
        try {
            await setDoc(doc(db, "bloqueos", fechaFormatted), config);
            return true;
        } catch (e) {
            console.error("Error guardando bloqueo:", e);
            return false;
        }
    },

    async deleteCita(id) {
        try {
            await deleteDoc(doc(db, "citas", id));
            return true;
        } catch (e) {
            return false;
        }
    },

    async saveResena(resena) {
        try {
            await addDoc(collection(db, "resenas"), resena);
            return true;
        } catch (e) {
            return false;
        }
    },

    async responderResena(id, respuesta) {
        try {
            const resenaRef = doc(db, "resenas", id);
            await updateDoc(resenaRef, { respuestaBarbero: respuesta });
            return true;
        } catch (e) {
            return false;
        }
    }
};