import { StorageManager } from './storage.js';

let citasEfectivas = [];
let bloqueosGlobales = {};
let resenasEfectivas = [];
let fechaSeleccionadaGlobal = new Date();
let ratingValueGlobal = 5;

document.addEventListener('DOMContentLoaded', () => {
    // Suscripciones en tiempo real a Firebase
    StorageManager.suscribirCitas((citas) => {
        citasEfectivas = citas;
        renderizarVistaActual();
    });

    StorageManager.suscribirBloqueos((bloqueos) => {
        bloqueosGlobales = bloqueos;
        renderizarVistaActual();
    });

    StorageManager.suscribirResenas((resenas) => {
        resenasEfectivas = resenas;
        renderizarResenasCliente();
        renderizarGestionResenasBarbero();
    });

    inicializarCalendarios();
    inicializarFormularios();
    inicializarRatingStars();
    verificarAutenticacionBarbero();
});

function renderizarVistaActual() {
    renderizarHorariosCliente();
    renderizarControlDisponibilidadBarbero();
    renderizarTablaCitasBarbero();
}

// --- RENDERIZADO DEL CALENDARIO (ESTILO FOTO) ---
function inicializarCalendarios() {
    renderizarCalendario('cal-days-grid', 'cal-month-title', 'cal-selected-label', 'fecha');
    renderizarCalendario('barber-cal-days-grid', 'barber-cal-month-title', 'barber-cal-selected-label', 'barber-fecha-gestion');

    setupNavCalendario('btn-prev-month', 'btn-next-month', 'cal-days-grid', 'cal-month-title', 'cal-selected-label', 'fecha');
    setupNavCalendario('barber-btn-prev-month', 'barber-btn-next-month', 'barber-cal-days-grid', 'barber-cal-month-title', 'barber-cal-selected-label', 'barber-fecha-gestion');
}

function setupNavCalendario(btnPrevId, btnNextId, gridId, monthTitleId, selectedLabelId, hiddenInputId) {
    const btnPrev = document.getElementById(btnPrevId);
    const btnNext = document.getElementById(btnNextId);

    if (btnPrev && btnNext) {
        btnPrev.onclick = () => {
            fechaSeleccionadaGlobal.setMonth(fechaSeleccionadaGlobal.getMonth() - 1);
            renderizarCalendario(gridId, monthTitleId, selectedLabelId, hiddenInputId);
            renderizarVistaActual();
        };

        btnNext.onclick = () => {
            fechaSeleccionadaGlobal.setMonth(fechaSeleccionadaGlobal.getMonth() + 1);
            renderizarCalendario(gridId, monthTitleId, selectedLabelId, hiddenInputId);
            renderizarVistaActual();
        };
    }
}

function renderizarCalendario(gridId, monthTitleId, selectedLabelId, hiddenInputId) {
    const grid = document.getElementById(gridId);
    const monthTitle = document.getElementById(monthTitleId);
    const selectedLabel = document.getElementById(selectedLabelId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!grid) return;

    grid.innerHTML = '';
    const year = fechaSeleccionadaGlobal.getFullYear();
    const month = fechaSeleccionadaGlobal.getMonth();

    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0).getDate();

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (monthTitle) monthTitle.textContent = `${nombresMeses[month]} De ${year}`;

    let primerDiaSemanaIndex = primerDiaMes.getDay() - 1;
    if (primerDiaSemanaIndex === -1) primerDiaSemanaIndex = 6;

    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(year, month, 0).getDate();
    for (let i = primerDiaSemanaIndex - 1; i >= 0; i--) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = ultimoDiaMesAnterior - i;
        grid.appendChild(div);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Días del mes actual
    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = dia;

        const fechaEvaluada = new Date(year, month, dia);
        const fechaFormatted = formatDate(fechaEvaluada);

        if (fechaEvaluada < hoy) {
            div.classList.add('disabled');
        } else {
            if (fechaFormatted === formatDate(fechaSeleccionadaGlobal)) {
                div.classList.add('selected');
                if (hiddenInput) hiddenInput.value = fechaFormatted;
                if (selectedLabel) selectedLabel.textContent = formatFechaLegible(fechaEvaluada);
            }

            div.onclick = () => {
                fechaSeleccionadaGlobal = new Date(year, month, dia);
                renderizarCalendario('cal-days-grid', 'cal-month-title', 'cal-selected-label', 'fecha');
                renderizarCalendario('barber-cal-days-grid', 'barber-cal-month-title', 'barber-cal-selected-label', 'barber-fecha-gestion');
                renderizarVistaActual();
            };
        }
        grid.appendChild(div);
    }
}

