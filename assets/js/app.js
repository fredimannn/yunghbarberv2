import { StorageManager } from './storage.js';
import { Validator } from './validator.js';

let citas = [];
let bloqueos = {};
let resenas = [];
let fechaSeleccionada = new Date();
let ratingEstrellas = 5;

const HORARIOS_JORNADA = ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

document.addEventListener('DOMContentLoaded', () => {
    configurarCalendarios();
    configurarFormularios();
    configurarEstrellas();
    comprobarAccesoBarbero();

    // Sincronizaciones activas de datos
    StorageManager.suscribirCitas((data) => {
        citas = data;
        actualizarPantalla();
    });

    StorageManager.suscribirBloqueos((data) => {
        bloqueos = data || {};
        actualizarPantalla();
    });

    StorageManager.suscribirResenas((data) => {
        resenas = data;
        dibujarResenasCliente();
        dibujarResenasBarbero();
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'local_bloqueos') {
            bloqueos = JSON.parse(e.newValue || '{}');
            actualizarPantalla();
        }
    });
});

function actualizarPantalla() {
    dibujarMes('cal-days-grid', 'cal-month-title', 'cal-selected-label', 'fecha');
    dibujarMes('barber-cal-days-grid', 'barber-cal-month-title', 'barber-cal-selected-label', 'barber-fecha-gestion');
    dibujarHorariosCliente();
    dibujarPanelDisponibilidad();
    dibujarTablaReservas();
}

function configurarCalendarios() {
    actualizarPantalla();

    const vincularBotones = (prevId, nextId) => {
        const btnPrev = document.getElementById(prevId);
        const btnNext = document.getElementById(nextId);
        if (btnPrev && btnNext) {
            btnPrev.onclick = () => {
                fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() - 1);
                actualizarPantalla();
            };
            btnNext.onclick = () => {
                fechaSeleccionada.setMonth(fechaSeleccionada.getMonth() + 1);
                actualizarPantalla();
            };
        }
    };

    vincularBotones('btn-prev-month', 'btn-next-month');
    vincularBotones('barber-btn-prev-month', 'barber-btn-next-month');
}

function dibujarMes(gridId, titleId, labelId, inputId) {
    const grid = document.getElementById(gridId);
    const title = document.getElementById(titleId);
    const label = document.getElementById(labelId);
    const input = document.getElementById(inputId);
    if (!grid) return;

    grid.innerHTML = '';
    const year = fechaSeleccionada.getFullYear();
    const month = fechaSeleccionada.getMonth();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    if (title) title.textContent = `${meses[month]} De ${year}`;

    const primerDiaIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDias = new Date(year, month + 1, 0).getDate();
    const diasMesPasado = new Date(year, month, 0).getDate();

    for (let i = primerDiaIndex - 1; i >= 0; i--) {
        const celda = document.createElement('div');
        celda.className = 'cal-day other-month';
        celda.textContent = diasMesPasado - i;
        grid.appendChild(celda);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let d = 1; d <= totalDias; d++) {
        const celda = document.createElement('div');
        celda.className = 'cal-day';
        celda.textContent = d;

        const fechaDia = new Date(year, month, d);
        const fStr = formatearISO(fechaDia);
        const estaBloqueadoDia = bloqueos[fStr]?.bloqueadoCompleto === true;

        if (fechaDia < hoy) {
            celda.classList.add('disabled');
        } else {
            if (estaBloqueadoDia) celda.classList.add('dia-libre');

            if (fStr === formatearISO(fechaSeleccionada)) {
                celda.classList.add('selected');
                if (input) input.value = fStr;
                if (label) label.textContent = formatearTextoFecha(fechaDia);
            }

            celda.onclick = () => {
                fechaSeleccionada = new Date(year, month, d);
                actualizarPantalla();
            };
        }
        grid.appendChild(celda);
    }
}

