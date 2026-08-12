/**
 * Controlador Principal - YungHBarber
 */

const PIN_BARBERO = '1234';

let calificacionSeleccionada = 5;
let horaSeleccionada = '';

let fechaActualCliente = new Date();
let fechaSeleccionadaCliente = new Date();

let fechaActualBarbero = new Date();
let fechaSeleccionadaBarbero = new Date();

const LISTA_HORAS_BASE = ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

document.addEventListener('DOMContentLoaded', () => {
    initAuthBarbero();
    initClienteCalendar();
    initBarberoCalendar();
    initClienteView();
    initBarberoView();
    initRatingStars();
    initHorariosSelector();
    initStorageListener();
});

function toCapitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Control del Login de Barbero con Clave '1234'
 */
function initAuthBarbero() {
    const modalAuth = document.getElementById('modal-auth');
    const contenidoBarbero = document.getElementById('contenido-barbero');
    const formLogin = document.getElementById('form-login-barbero');

    if (!modalAuth || !contenidoBarbero) return;

    const autenticado = sessionStorage.getItem('yunghbarber_auth') === 'true';

    if (autenticado) {
        modalAuth.style.display = 'none';
        contenidoBarbero.style.display = 'block';
    } else {
        modalAuth.style.display = 'flex';
        contenidoBarbero.style.display = 'none';
    }

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const pinInput = document.getElementById('pin-ingresado')?.value;

            if (pinInput === PIN_BARBERO) {
                sessionStorage.setItem('yunghbarber_auth', 'true');
                modalAuth.style.display = 'none';
                contenidoBarbero.style.display = 'block';
                renderBarberoCalendar();
                renderCitasBarbero();
                renderResenasBarbero();
            } else {
                alert('Clave incorrecta. Inténtalo de nuevo.');
                document.getElementById('pin-ingresado').value = '';
            }
        });
    }
}

window.cerrarSesionBarbero = function() {
    sessionStorage.removeItem('yunghbarber_auth');
    location.reload();
};

/**
 * Genera la URL para Google Calendar (Exclusivo Barbero)
 */
