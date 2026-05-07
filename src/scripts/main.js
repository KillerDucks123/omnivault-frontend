let activeItem = { id: null, tipo: null, contenido: null };

const API_URL = 'https://omnivault-backend-production.up.railway.app';
const STORAGE_URL = `https://vmdqshrvmsfpxisqbwzx.supabase.co/storage/v1/object/public/archivos-vault/`;

async function cargarElementos() {
    try {
        const response = await fetch(`${API_URL}/obtener-elementos`);
        const elementos = await response.json();
        
        const contenedor = document.getElementById('contenedor-tarjetas');
        if (!contenedor) return;
        contenedor.innerHTML = ''; 

        elementos.forEach(item => {
            const fecha = new Date(item.created_at).toLocaleDateString('es-CL');
            const esImagen = item.tipo === 'imagen';
            const urlArchivo = esImagen ? `${STORAGE_URL}${item.contenido}` : null;

            contenedor.innerHTML += `
                <div class="card item-card" data-tags="${item.tags || ''}">
                    ${esImagen ? `<img src="${urlArchivo}" class="card-img-top" alt="Vista previa">` : ''}
                    <div class="card-content p-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <span class="badge bg-secondary mb-2">${item.tipo.toUpperCase()}</span>
                            <small class="text-muted">${fecha}</small>
                        </div>
                        <h3 class="card-title h5">${item.titulo || 'Sin título'}</h3>
                        <p class="card-desc small text-secondary">${item.resumen || ''}</p>
                        
                        <div class="card-actions d-flex gap-2 mt-3">
                            <button class="btn btn-sm btn-outline-primary btn-view" 
                                data-id="${item.id}" data-tipo="${item.tipo}" 
                                data-contenido="${item.contenido}" data-url="${urlArchivo}" 
                                data-titulo="${item.titulo}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary btn-edit" 
                                data-id="${item.id}" data-titulo="${item.titulo}" 
                                data-resumen="${item.resumen}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-delete" 
                                data-id="${item.id}" data-tipo="${item.tipo}" 
                                data-contenido="${item.contenido}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error al cargar elementos:", error);
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarElementos);


window.cerrarModales = () => {
    document.querySelectorAll('.vault-modal, .vault-overlay').forEach(el => el.classList.remove('show'));
    document.getElementById('viewContent').innerHTML = ''; // Limpiar visor
};

// --- BUSCADOR ---
document.getElementById("inputBuscar").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll(".item-card").forEach((tarjeta) => {
        const text =
            tarjeta.innerText.toLowerCase() +
            (tarjeta.getAttribute("data-tags") || "").toLowerCase();
        tarjeta.style.display = text.includes(term) ? "flex" : "none";
    });
});

// --- SUBIDA DE DATOS ---
const btn = document.getElementById("btnGuardar");
const inputTexto = document.getElementById("inputTexto");
const inputArchivo = document.getElementById("inputArchivo");
document
    .getElementById("btnFileTrigger")
    .addEventListener("click", () => inputArchivo.click());

// --- AUTO-EXPAND TEXTAREA ---
inputTexto.addEventListener("input", function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

btn.addEventListener("click", async () => {
    const file = inputArchivo.files[0];
    const texto = inputTexto.value;

    // Si no hay nada que guardar, no hacemos nada
    if (!file && !texto) return;

    // 1. Bloquear botón y mostrar Spinner
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Cargando...';
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.cursor = "not-allowed";

    try {
        if (file) {
            const formData = new FormData();
            formData.append("archivo", file);

            const response = await fetch(`${API_URL}/subir-archivo`, {
                method: "POST",
                body: formData,
            });
            if (response.ok) location.reload();
        } else if (texto) {
            const response = await fetch(`${API_URL}/guardar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texto }),
            });
            if (response.ok) location.reload();
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Hubo un error de conexión al guardar.");
    } finally {
        // 2. Restaurar botón (por si falla, si tiene éxito la página se recargará sola)
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
});
// --- MENÚ 3 PUNTOS Y ACCIONES ---
document.addEventListener("click", async (e) => {
    // 1. Mostrar/Ocultar Menú
    const isMenuBtn = e.target.closest(".btn-menu");
    document.querySelectorAll(".dropdown").forEach((d) => {
        if (!isMenuBtn || d.id !== `drop-${isMenuBtn.dataset.id}`)
            d.classList.remove("show");
    });
    if (isMenuBtn) {
        document
            .getElementById(`drop-${isMenuBtn.dataset.id}`)
            .classList.toggle("show");
    }

    // 2. Acción Compartir
    const btnShare = e.target.closest(".btn-share");
    if (btnShare) {
        const url = btnShare.dataset.url;
        if (navigator.share) {
            navigator.share({ title: "OmniVault", url: url }).catch(() => { });
        } else {
            navigator.clipboard.writeText(url);
            alert("Enlace copiado al portapapeles");
        }
    }

    // 3. Acción Eliminar
    const btnDelete = e.target.closest('.btn-delete');
    if (btnDelete) {
        activeItem = { id: btnDelete.dataset.id, tipo: btnDelete.dataset.tipo, contenido: btnDelete.dataset.contenido };
        document.getElementById('vaultOverlay').classList.add('show');
        document.getElementById('modalDelete').classList.add('show');
    }

    const fileIndicator = document.getElementById("fileIndicator");

    // Escuchar cuando el usuario selecciona un archivo
    inputArchivo.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            const fileName = e.target.files[0].name;

            // Mostrar pastilla y cambiar color del clip
            fileIndicator.style.display = "block";
            btnFileTrigger.style.borderColor = "#10b981";

            // Mostrar el nombre del archivo en el input y bloquearlo
            inputTexto.value = `📎 ${fileName}`;
            inputTexto.setAttribute("readonly", "true");
            inputTexto.style.backgroundColor = "#ecfdf5"; // Fondo verde muy claro
            inputTexto.style.color = "#065f46";
        } else {
            // Restaurar todo si cancela
            fileIndicator.style.display = "none";
            btnFileTrigger.style.borderColor = "var(--border)";

            inputTexto.value = "";
            inputTexto.removeAttribute("readonly");
            inputTexto.style.backgroundColor = "#f9fafb";
            inputTexto.style.color = "var(--text-main)";
        }
    });

    // 4. Acción Editar (Usando prompt nativo por ahora para no romper CSS)
    const btnEdit = e.target.closest(".btn-edit");
    if (btnEdit) {
        activeItem.id = btnEdit.dataset.id;
        document.getElementById('editTitulo').value = btnEdit.dataset.titulo || '';
        document.getElementById('editResumen').value = btnEdit.dataset.resumen || '';
        document.getElementById('vaultOverlay').classList.add('show');
        document.getElementById('modalEdit').classList.add('show');
    }



    // --- 5. ACCIÓN RE-ANALIZAR (IA) ---
    const btnReanalyze = e.target.closest(".btn-reanalyze");
    if (btnReanalyze) {
        const id = btnReanalyze.dataset.id;
        const tipo = btnReanalyze.dataset.tipo;
        const contenido = btnReanalyze.dataset.contenido;

        // 1. Cambiar texto a "Analizando..." para dar feedback visual
        const cardTitle = document.querySelector(`.item-card[data-tags*="id-${id}"] .card-title`);
        const cardDesc = document.querySelector(`.item-card[data-tags*="id-${id}"] .card-desc`);
        const originalText = cardTitle.innerText; // Guardamos el título original

        cardTitle.innerText = "🧠 Analizando con IA...";
        cardDesc.innerText = "Por favor, espera.";

        try {
            // Llamamos a la nueva ruta del backend
            const res = await fetch(`${API_URL}/item/${id}/reanalizar`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tipo, contenido }),
            });

            if (res.ok) {
                location.reload(); // Recargamos para ver el resultado
            } else {
                throw new Error("Error del servidor");
            }
        } catch (error) {
            console.error("Error re-analizando:", error);
            cardTitle.innerText = "Error Analizando";
            cardDesc.innerText = "Intenta de nuevo más tarde.";
            // Si falla, podrías restaurar el texto original o dejarlo así
            // setTimeout(() => { cardTitle.innerText = originalText; cardDesc.innerText = "Análisis fallido"; }, 2000);
        }
    }

    // 6. Acción Copiar Nota
    const btnCopy = e.target.closest('.btn-copy');
    if (btnCopy) {
        const textToCopy = btnCopy.dataset.text;
        navigator.clipboard.writeText(textToCopy);

        // Feedback visual temporal
        const originalHtml = btnCopy.innerHTML;
        btnCopy.innerHTML = '<i class="bi bi-check2-all"></i> ¡Copiado!';
        btnCopy.style.background = '#d1fae5'; // Verde claro
        btnCopy.style.color = '#065f46';

        setTimeout(() => {
            btnCopy.innerHTML = originalHtml;
            btnCopy.style.background = '';
            btnCopy.style.color = '';
        }, 2000);
    }

    // 7. Acción Descargar Archivo o Imagen
    const btnDownload = e.target.closest('.btn-download');
    if (btnDownload) {
        e.preventDefault();
        const url = btnDownload.dataset.url;
        // Ahora usamos el nombre exacto del archivo con su extensión original
        const name = btnDownload.dataset.name || 'descarga_omnivault';

        // Feedback visual
        const originalHtml = btnDownload.innerHTML;
        btnDownload.innerHTML = '⏳ Descargando...';
        btnDownload.disabled = true;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error al descargar:", error);
            alert("No se pudo forzar la descarga. Se abrirá en una pestaña nueva.");
            window.open(url, '_blank');
        } finally {
            btnDownload.innerHTML = originalHtml;
            btnDownload.disabled = false;
        }
    }

    // 8. Acción Ver (Abre Modal Visor)
    const btnView = e.target.closest('.btn-view');
    if (btnView) {
        const { tipo, contenido, url, titulo } = btnView.dataset;
        document.getElementById('viewTitle').innerText = titulo || 'Visualización';
        const viewContent = document.getElementById('viewContent');

        if (tipo === 'nota') {
            viewContent.innerHTML = `<p style="white-space: pre-wrap; line-height: 1.6; font-size: 1rem;">${contenido}</p>`;
        } else if (tipo === 'imagen') {
            viewContent.innerHTML = `<img src="${url}" style="width: 100%; border-radius: 8px;" />`;
        } else if (tipo === 'archivo' && contenido.toLowerCase().endsWith('.pdf')) {
            viewContent.innerHTML = `<iframe src="${url}" style="width: 100%; height: 60vh; border: none;"></iframe>`;
        } else if (tipo === 'link') {
            viewContent.innerHTML = `<a href="${contenido}" target="_blank" style="color: var(--primary);">${contenido}</a>`;
        } else {
            viewContent.innerHTML = `<p style="color: var(--text-muted);">Vista previa no disponible. Por favor, descarga el archivo.</p>`;
        }
        document.getElementById('vaultOverlay').classList.add('show');
        document.getElementById('modalView').classList.add('show');

    }

    // --- CONFIRMACIONES DE MODALES ---
    document.getElementById('btnConfirmDelete')?.addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerHTML = 'Eliminando...'; btn.disabled = true;
        try {
            const res = await fetch(`${API_URL}/item/${activeItem.id}`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: activeItem.tipo, contenido: activeItem.contenido })
            });
            if (res.ok) location.reload();
        } catch (err) { console.error(err); }
    });

    document.getElementById('btnConfirmEdit')?.addEventListener('click', async (e) => {
        const btn = e.target;
        const titulo = document.getElementById('editTitulo').value;
        const resumen = document.getElementById('editResumen').value;
        btn.innerHTML = 'Guardando...'; btn.disabled = true;
        try {
            const res = await fetch(`${API_URL}/item/${activeItem.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, resumen })
            });
            if (res.ok) location.reload();
        } catch (err) { console.error(err); }
    });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW no registrado', err));
  });
}