// Vista del cliente: sólo muestra (No Disponible) sin la hora tachada
function dibujarHorariosCliente() {
    const contenedor = document.getElementById('selector-horarios');
    if (!contenedor) return;

    const fechaHoy = formatearISO(fechaSeleccionada);
    const cfg = bloqueos[fechaHoy] || { bloqueadoCompleto: false, horasBloqueadas: [] };
    const citasOcupadas = citas.filter(c => c.fecha === fechaHoy).map(c => c.hora);

    contenedor.querySelectorAll('.btn-hora').forEach(btn => {
        const hora = btn.dataset.hora;
        const ocupadaPorCliente = citasOcupadas.includes(hora);
        const bloqueadaPorBarbero = cfg.bloqueadoCompleto || (Array.isArray(cfg.horasBloqueadas) && cfg.horasBloqueadas.includes(hora));

        if (bloqueadaPorBarbero || ocupadaPorCliente) {
            btn.disabled = true;
            btn.classList.add('ocupado');
            btn.textContent = `(No Disponible)`;
        } else {
            btn.disabled = false;
            btn.classList.remove('ocupado');
            btn.textContent = `${hora} hrs`;
        }
    });
}

// Vista del barbero: muestra (Día Tomado) sin número de hora cuando se bloquea
function dibujarPanelDisponibilidad() {
    const checkDia = document.getElementById('check-bloquear-dia');
    const gridHoras = document.getElementById('grid-horas-barbero');
    const cajaHoras = document.getElementById('contenedor-horas-barbero');
    if (!checkDia || !gridHoras) return;

    const fechaHoy = formatearISO(fechaSeleccionada);
    if (!bloqueos[fechaHoy]) {
        bloqueos[fechaHoy] = { bloqueadoCompleto: false, horasBloqueadas: [] };
    }
    const cfg = bloqueos[fechaHoy];
    if (!Array.isArray(cfg.horasBloqueadas)) cfg.horasBloqueadas = [];

    checkDia.checked = Boolean(cfg.bloqueadoCompleto);

    if (cajaHoras) {
        cajaHoras.style.opacity = checkDia.checked ? '0.35' : '1';
        cajaHoras.style.pointerEvents = 'auto';
    }

    checkDia.onchange = async () => {
        cfg.bloqueadoCompleto = checkDia.checked;
        bloqueos[fechaHoy] = cfg;
        actualizarPantalla();
        await StorageManager.saveBloqueoFecha(fechaHoy, cfg);
    };

    gridHoras.innerHTML = '';
    HORARIOS_JORNADA.forEach(hora => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-hora-barbero';

        const estaBloqueada = cfg.horasBloqueadas.includes(hora);
        if (estaBloqueada) {
            btn.classList.add('bloqueada-barbero');
            btn.textContent = `(Día Tomado)`;
        } else {
            btn.textContent = `${hora} hrs`;
        }

        btn.onclick = async (e) => {
            e.preventDefault();
            if (checkDia.checked) return;

            if (cfg.horasBloqueadas.includes(hora)) {
                cfg.horasBloqueadas = cfg.horasBloqueadas.filter(h => h !== hora);
            } else {
                cfg.horasBloqueadas.push(hora);
            }

            bloqueos[fechaHoy] = cfg;
            actualizarPantalla();
            await StorageManager.saveBloqueoFecha(fechaHoy, cfg);
        };

        gridHoras.appendChild(btn);
    });
}