function crearEnlaceGoogleCalendar(cita) {
    try {
        const fechaHoraInicio = new Date(`${cita.fecha}T${cita.hora}:00`);
        const fechaHoraFin = new Date(fechaHoraInicio.getTime() + 45 * 60000);

        const formatISO = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

        const titulo = encodeURIComponent(`Corte YungHBarber 💈: ${cita.nombre}`);
        const detalles = encodeURIComponent(`Cliente: ${cita.nombre}\nServicio: ${cita.servicio}\nEstado: ${cita.estado}`);
        const inicio = formatISO(fechaHoraInicio);
        const fin = formatISO(fechaHoraFin);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${inicio}/${fin}&details=${detalles}`;
    } catch (e) {
        console.error('Error al generar URL de Google Calendar:', e);
        return '#';
    }
}

/**
 * Calendario Vista Cliente
 */
function initClienteCalendar() {
    const btnPrev = document.getElementById('btn-prev-month');
    const btnNext = document.getElementById('btn-next-month');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            fechaActualCliente.setMonth(fechaActualCliente.getMonth() - 1);
            renderClienteCalendar();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            fechaActualCliente.setMonth(fechaActualCliente.getMonth() + 1);
            renderClienteCalendar();
        });
    }

    renderClienteCalendar();
}

function renderClienteCalendar() {
    const grid = document.getElementById('cal-days-grid');
    const labelSelected = document.getElementById('cal-selected-label');
    const titleMonth = document.getElementById('cal-month-title');
    const inputHidden = document.getElementById('fecha');

    if (!grid) return;

    grid.innerHTML = '';

    const año = fechaActualCliente.getFullYear();
    const mes = fechaActualCliente.getMonth();

    const nombreMes = fechaActualCliente.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (titleMonth) titleMonth.textContent = toCapitalizeWords(nombreMes);

    const opcionesTexto = { weekday: 'long', day: 'numeric', month: 'long' };
    if (labelSelected) labelSelected.textContent = toCapitalizeWords(fechaSeleccionadaCliente.toLocaleDateString('es-ES', opcionesTexto));

    const yyyy = fechaSeleccionadaCliente.getFullYear();
    const mm = String(fechaSeleccionadaCliente.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaSeleccionadaCliente.getDate()).padStart(2, '0');
    const fechaStringFormat = `${yyyy}-${mm}-${dd}`;
    if (inputHidden) inputHidden.value = fechaStringFormat;

    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);

    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const diasMesAnterior = new Date(año, mes, 0).getDate();

    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
        const numDia = diasMesAnterior - i;
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = numDia;
        grid.appendChild(div);
    }

    const hoyExacto = new Date();
    hoyExacto.setHours(0, 0, 0, 0);

    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = d;

        const iterFecha = new Date(año, mes, d);

        if (iterFecha < hoyExacto) {
            div.classList.add('disabled');
        } else {
            if (
                iterFecha.getFullYear() === fechaSeleccionadaCliente.getFullYear() &&
                iterFecha.getMonth() === fechaSeleccionadaCliente.getMonth() &&
                iterFecha.getDate() === fechaSeleccionadaCliente.getDate()
            ) {
                div.classList.add('selected');
            }

            div.addEventListener('click', () => {
                fechaSeleccionadaCliente = new Date(año, mes, d);
                renderClienteCalendar();
            });
        }

        grid.appendChild(div);
    }

    const totalCeldas = grid.children.length;
    const celdasRestantes = (Math.ceil(totalCeldas / 7) * 7) - totalCeldas;

    for (let j = 1; j <= celdasRestantes; j++) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = j;
        grid.appendChild(div);
    }

    actualizarDisponibilidadHorarios(fechaStringFormat);
}

/**
 * Calendario Vista Barbero
 */
function initBarberoCalendar() {
    const btnPrev = document.getElementById('barber-btn-prev-month');
    const btnNext = document.getElementById('barber-btn-next-month');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            fechaActualBarbero.setMonth(fechaActualBarbero.getMonth() - 1);
            renderBarberoCalendar();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            fechaActualBarbero.setMonth(fechaActualBarbero.getMonth() + 1);
            renderBarberoCalendar();
        });
    }

    renderBarberoCalendar();
}

function renderBarberoCalendar() {
    const grid = document.getElementById('barber-cal-days-grid');
    const labelSelected = document.getElementById('barber-cal-selected-label');
    const titleMonth = document.getElementById('barber-cal-month-title');
    const inputHidden = document.getElementById('barber-fecha-gestion');

    if (!grid) return;

    grid.innerHTML = '';

    const año = fechaActualBarbero.getFullYear();
    const mes = fechaActualBarbero.getMonth();

    const nombreMes = fechaActualBarbero.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (titleMonth) titleMonth.textContent = toCapitalizeWords(nombreMes);

    const opcionesTexto = { weekday: 'long', day: 'numeric', month: 'long' };
    if (labelSelected) labelSelected.textContent = toCapitalizeWords(fechaSeleccionadaBarbero.toLocaleDateString('es-ES', opcionesTexto));

    const yyyy = fechaSeleccionadaBarbero.getFullYear();
    const mm = String(fechaSeleccionadaBarbero.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaSeleccionadaBarbero.getDate()).padStart(2, '0');
    const fechaStringFormat = `${yyyy}-${mm}-${dd}`;
    if (inputHidden) inputHidden.value = fechaStringFormat;

    const primerDiaMes = new Date(año, mes, 1);
    const ultimoDiaMes = new Date(año, mes + 1, 0);

    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const diasMesAnterior = new Date(año, mes, 0).getDate();

    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
        const numDia = diasMesAnterior - i;
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = numDia;
        grid.appendChild(div);
    }

    const hoyExacto = new Date();
    hoyExacto.setHours(0, 0, 0, 0);

    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.textContent = d;

        const iterFecha = new Date(año, mes, d);

        if (iterFecha < hoyExacto) {
            div.classList.add('disabled');
        } else {
            if (
                iterFecha.getFullYear() === fechaSeleccionadaBarbero.getFullYear() &&
                iterFecha.getMonth() === fechaSeleccionadaBarbero.getMonth() &&
                iterFecha.getDate() === fechaSeleccionadaBarbero.getDate()
            ) {
                div.classList.add('selected');
            }

            div.addEventListener('click', () => {
                fechaSeleccionadaBarbero = new Date(año, mes, d);
                renderBarberoCalendar();
            });
        }

        grid.appendChild(div);
    }

    const totalCeldas = grid.children.length;
    const celdasRestantes = (Math.ceil(totalCeldas / 7) * 7) - totalCeldas;

    for (let j = 1; j <= celdasRestantes; j++) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month';
        div.textContent = j;
        grid.appendChild(div);
    }

    cargarControlesGestionBarbero(fechaStringFormat);
}

function actualizarDisponibilidadHorarios(fechaFormatted) {
    const contenedor = document.getElementById('selector-horarios');
    const inputOcultoHora = document.getElementById('hora');
    if (!contenedor) return;

    const configBloqueo = StorageManager.getBloqueoFecha(fechaFormatted);
    const citas = StorageManager.getCitas();
    const horasAgendadas = citas
        .filter(c => c.fecha === fechaFormatted && c.estado !== 'Cancelada')
        .map(c => c.hora);

    const botones = contenedor.querySelectorAll('.btn-hora');

    botones.forEach(btn => {
        const horaBtn = btn.getAttribute('data-hora');

        if (configBloqueo.diaBloqueado) {
            btn.disabled = true;
            btn.classList.add('ocupado');
            btn.classList.remove('active');
            btn.textContent = `No Disponible`;
        } else if (horasAgendadas.includes(horaBtn) || (configBloqueo.horasDesactivadas && configBloqueo.horasDesactivadas.includes(horaBtn))) {
            btn.disabled = true;
            btn.classList.add('ocupado');
            btn.classList.remove('active');
            btn.textContent = `${horaBtn} (Ocupado)`;

            if (horaSeleccionada === horaBtn) {
                horaSeleccionada = '';
                if (inputOcultoHora) inputOcultoHora.value = '';
            }
        } else {
            btn.disabled = false;
            btn.classList.remove('ocupado');
            btn.textContent = `${horaBtn} hrs`;
        }
    });
}

function initHorariosSelector() {
    const contenedor = document.getElementById('selector-horarios');
    const inputOcultoHora = document.getElementById('hora');
    if (!contenedor) return;

    const botones = contenedor.querySelectorAll('.btn-hora');
    botones.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;

            botones.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            horaSeleccionada = btn.getAttribute('data-hora');
            if (inputOcultoHora) inputOcultoHora.value = horaSeleccionada;
        });
    });
}

function initRatingStars() {
    const starsContainer = document.getElementById('rating-stars');
    if (!starsContainer) return;

    const stars = starsContainer.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.getAttribute('data-value'), 10);
            highlightStars(stars, val);
        });

        starsContainer.addEventListener('mouseleave', () => {
            highlightStars(stars, calificacionSeleccionada);
        });

        star.addEventListener('click', () => {
            calificacionSeleccionada = parseInt(star.getAttribute('data-value'), 10);
            highlightStars(stars, calificacionSeleccionada);
        });
    });

    highlightStars(stars, calificacionSeleccionada);
}

function highlightStars(stars, value) {
    stars.forEach(s => {
        const starValue = parseInt(s.getAttribute('data-value'), 10);
        if (starValue <= value) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

function initClienteView() {
    const formAgenda = document.getElementById('form-agenda');
    const formResena = document.getElementById('form-resena');

    if (formAgenda) {
        formAgenda.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = Validator.trimInput(document.getElementById('nombre')?.value);
            const fecha = document.getElementById('fecha')?.value;
            const hora = document.getElementById('hora')?.value;
            const servicio = Validator.trimInput(document.getElementById('servicio')?.value);

            if (!nombre || !fecha || !hora || !servicio) {
                alert('Por favor completa todos los campos y selecciona una hora disponible.');
                return;
            }

            const validacionFecha = Validator.validarFechaHoraFutura(fecha, hora);
            if (!validacionFecha.isValid) {
                alert(validacionFecha.message);
                return;
            }

            const nuevaCita = { nombre, fecha, hora, servicio, estado: 'Pendiente' };

            if (StorageManager.saveCita(nuevaCita)) {
                alert('¡Hora agendada con éxito!');
                formAgenda.reset();
                document.querySelectorAll('.btn-hora').forEach(b => b.classList.remove('active'));
                horaSeleccionada = '';
                renderClienteCalendar();
            } else {
                alert('Error al agendar la hora.');
            }
        });
    }

    if (formResena) {
        renderResenasCliente();

        formResena.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = Validator.trimInput(document.getElementById('resena-nombre')?.value);
            const comentario = Validator.trimInput(document.getElementById('resena-comentario')?.value);

            if (!nombre || !comentario) {
                alert('Por favor escribe tu nombre y tu opinión.');
                return;
            }

            const nuevaResena = { nombre, comentario, calificacion: calificacionSeleccionada };

            if (StorageManager.saveResena(nuevaResena)) {
                formResena.reset();
                calificacionSeleccionada = 5;
                highlightStars(document.querySelectorAll('#rating-stars .star'), 5);
                renderResenasCliente();
            }
        });
    }
}

function renderResenasCliente() {
    const contenedor = document.getElementById('lista-resenas');
    if (!contenedor) return;

    const resenas = StorageManager.getResenas();

    if (resenas.length === 0) {
        contenedor.innerHTML = '<p class="sin-resenas">Aún no hay opiniones. ¡Sé el primero en dejar una!</p>';
        return;
    }

    let html = '';
    resenas.forEach(r => {
        const estrellasHtml = '★'.repeat(r.calificacion) + '☆'.repeat(5 - r.calificacion);
        html += `
            <div class="card-resena">
                <div class="resena-header">
                    <strong>${escapeHtml(r.nombre)}</strong>
                    <span class="estrellas-render">${estrellasHtml}</span>
                </div>
                <p class="resena-texto">"${escapeHtml(r.comentario)}"</p>
                ${r.respuestaBarbero ? `
                    <div class="respuesta-barbero-box">
                        <strong style="color: #fbbf24;">Respuesta de YungHBarber 💈:</strong>
                        <p style="font-size: 0.85rem; color: #e2e8f0; margin-top: 4px;">${escapeHtml(r.respuestaBarbero)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

function initBarberoView() {
    const contenedorCitas = document.getElementById('contenedor-citas');
    const contenedorResenas = document.getElementById('contenedor-gestion-resenas');

    if (contenedorCitas) renderCitasBarbero();
    if (contenedorResenas) renderResenasBarbero();
}

function cargarControlesGestionBarbero(fechaFormatted) {
    const checkDia = document.getElementById('check-bloquear-dia');
    const gridHoras = document.getElementById('grid-horas-barbero');
    if (!gridHoras) return;

    const config = StorageManager.getBloqueoFecha(fechaFormatted);

    if (checkDia) {
        checkDia.checked = config.diaBloqueado || false;
        
        checkDia.onclick = () => {
            config.diaBloqueado = checkDia.checked;
            StorageManager.saveBloqueoFecha(fechaFormatted, config);
            cargarControlesGestionBarbero(fechaFormatted);
        };
    }

    gridHoras.innerHTML = '';

    LISTA_HORAS_BASE.forEach(hora => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-hora-barbero';

        const estaBloqueada = config.horasDesactivadas && config.horasDesactivadas.includes(hora);

        if (estaBloqueada) {
            btn.classList.add('bloqueada-barbero');
            btn.textContent = `${hora} (Bloqueada)`;
        } else {
            btn.textContent = `${hora} (Disponible)`;
        }

        if (config.diaBloqueado) {
            btn.disabled = true;
            btn.style.opacity = '0.4';
        } else {
            btn.disabled = false;
        }

        btn.addEventListener('click', () => {
            if (!config.horasDesactivadas) config.horasDesactivadas = [];

            if (estaBloqueada) {
                config.horasDesactivadas = config.horasDesactivadas.filter(h => h !== hora);
            } else {
                config.horasDesactivadas.push(hora);
            }

            StorageManager.saveBloqueoFecha(fechaFormatted, config);
            cargarControlesGestionBarbero(fechaFormatted);
        });

        gridHoras.appendChild(btn);
    });
}

function renderCitasBarbero() {
    const contenedor = document.getElementById('contenedor-citas');
    if (!contenedor) return;

    const citas = StorageManager.getCitas();
    if (citas.length === 0) {
        contenedor.innerHTML = '<p class="sin-datos">No hay horas agendadas.</p>';
        return;
    }

    let html = `
        <table class="tabla-gestion">
            <thead>
                <tr>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Fecha / Hora</th>
                    <th>Estado</th>
                    <th>Acciones Barbero</th>
                </tr>
            </thead>
            <tbody>
    `;

    citas.forEach(cita => {
        const calendarUrl = crearEnlaceGoogleCalendar(cita);

        html += `
            <tr>
                <td><strong>${escapeHtml(cita.nombre)}</strong></td>
                <td>${escapeHtml(cita.servicio)}</td>
                <td>${cita.fecha} - ${cita.hora} hrs</td>
                <td>
                    <select class="select-estado" onchange="cambiarEstadoCita('${cita.id}', this.value)">
                        <option value="Pendiente" ${cita.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="Confirmada" ${cita.estado === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                        <option value="Completada" ${cita.estado === 'Completada' ? 'selected' : ''}>Completada</option>
                        <option value="Cancelada" ${cita.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                        <a href="${calendarUrl}" target="_blank" rel="noopener noreferrer" class="btn-sync-cal" title="Sincronizar esta hora a mi Google Calendar">
                            📆 Sincronizar Google
                        </a>
                        <button class="btn-eliminar" onclick="eliminarCita('${cita.id}')">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function renderResenasBarbero() {
    const contenedor = document.getElementById('contenedor-gestion-resenas');
    if (!contenedor) return;

    const resenas = StorageManager.getResenas();
    if (resenas.length === 0) {
        contenedor.innerHTML = '<p class="sin-datos">No hay reseñas registradas.</p>';
        return;
    }

    let html = `<div class="lista-gestion-resenas-barbero">`;

    resenas.forEach(r => {
        const estrellasHtml = '★'.repeat(r.calificacion);
        html += `
            <div class="card-resena-barbero" style="background: #03050a; border: 1px solid #182232; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>${escapeHtml(r.nombre)} <span class="estrellas-render">(${estrellasHtml})</span></strong>
                    <button class="btn-eliminar" onclick="eliminarResenaBarbero('${r.id}')">Borrar Reseña</button>
                </div>
                <p style="font-style: italic; color: #cbd5e1; margin: 10px 0;">"${escapeHtml(r.comentario)}"</p>
                
                <div class="box-responder-resena" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #182232;">
                    <label style="font-size: 0.85rem; color: #fbbf24; font-weight: 600; display: block; margin-bottom: 6px;">
                        ${r.respuestaBarbero ? 'Editar tu respuesta pública:' : 'Escribe tu respuesta pública:'}
                    </label>
                    <textarea id="input-respuesta-${r.id}" placeholder="Escribe tu respuesta..." style="width: 100%; min-height: 60px; margin-bottom: 8px;">${r.respuestaBarbero ? escapeHtml(r.respuestaBarbero) : ''}</textarea>
                    <button class="btn-publicar" style="width: auto; padding: 8px 16px; font-size: 0.85rem;" onclick="guardarRespuestaBarbero('${r.id}')">
                        ${r.respuestaBarbero ? 'Actualizar Respuesta ✍️' : 'Publicar Respuesta 💬'}
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    contenedor.innerHTML = html;
}

window.guardarRespuestaBarbero = function(id) {
    const textarea = document.getElementById(`input-respuesta-${id}`);
    if (!textarea) return;

    const textoRespuesta = Validator.trimInput(textarea.value);

    if (StorageManager.updateResenaRespuesta(id, textoRespuesta)) {
        alert('Respuesta guardada con éxito.');
        renderResenasBarbero();
        renderResenasCliente();
    } else {
        alert('Error al guardar la respuesta.');
    }
};

window.cambiarEstadoCita = function(id, nuevoEstado) {
    StorageManager.updateCita(id, { estado: nuevoEstado });
    renderClienteCalendar();
};

window.eliminarCita = function(id) {
    if (confirm('¿Eliminar esta hora agendada?')) {
        StorageManager.deleteCita(id);
        renderCitasBarbero();
        renderClienteCalendar();
    }
};

window.eliminarResenaBarbero = function(id) {
    if (confirm('¿Deseas borrar esta reseña del sistema?')) {
        StorageManager.deleteResena(id);
        renderResenasBarbero();
        renderResenasCliente();
    }
};

function initStorageListener() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'yunghbarber_citas' || e.key === 'yunghbarber_bloqueos') {
            renderCitasBarbero();
            renderClienteCalendar();
            renderBarberoCalendar();
        }
        if (e.key === 'yunghbarber_resenas') {
            renderResenasCliente();
            renderResenasBarbero();
        }
    });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}