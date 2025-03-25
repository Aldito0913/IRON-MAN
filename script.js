document.addEventListener("DOMContentLoaded", function () {
    cargarInventario();
    mostrarTotalesPorHangar(); // Mostrar totales al cargar la página
});

document.getElementById("inventarioForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let placa = document.getElementById("placa").value.trim();
    let fecha = document.getElementById("fecha").value;
    let estructura = document.getElementById("estructura").value.trim();
    let tipo = document.getElementById("tipo").value;
    let hangar = document.getElementById("hangar").value;

    // Validar que todos los campos estén llenos
    if (!placa || !fecha || !estructura || !tipo || !hangar) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    let cantidad = extraerCantidad(estructura); // Extraer la cantidad de estructuras
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    // Verificar si el registro ya existe (por placa y fecha)
    let existe = inventario.some(item => item.placa === placa && item.fecha === fecha);
    if (existe) {
        alert("Este registro ya existe en el inventario.");
        return;
    }

    inventario.push({ placa, fecha, estructura, tipo, hangar, cantidad });

    localStorage.setItem("inventario", JSON.stringify(inventario));

    cargarInventario();
    mostrarTotalesPorHangar();  // Actualizar los totales por hangar
    document.getElementById("inventarioForm").reset();
    resetTipo();
});

function detectarTipo() {
    let estructura = document.getElementById("estructura").value.trim().toLowerCase();
    let tipoInput = document.getElementById("tipo");

    let esMontaje = /\bmontaje\b/.test(estructura);
    let esModificacion = /\bmodificación\b/.test(estructura);
    let esDesmontaje = /\bdesmontaje\b/.test(estructura);

    if (esMontaje && !esModificacion && !esDesmontaje) {
        tipoInput.value = "Montaje";
        bloquearTipo();
    } else if (esModificacion && !esMontaje && !esDesmontaje) {
        tipoInput.value = "Modificación";
        bloquearTipo();
    } else if (esDesmontaje && !esMontaje && !esModificacion) {
        tipoInput.value = "Desmontaje";
        bloquearTipo();
    } else {
        tipoInput.value = "";
        desbloquearTipo();
    }
}

function bloquearTipo() {
    let tipoInput = document.getElementById("tipo");
    tipoInput.style.backgroundColor = "#28a745";
    tipoInput.style.color = "#fff";
    tipoInput.disabled = true;
}

function desbloquearTipo() {
    let tipoInput = document.getElementById("tipo");
    tipoInput.style.backgroundColor = "";
    tipoInput.style.color = "";
    tipoInput.disabled = false;
}

function resetTipo() {
    desbloquearTipo();
}

function cargarInventario() {
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    let container = document.getElementById("inventarioContainer");

    container.innerHTML = "";

    inventario.forEach((item, index) => {
        let card = `
            <div class="col-md-6">
                <div class="card p-3">
                    <h5>${item.placa} <span class="badge ${getBadgeClass(item.tipo)}">${item.tipo}</span></h5>
                    <p><strong>Fecha:</strong> ${item.fecha}</p>
                    <p><strong>Estructura:</strong> ${item.estructura}</p>
                    <p><strong>Hangar:</strong> ${item.hangar}</p>
                    <p><strong>Cantidad:</strong> ${item.cantidad}</p>
                    <button class="btn btn-danger btn-sm" onclick="eliminarRegistro(${index})">Eliminar</button>
                </div>
            </div>`;
        container.innerHTML += card;
    });
}

function getBadgeClass(tipo) {
    return tipo === "Modificación" ? "bg-warning" : tipo === "Montaje" ? "bg-success" : "bg-danger";
}