function configurarFormularios() {
    const fReserva = document.getElementById('form-datos-finales');
    if (fReserva) {
        fReserva.onsubmit = async (e) => {
            e.preventDefault();
            const nom = document.getElementById('cliente-nombre');
            const tel = document.getElementById('cliente-telefono');
            const cor = document.getElementById('cliente-correo');
            const btn = document.getElementById('btn-confirmar-cita');

            const valNom = Validator.limpiar(nom?.value);
            const valTel = Validator.limpiar(tel?.value);
            const valCor = Validator.limpiar(cor?.value);

            let error = false;
            document.getElementById('err-cliente-nombre').textContent = '';
            document.getElementById('err-cliente-telefono').textContent = '';
            document.getElementById('err-cliente-correo').textContent = '';

            if (!Validator.requerido(valNom)) {
                document.getElementById('err-cliente-nombre').textContent = 'Ingresa tu nombre completo.';
                error = true;
            }
            if (!Validator.telefonoChile(valTel)) {
                document.getElementById('err-cliente-telefono').textContent = 'Deben ser exactamente 8 números tras el +56 9.';
                error = true;
            }
            if (!Validator.emailValido(valCor)) {
                document.getElementById('err-cliente-correo').textContent = 'Ingresa un correo electrónico válido.';
                error = true;
            }

            if (error) return;

            btn.disabled = true;
            btn.textContent = 'Agendando...';

            const fecha = document.getElementById('fecha')?.value || formatearISO(fechaSeleccionada);
            const hora = document.getElementById('hora')?.value || '';
            const servicio = document.getElementById('servicio')?.value || '';

            const ok = await StorageManager.saveCita({
                nombre: valNom,
                telefono: `+569${valTel}`,
                correo: valCor,
                fecha,
                hora,
                servicio,
                fechaCreacion: new Date().toISOString()
            });

            btn.disabled = false;
            btn.textContent = 'Confirmar y Agendar ✂️';

            if (ok) {
                alert(`¡Cita agendada para el ${fecha} a las ${hora} hrs!`);
                fReserva.reset();
                document.getElementById('modal-datos-cliente').style.display = 'none';
                document.getElementById('hora').value = '';
                document.querySelectorAll('.btn-hora').forEach(b => b.classList.remove('active'));
            } else {
                alert('No se pudo guardar la cita. Inténtalo de nuevo.');
            }
        };
    }

    const fResena = document.getElementById('form-resena');
    if (fResena) {
        fResena.onsubmit = async (e) => {
            e.preventDefault();
            const nombre = Validator.limpiar(document.getElementById('resena-nombre')?.value);
            const comentario = Validator.limpiar(document.getElementById('resena-comentario')?.value);

            if (!Validator.requerido(nombre) || !Validator.requerido(comentario)) {
                alert('Por favor completa tu nombre y comentario.');
                return;
            }

            await StorageManager.saveResena({
                nombre,
                estrellas: ratingEstrellas,
                comentario,
                fecha: formatearISO(new Date()),
                respuestaBarbero: null
            });

            alert('¡Gracias por tu opinión!');
            fResena.reset();
        };
    }

    const fLogin = document.getElementById('form-login-barbero');
    if (fLogin) {
        fLogin.onsubmit = (e) => {
            e.preventDefault();
            const email = Validator.limpiar(document.getElementById('login-email')?.value);
            const pass = Validator.limpiar(document.getElementById('pin-ingresado')?.value);
            const btn = document.getElementById('btn-login-submit');

            document.getElementById('err-login-email').textContent = '';
            document.getElementById('err-login-pass').textContent = '';

            let err = false;
            if (!Validator.emailValido(email)) {
                document.getElementById('err-login-email').textContent = 'Correo inválido.';
                err = true;
            }
            if (!Validator.passwordCorta(pass)) {
                document.getElementById('err-login-pass').textContent = 'La clave debe tener 4 o 5 caracteres.';
                err = true;
            }

            if (err) return;

            btn.disabled = true;
            btn.textContent = 'Verificando...';

            setTimeout(() => {
                localStorage.setItem('barber_auth', 'true');
                localStorage.setItem('barber_user', email);
                comprobarAccesoBarbero();
                btn.disabled = false;
                btn.textContent = 'Ingresar al Panel 🚀';
            }, 300);
        };
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.onclick = () => {
            localStorage.removeItem('barber_auth');
            localStorage.removeItem('barber_user');
            comprobarAccesoBarbero();
        };
    }
}

function dibujarTablaReservas() {
    const contenedor = document.getElementById('contenedor-citas');
    if (!contenedor) return;

    if (citas.length === 0) {
        contenedor.innerHTML = '<p style="color: #9ca3af;">No hay citas agendadas por el momento.</p>';
        return;
    }

    let filas = citas.map(c => `
        <tr>
            <td>
                <strong>${escapar(c.nombre)}</strong><br>
                <small style="color: #9ca3af;">📞 ${escapar(c.telefono || '-')}</small><br>
                <small style="color: #9ca3af;">✉️ ${escapar(c.correo || '-')}</small>
            </td>
            <td>${c.fecha} - ${c.hora} hrs</td>
            <td>${escapar(c.servicio)}</td>
            <td>
                <button type="button" class="btn-eliminar" onclick="borrarCita('${c.id}')" title="Eliminar Cita">🗑️</button>
            </td>
        </tr>
    `).join('');

    contenedor.innerHTML = `
        <table class="tabla-gestion">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Fecha / Hora</th>
                    <th>Servicio</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>
    `;
}