// --- HORARIOS DISPONIBLES ---
function renderizarHorariosCliente() {
    const contenedor = document.getElementById('selector-horarios');
    if (!contenedor) return;

    const fechaStr = formatDate(fechaSeleccionadaGlobal);
    const configDia = bloqueosGlobales[fechaStr] || { bloqueadoCompleto: false, horasBloqueadas: [] };
    const citasDelDia = citasEfectivas.filter(c => c.fecha === fechaStr);

    const botones = contenedor.querySelectorAll('.btn-hora');
    botones.forEach(btn => {
        const hora = btn.getAttribute('data-hora');
        const estaOcupadaPorCita = citasDelDia.some(c => c.hora === hora);
        const estaBloqueadaPorBarbero = configDia.bloqueadoCompleto || (configDia.horasBloqueadas && configDia.horasBloqueadas.includes(hora));

        if (estaOcupadaPorCita || estaBloqueadaPorBarbero) {
            btn.disabled = true;
            btn.classList.add('ocupado');
            btn.textContent = `${hora} (No Disp.)`;
        } else {
            btn.disabled = false;
            btn.classList.remove('ocupado');
            btn.textContent = `${hora} hrs`;
        }
    });
}

// --- FORMULARIOS ---
function inicializarFormularios() {
    const formAgenda = document.getElementById('form-agenda');
    if (formAgenda) {
        const btnsHora = formAgenda.querySelectorAll('.btn-hora');
        btnsHora.forEach(btn => {
            btn.onclick = () => {
                if (btn.disabled) return;
                btnsHora.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('hora').value = btn.getAttribute('data-hora');
            };
        });

        formAgenda.onsubmit = async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('nombre').value.trim();
            const fecha = document.getElementById('fecha').value;
            const hora = document.getElementById('hora').value;
            const servicio = document.getElementById('servicio').value;

            if (!hora) {
                alert("Por favor selecciona una hora disponible.");
                return;
            }

            const nuevaCita = { nombre, fecha, hora, servicio, fechaCreacion: new Date().toISOString() };
            const exito = await StorageManager.saveCita(nuevaCita);

            if (exito) {
                alert(`¡Hora agendada con éxito para el ${fecha} a las ${hora} hrs!`);
                formAgenda.reset();
                document.getElementById('hora').value = '';
                btnsHora.forEach(b => b.classList.remove('active'));
            } else {
                alert("Error al guardar cita en la base de datos.");
            }
        };
    }

    // Formulario Reseñas
    const formResena = document.getElementById('form-resena');
    if (formResena) {
        formResena.onsubmit = async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('resena-nombre').value.trim();
            const comentario = document.getElementById('resena-comentario').value.trim();

            const nuevaResena = {
                nombre,
                estrellas: ratingValueGlobal,
                comentario,
                fecha: formatDate(new Date()),
                respuestaBarbero: null
            };

            const exito = await StorageManager.saveResena(nuevaResena);
            if (exito) {
                alert("¡Opinión publicada con éxito!");
                formResena.reset();
            }
        };
    }

    // Login Barbero (Clave 1234)
    const formLogin = document.getElementById('form-login-barbero');
    if (formLogin) {
        formLogin.onsubmit = (e) => {
            e.preventDefault();
            const pin = document.getElementById('pin-ingresado').value.trim();
            if (pin === "1234") {
                localStorage.setItem('barber_auth', 'true');
                verificarAutenticacionBarbero();
            } else {
                alert("Clave incorrecta. Intenta nuevamente.");
            }
        };
    }
}

// --- PANEL BARBERO ---
function renderizarControlDisponibilidadBarbero() {
    const checkBloquearDia = document.getElementById('check-bloquear-dia');
    const gridHorasBarbero = document.getElementById('grid-horas-barbero');
    if (!checkBloquearDia || !gridHorasBarbero) return;

    const fechaStr = formatDate(fechaSeleccionadaGlobal);
    const configDia = bloqueosGlobales[fechaStr] || { bloqueadoCompleto: false, horasBloqueadas: [] };

    checkBloquearDia.checked = configDia.bloqueadoCompleto;

    checkBloquearDia.onchange = async () => {
        configDia.bloqueadoCompleto = checkBloquearDia.checked;
        await StorageManager.saveBloqueoFecha(fechaStr, configDia);
    };

    const horasEstandar = ["10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
    gridHorasBarbero.innerHTML = '';

    horasEstandar.forEach(hora => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-hora-barbero';
        
        const estaBloqueada = configDia.horasBloqueadas && configDia.horasBloqueadas.includes(hora);
        if (estaBloqueada) {
            btn.classList.add('bloqueada-barbero');
            btn.textContent = `${hora} (Bloqueada)`;
        } else {
            btn.textContent = `${hora} hrs`;
        }

        btn.onclick = async () => {
            if (!configDia.horasBloqueadas) configDia.horasBloqueadas = [];
            if (estaBloqueada) {
                configDia.horasBloqueadas = configDia.horasBloqueadas.filter(h => h !== hora);
            } else {
                configDia.horasBloqueadas.push(hora);
            }
            await StorageManager.saveBloqueoFecha(fechaStr, configDia);
        };

        gridHorasBarbero.appendChild(btn);
    });
}