function mostrarTotalesPorHangar() {
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    let totalesPorHangar = {
        "1": { "Modificación": 0, "Montaje": 0, "Desmontaje": 0 },
        "2": { "Modificación": 0, "Montaje": 0, "Desmontaje": 0 },
        "3": { "Modificación": 0, "Montaje": 0, "Desmontaje": 0 },
        "4": { "Modificación": 0, "Montaje": 0, "Desmontaje": 0 },
        "5": { "Modificación": 0, "Montaje": 0, "Desmontaje": 0 },
        "6": { "Modificación": 0, "Montaje": 0, "Desmontaje": 0 }
    };

    let totalEstructuras = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };

    inventario.forEach(item => {
        let cantidad = parseInt(item.cantidad) || 1;
        let hangar = item.hangar;
        let tipo = item.tipo;

        if (totalesPorHangar[hangar]) {
            if (tipo === "Desmontaje") {
                totalesPorHangar[hangar]["Desmontaje"] += cantidad;
                totalesPorHangar[hangar]["Montaje"] = Math.max(0, totalesPorHangar[hangar]["Montaje"] - cantidad);
            } else if (tipo === "Montaje") {
                totalesPorHangar[hangar]["Montaje"] += cantidad;
            } else {
                totalesPorHangar[hangar]["Modificación"] += cantidad;
            }

            totalEstructuras[hangar] = totalesPorHangar[hangar]["Montaje"];
        }
    });

    for (let hangar in totalesPorHangar) {
        document.getElementById(`hangar${hangar}-mod`).innerText = totalesPorHangar[hangar]["Modificación"];
        document.getElementById(`hangar${hangar}-mont`).innerText = totalesPorHangar[hangar]["Montaje"];
        document.getElementById(`hangar${hangar}-desmont`).innerText = totalesPorHangar[hangar]["Desmontaje"];
        document.getElementById(`hangar${hangar}-total`).innerText = totalEstructuras[hangar];
    }
}

function extraerCantidad(estructura) {
    let match = estructura.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

function eliminarRegistro(index) {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
        let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
        inventario.splice(index, 1);
        localStorage.setItem("inventario", JSON.stringify(inventario));

        cargarInventario();
        mostrarTotalesPorHangar();
    }
}
function filtrarInventario() {
    let filtro = document.getElementById("buscar").value.toLowerCase();
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    let container = document.getElementById("inventarioContainer");

    container.innerHTML = "";

    let resultados = inventario.filter(item =>
        item.placa.toLowerCase().includes(filtro) ||
        item.estructura.toLowerCase().includes(filtro)
    );

    resultados.forEach((item, index) => {
        let card = `
            <div class="col-md-6">
                <div class="card p-3">
                    <h5>${item.placa} <span class="badge ${getBadgeClass(item.tipo)}">${item.tipo}</span></h5>
                    <p><strong>Fecha:</strong> ${item.fecha}</p>
                    <p><strong>Estructura:</strong> ${item.estructura}</p>
                    <p><strong>Hangar:</strong> ${item.hangar}</p>
                    <p><strong>Cantidad:</strong> ${item.cantidad}</p>
                    <button class="btn btn-danger btn-sm" onclick="eliminarRegistro(${index})">Eliminar</button>
                </div>
            </div>`;
        container.innerHTML += card;
    });
}

// Función para la búsqueda en tiempo real
function buscarInventario() {
    let filtro = document.getElementById("busqueda").value.toLowerCase();
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    let container = document.getElementById("inventarioContainer");

    container.innerHTML = "";
    
    let resultados = inventario.filter(item =>
        item.placa.toLowerCase().includes(filtro) ||
        item.estructura.toLowerCase().includes(filtro)
    );

    resultados.forEach((item, index) => {
        let card = `
            <div class="col-md-6">
                <div class="card p-3">
                    <h5>${item.placa} <span class="badge ${getBadgeClass(item.tipo)}">${item.tipo}</span></h5>
                    <p><strong>Fecha:</strong> ${item.fecha}</p>
                    <p><strong>Estructura:</strong> ${item.estructura}</p>
                    <p><strong>Hangar:</strong> ${item.hangar}</p>
                    <p><strong>Cantidad:</strong> ${item.cantidad}</p>
                    <button class="btn btn-danger btn-sm" onclick="eliminarRegistro(${index})">Eliminar</button>
                </div>
            </div>`;
        container.innerHTML += card;
    });
}

function exportarExcel() {
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    let ws = XLSX.utils.json_to_sheet(inventario);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Inventario.xlsx");
}
