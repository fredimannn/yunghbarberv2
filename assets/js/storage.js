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
        const citas = JSON.parse(localStorage.getItem('local_citas') || '[]');
        const nueva = { id: 'cita_' + Date.now(), ...cita };
        citas.push(nueva);
        localStorage.setItem('local_citas', JSON.stringify(citas));

        try {
            await addDoc(collection(db, "citas"), cita);
        } catch (e) {
            console.warn("Cita almacenada localmente.");
        }
        return true;
    },

    async saveBloqueoFecha(fecha, config) {
        const local = JSON.parse(localStorage.getItem('local_bloqueos') || '{}');
        local[fecha] = config;
        localStorage.setItem('local_bloqueos', JSON.stringify(local));

        try {
            await setDoc(doc(db, "bloqueos", fecha), config);
        } catch (e) {
            console.warn("Bloqueo almacenado localmente.");
        }
        return true;
    },

    async deleteCita(id) {
        const citas = JSON.parse(localStorage.getItem('local_citas') || '[]').filter(c => c.id !== id);
        localStorage.setItem('local_citas', JSON.stringify(citas));
        try {
            await deleteDoc(doc(db, "citas", id));
        } catch {}
        return true;
    },

    async saveResena(resena) {
        const res = JSON.parse(localStorage.getItem('local_resenas') || '[]');
        res.push({ id: 'res_' + Date.now(), ...resena });
        localStorage.setItem('local_resenas', JSON.stringify(res));
        try {
            await addDoc(collection(db, "resenas"), resena);
        } catch {}
        return true;
    },

    async responderResena(id, respuesta) {
        const res = JSON.parse(localStorage.getItem('local_resenas') || '[]');
        const idx = res.findIndex(r => r.id === id);
        if (idx !== -1) {
            res[idx].respuestaBarbero = respuesta;
            localStorage.setItem('local_resenas', JSON.stringify(res));
        }

        try {
            await updateDoc(doc(db, "resenas", id), { respuestaBarbero: respuesta });
            return true;
        } catch {
            return true;
        }
    },

    async deleteResena(id) {
        const res = JSON.parse(localStorage.getItem('local_resenas') || '[]').filter(r => r.id !== id);
        localStorage.setItem('local_resenas', JSON.stringify(res));
        try {
            await deleteDoc(doc(db, "resenas", id));
        } catch {}
        return true;
    }
};