function renderizarTablaCitasBarbero() {
    const contenedor = document.getElementById('contenedor-citas');
    if (!contenedor) return;

    if (citasEfectivas.length === 0) {
        contenedor.innerHTML = '<p style="color: #9ca3af;">No hay citas agendadas por el momento.</p>';
        return;
    }

    let html = `
        <table class="tabla-gestion">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Fecha / Hora</th>
                    <th>Servicio</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    citasEfectivas.forEach(c => {
        const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Corte+Barberia+${encodeURIComponent(c.nombre)}&dates=${c.fecha.replace(/-/g, '')}T${c.hora.replace(':', '')}00Z/${c.fecha.replace(/-/g, '')}T${c.hora.replace(':', '')}00Z&details=${encodeURIComponent(c.servicio)}`;

        html += `
            <tr>
                <td><strong>${escapeHTML(c.nombre)}</strong></td>
                <td>${c.fecha} - ${c.hora} hrs</td>
                <td>${escapeHTML(c.servicio)}</td>
                <td style="display: flex; gap: 6px;">
                    <a href="${googleCalUrl}" target="_blank" class="btn-sync-cal">📆 Google</a>
                    <button type="button" class="btn-eliminar" onclick="eliminarCitaBarbero('${c.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    contenedor.innerHTML = html;
}

window.eliminarCitaBarbero = async (id) => {
    if (confirm("¿Estás seguro de cancelar esta cita?")) {
        await StorageManager.deleteCita(id);
    }
};

window.cerrarSesionBarbero = () => {
    localStorage.removeItem('barber_auth');
    location.reload();
};

function verificarAutenticacionBarbero() {
    const modal = document.getElementById('modal-auth');
    const contenido = document.getElementById('contenido-barbero');
    if (!modal || !contenido) return;

    if (localStorage.getItem('barber_auth') === 'true') {
        modal.style.display = 'none';
        contenido.style.display = 'block';
    } else {
        modal.style.display = 'flex';
        contenido.style.display = 'none';
    }
}

// --- RESEÑAS & ESTRELLAS ---
function inicializarRatingStars() {
    const starsContainer = document.getElementById('rating-stars');
    if (!starsContainer) return;

    const stars = starsContainer.querySelectorAll('.star');
    stars.forEach(s => {
        s.onclick = () => {
            ratingValueGlobal = parseInt(s.getAttribute('data-value'));
            stars.forEach((st, idx) => {
                if (idx < ratingValueGlobal) st.classList.add('active');
                else st.classList.remove('active');
            });
        };
    });
}

function renderizarResenasCliente() {
    const contenedor = document.getElementById('lista-resenas');
    if (!contenedor) return;

    if (resenasEfectivas.length === 0) {
        contenedor.innerHTML = '<p style="color: #9ca3af; font-size: 0.85rem;">Sé el primero en dejar una opinión.</p>';
        return;
    }

    let html = '';
    resenasEfectivas.forEach(r => {
        const estrellas = '★'.repeat(r.estrellas) + '☆'.repeat(5 - r.estrellas);
        html += `
            <div class="card-resena">
                <div class="resena-header">
                    <strong>${escapeHTML(r.nombre)}</strong>
                    <span class="estrellas-render">${estrellas}</span>
                </div>
                <p style="margin-top: 6px; font-size: 0.9rem;">${escapeHTML(r.comentario)}</p>
                ${r.respuestaBarbero ? `
                    <div class="respuesta-barbero-box">
                        <strong style="color: #fbbf24; font-size: 0.8rem;">Respuesta del Barbero:</strong>
                        <p style="font-size: 0.85rem; margin-top: 2px;">${escapeHTML(r.respuestaBarbero)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

function renderizarGestionResenasBarbero() {
    const contenedor = document.getElementById('contenedor-gestion-resenas');
    if (!contenedor) return;

    if (resenasEfectivas.length === 0) {
        contenedor.innerHTML = '<p style="color: #9ca3af;">No hay reseñas publicadas aún.</p>';
        return;
    }

    let html = '';
    resenasEfectivas.forEach(r => {
        html += `
            <div class="card-resena" style="margin-bottom: 12px;">
                <strong>${escapeHTML(r.nombre)} (${r.estrellas} ★)</strong>
                <p style="font-size: 0.9rem; margin: 4px 0;">"${escapeHTML(r.comentario)}"</p>
                ${r.respuestaBarbero ? `
                    <p style="color: #10b981; font-size: 0.85rem;"><strong>Tu Respuesta:</strong> ${escapeHTML(r.respuestaBarbero)}</p>
                ` : `
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <input type="text" id="resp-input-${r.id}" placeholder="Escribe tu respuesta..." style="padding: 6px; font-size: 0.85rem;">
                        <button type="button" class="btn-publicar" style="width: auto; padding: 6px 12px;" onclick="enviarRespuestaBarbero('${r.id}')">Responder</button>
                    </div>
                `}
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

window.enviarRespuestaBarbero = async (id) => {
    const input = document.getElementById(`resp-input-${id}`);
    if (!input || !input.value.trim()) return;

    await StorageManager.responderResena(id, input.value.trim());
};

// --- UTILS ---
function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatFechaLegible(d) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${dias[d.getDay()]}, ${d.getDate()} De ${meses[d.getMonth()]}`;
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}