window.borrarCita = async (id) => {
    if (confirm('¿Deseas cancelar esta cita?')) {
        await StorageManager.deleteCita(id);
    }
};

function comprobarAccesoBarbero() {
    const modal = document.getElementById('modal-auth');
    const panel = document.getElementById('contenido-barbero');
    if (!modal || !panel) return;

    const auth = localStorage.getItem('barber_auth') === 'true';
    modal.style.display = auth ? 'none' : 'flex';
    panel.style.display = auth ? 'block' : 'none';
}

function configurarEstrellas() {
    const caja = document.getElementById('rating-stars');
    if (!caja) return;

    caja.querySelectorAll('.star').forEach(star => {
        star.onclick = () => {
            ratingEstrellas = parseInt(star.dataset.value);
            caja.querySelectorAll('.star').forEach((s, i) => {
                s.classList.toggle('active', i < ratingEstrellas);
            });
        };
    });
}

function dibujarResenasCliente() {
    const cont = document.getElementById('lista-resenas');
    if (!cont) return;

    if (resenas.length === 0) {
        cont.innerHTML = '<p style="color: #9ca3af; font-size: 0.85rem;">Aún no hay opiniones publicadas.</p>';
        return;
    }

    cont.innerHTML = resenas.map(r => `
        <div class="card-resena">
            <div class="resena-header">
                <strong>${escapar(r.nombre)}</strong>
                <span class="estrellas-render">${'★'.repeat(r.estrellas) + '☆'.repeat(5 - r.estrellas)}</span>
            </div>
            <p style="margin-top: 6px; font-size: 0.9rem;">${escapar(r.comentario)}</p>
            ${r.respuestaBarbero ? `
                <div class="respuesta-barbero-box">
                    <strong style="color: #fbbf24; font-size: 0.8rem;">Respuesta del Barbero:</strong>
                    <p style="font-size: 0.85rem; margin-top: 2px;">${escapar(r.respuestaBarbero)}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Vista de reseñas con botón para eliminar en el panel de barbero
function dibujarResenasBarbero() {
    const cont = document.getElementById('contenedor-gestion-resenas');
    if (!cont) return;

    if (resenas.length === 0) {
        cont.innerHTML = '<p style="color: #9ca3af;">No hay opiniones registradas.</p>';
        return;
    }

    cont.innerHTML = resenas.map(r => `
        <div class="card-resena" style="margin-bottom: 12px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong>${escapar(r.nombre)} (${r.estrellas} ★)</strong>
                    <p style="font-size: 0.9rem; margin: 4px 0;">"${escapar(r.comentario)}"</p>
                </div>
                <button type="button" class="btn-eliminar" onclick="borrarResena('${r.id}')" title="Eliminar reseña" style="padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
            </div>
            ${r.respuestaBarbero ? `
                <p style="color: #10b981; font-size: 0.85rem; margin-top: 6px;"><strong>Tu Respuesta:</strong> ${escapar(r.respuestaBarbero)}</p>
            ` : `
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <input type="text" id="resp-${r.id}" placeholder="Escribe tu respuesta..." style="padding: 6px; font-size: 0.85rem;">
                    <button type="button" class="btn-publicar" style="width: auto; padding: 6px 12px;" onclick="enviarRespuesta('${r.id}')">Responder</button>
                </div>
            `}
        </div>
    `).join('');
}

window.borrarResena = async (id) => {
    if (confirm('¿Seguro que deseas eliminar esta reseña?')) {
        await StorageManager.deleteResena(id);
    }
};

window.enviarRespuesta = async (id) => {
    const txt = document.getElementById(`resp-${id}`)?.value.trim();
    if (!txt) return;
    await StorageManager.responderResena(id, txt);
};

function formatearISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dia}`;
}

function formatearTextoFecha(d) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[d.getDay()]}, ${d.getDate()} De ${meses[d.getMonth()]}`;
}

function escapar(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
}