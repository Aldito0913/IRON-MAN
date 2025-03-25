// Función para cargar el archivo Excel
document.getElementById('subirExcel').addEventListener('change', cargarDesdeExcel);

function cargarDesdeExcel() {
    const archivo = document.getElementById('subirExcel').files[0];
    
    if (!archivo) {
        alert("Por favor, selecciona un archivo Excel.");
        return;
    }

    const lector = new FileReader();
    
    lector.onload = function(e) {
        const datos = e.target.result;
        const libro = XLSX.read(datos, { type: 'binary' });
        const primeraHoja = libro.Sheets[libro.SheetNames[0]];
        const datosJSON = XLSX.utils.sheet_to_json(primeraHoja, { header: 1 });

        // Validar que el archivo tenga datos
        if (datosJSON.length < 2) {
            alert("El archivo Excel no tiene datos válidos.");
            return;
        }

        // Convertir los datos del Excel en formato de inventario
        let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

        datosJSON.slice(1).forEach(fila => {
            if (fila.length < 6) return; // Asegurar que la fila tiene suficientes columnas

            let nuevoRegistro = {
                placa: fila[0]?.trim() || "",
                fecha: fila[1] || "",
                estructura: fila[2]?.trim() || "",
                tipo: fila[3]?.trim() || "",
                hangar: fila[4]?.toString() || "",
                cantidad: parseInt(fila[5]) || 1
            };

            // Verificar si el registro ya existe (por placa y fecha)
            let existe = inventario.some(item => item.placa === nuevoRegistro.placa && item.fecha === nuevoRegistro.fecha);
            if (!existe) {
                inventario.push(nuevoRegistro);
            }
        });

        localStorage.setItem("inventario", JSON.stringify(inventario));
        cargarInventario();
        mostrarTotalesPorHangar();
    };

    lector.readAsBinaryString(archivo);
}

// Función para mostrar los datos en la tabla
document.addEventListener("DOMContentLoaded", function () {
    cargarInventario();
    mostrarTotalesPorHangar();
});

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

function mostrarTotalesPorHangar() {
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    let totalesPorHangar = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
    
    inventario.forEach(item => {
        let cantidad = parseInt(item.cantidad) || 1;
        let hangar = item.hangar;
        if (totalesPorHangar[hangar] !== undefined) {
            totalesPorHangar[hangar] += cantidad;
        }
    });

    for (let hangar in totalesPorHangar) {
        document.getElementById(`hangar${hangar}-total`).innerText = totalesPorHangar[hangar];
    }
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

// Función para exportar a Excel solo el hangar seleccionado
function exportarExcel() {
    let hangarSeleccionado = document.getElementById("hangarSelect").value;
    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    // Filtrar inventario por hangar si se seleccionó uno
    if (hangarSeleccionado) {
        inventario = inventario.filter(item => item.hangar === hangarSeleccionado);
    }

    if (inventario.length === 0) {
        alert("No hay registros para exportar en el hangar seleccionado.");
        return;
    }

    // Convertir datos a formato Excel
    let ws = XLSX.utils.json_to_sheet(inventario);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");

    // Descargar archivo con el nombre adecuado
    XLSX.writeFile(wb, `Inventario_Hangar${hangarSeleccionado || "Todos"}.xlsx`);
}

function getBadgeClass(tipo) {
    return tipo === "Modificación" ? "bg-warning" : tipo === "Montaje" ? "bg-success" : "bg-danger";
}
