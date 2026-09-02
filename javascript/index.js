const carpeta = "360/";
    let viewer;
    let imagenes = [];
    let indexActual = 0;
    let yaw = 0;
    let pitch = 0;
    let animacion;
    let reinicioTimeout;
    let cambioImagenIntervalo;
    let autoPlayActivo = true;
    let velocidadRotacion = 0.2;
    let duracionImagen = 20000;
    let intensidadPitch = 10;
    let progresoInterval;
    let tiempoTranscurrido = 0;

    // 📥 Cargar JSON
    fetch('imagenes.json')
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log('✅ JSON cargado:', data);
            imagenes = data;
            document.getElementById('totalImages').textContent = imagenes.length;
            
            // IMPORTANTE: Inicializar TODO después de cargar las imágenes
            iniciarVisor();
            generarMiniaturas();
            actualizarInfo();
            iniciarMovimiento();
            iniciarCambioImagen();
            iniciarBarraProgreso();
            
            document.getElementById('loading').style.display = 'none';
            mostrarToast(`✅ ${imagenes.length} imágenes cargadas`);
        })
        .catch(error => {
            console.error('❌ Error cargando imagenes.json:', error);
            document.getElementById('loading').innerHTML = `
                <div style="text-align: center; color: #ff4444;">
                    <h3>❌ Error al cargar las imágenes</h3>
                    <p style="font-size: 14px; margin-top: 10px;">
                        Verifica que el archivo 'imagenes.json' existe<br>
                        y está en el mismo directorio que este HTML.
                    </p>
                    <p style="font-size: 12px; margin-top: 10px; color: #999;">
                        ${error.message}
                    </p>
                </div>
            `;
        });

    // 🎬 Inicializar visor
    function iniciarVisor(index = 0) {
        if (imagenes.length === 0) {
            console.error('❌ No hay imágenes para cargar');
            return;
        }

        console.log('🎬 Inicializando visor con:', carpeta + imagenes[index]);
        
        viewer = pannellum.viewer('panorama', {
            type: 'equirectangular',
            panorama: carpeta + imagenes[index],
            autoLoad: true,
            showControls: true,
            mouseZoom: true,
            draggable: true,
            compass: true,
            northOffset: 0,
            hfov: 100,
            minHfov: 50,
            maxHfov: 120
        });

        viewer.on('load', () => {
            console.log('✅ Imagen cargada:', imagenes[indexActual]);
        });

        viewer.on('error', (err) => {
            console.error('❌ Error cargando panorama:', err);
            mostrarToast(`❌ Error cargando: ${imagenes[indexActual]}`);
        });
    }

    // 🖼️ Generar miniaturas en el sidebar
    function generarMiniaturas() {
        const lista = document.getElementById('thumbnailList');
        lista.innerHTML = '';

        if (imagenes.length === 0) {
            lista.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No hay imágenes disponibles</p>';
            return;
        }

        imagenes.forEach((img, i) => {
            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            if (i === 0) item.classList.add('active');
            item.dataset.index = i;

            item.innerHTML = `
                <img src="${carpeta + img}" alt="Imagen ${i + 1}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23666%22>Error</text></svg>'">
                <div class="label">
                    <span class="number">#${i + 1}</span>
                    <span>${img}</span>
                </div>
            `;

            item.onclick = () => cargarImagen(i);
            lista.appendChild(item);
        });

        console.log(`✅ ${imagenes.length} miniaturas generadas`);
    }

    // 🔄 Cargar imagen específica
    function cargarImagen(index) {
        if (index < 0 || index >= imagenes.length) {
            console.error('❌ Índice fuera de rango:', index);
            return;
        }

        indexActual = index;
        
        console.log(`🔄 Cargando imagen ${index + 1}:`, carpeta + imagenes[index]);

        detenerMovimiento();
        detenerCambioImagen();
        detenerBarraProgreso();

        if (viewer && typeof viewer.destroy === 'function') {
            viewer.destroy();
        }
        iniciarVisor(indexActual);

        actualizarInfo();
        actualizarMiniaturaActiva();
        reiniciarProgreso();

        if (autoPlayActivo) {
            iniciarMovimiento();
            iniciarCambioImagen();
            iniciarBarraProgreso();
        }

        mostrarToast(`🖼️ Imagen ${index + 1} de ${imagenes.length}`);
    }

    // 📊 Actualizar información
    function actualizarInfo() {
        document.getElementById('imageName').textContent = imagenes[indexActual];
        document.getElementById('imageCounter').textContent = `${indexActual + 1} de ${imagenes.length}`;
        document.getElementById('currentIndex').textContent = indexActual + 1;
    }

    // ✨ Actualizar miniatura activa
    function actualizarMiniaturaActiva() {
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            item.classList.toggle('active', i === indexActual);
        });
    }

    // ⏭️ Siguiente imagen
    function siguiente() {
        indexActual = (indexActual + 1) % imagenes.length;
        cargarImagen(indexActual);
    }

    // ⏮️ Anterior imagen
    function anterior() {
        indexActual = (indexActual - 1 + imagenes.length) % imagenes.length;
        cargarImagen(indexActual);
    }

    // 🎥 Movimiento tipo dron
    function iniciarMovimiento() {
        detenerMovimiento();

        animacion = setInterval(() => {
            yaw += velocidadRotacion;
            pitch = intensidadPitch * Math.sin(yaw * 0.05);

            viewer.setYaw(yaw);
            viewer.setPitch(pitch);
        }, 30);
    }

    function detenerMovimiento() {
        clearInterval(animacion);
    }

    // 🔄 Cambio automático de imágenes
    function iniciarCambioImagen() {
        if (!autoPlayActivo || imagenes.length <= 1) return;
        
        detenerCambioImagen();
        
        cambioImagenIntervalo = setInterval(() => {
            siguiente();
        }, duracionImagen);
    }

    function detenerCambioImagen() {
        clearInterval(cambioImagenIntervalo);
    }

    // ⏯️ Toggle autoplay
    function toggleAutoPlay() {
        autoPlayActivo = !autoPlayActivo;
        const btn = document.getElementById('playPauseBtn');
        
        if (autoPlayActivo) {
            btn.textContent = '⏸';
            btn.title = 'Pausar';
            iniciarMovimiento();
            iniciarCambioImagen();
            iniciarBarraProgreso();
            mostrarToast('▶️ Reproducción automática activada');
        } else {
            btn.textContent = '▶';
            btn.title = 'Reproducir';
            detenerMovimiento();
            detenerCambioImagen();
            detenerBarraProgreso();
            mostrarToast('⏸ Reproducción automática pausada');
        }
    }

    // 📊 Barra de progreso
    function iniciarBarraProgreso() {
        detenerBarraProgreso();
        tiempoTranscurrido = 0;
        
        progresoInterval = setInterval(() => {
            tiempoTranscurrido += 100;
            const porcentaje = (tiempoTranscurrido / duracionImagen) * 100;
            document.getElementById('progressBar').style.width = porcentaje + '%';
            
            if (porcentaje >= 100) {
                reiniciarProgreso();
            }
        }, 100);
    }

    function detenerBarraProgreso() {
        clearInterval(progresoInterval);
    }

    function reiniciarProgreso() {
        tiempoTranscurrido = 0;
        document.getElementById('progressBar').style.width = '0%';
    }

    // 🔄 Reiniciar vista
    function reiniciarVista() {
        yaw = 0;
        pitch = 0;
        viewer.setYaw(0);
        viewer.setPitch(0);
        viewer.setHfov(100);
        mostrarToast('🔄 Vista reiniciada');
    }

    // ⏱ Reinicio después de interacción
    function reiniciarLuego() {
        clearTimeout(reinicioTimeout);

        reinicioTimeout = setTimeout(() => {
            if (autoPlayActivo) {
                iniciarMovimiento();
                iniciarCambioImagen();
                iniciarBarraProgreso();
            }
        }, 4000);
    }

    // 🖱 Eventos usuario
    const visor = document.getElementById('panorama');

    visor.addEventListener('mousedown', () => {
        detenerMovimiento();
        detenerCambioImagen();
        detenerBarraProgreso();
        reiniciarLuego();
    });

    visor.addEventListener('wheel', () => {
        detenerMovimiento();
        detenerCambioImagen();
        detenerBarraProgreso();
        reiniciarLuego();
    });

    visor.addEventListener('touchstart', () => {
        detenerMovimiento();
        detenerCambioImagen();
        detenerBarraProgreso();
        reiniciarLuego();
    });

    // 📱 Toggle Sidebar
    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
    }

    // ⚙️ Toggle Settings
    function toggleSettings() {
        document.getElementById('settingsPanel').classList.toggle('open');
    }

    // ⚙️ Cambiar configuración
    function cambiarVelocidad(valor) {
        velocidadRotacion = parseFloat(valor);
        document.getElementById('speedValue').textContent = valor;
        if (autoPlayActivo) {
            iniciarMovimiento();
        }
    }

    function cambiarDuracion(valor) {
        duracionImagen = parseInt(valor) * 1000;
        document.getElementById('durationValue').textContent = valor + 's';
        if (autoPlayActivo) {
            iniciarCambioImagen();
            iniciarBarraProgreso();
        }
    }

    function cambiarPitch(valor) {
        intensidadPitch = parseInt(valor);
        document.getElementById('pitchValue').textContent = valor;
    }

    // 🔔 Mostrar toast
    function mostrarToast(mensaje) {
        const toast = document.getElementById('toast');
        toast.textContent = mensaje;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ⌨️ Atajos de teclado
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowRight':
                siguiente();
                break;
            case 'ArrowLeft':
                anterior();
                break;
            case ' ':
                e.preventDefault();
                toggleAutoPlay();
                break;
            case 'r':
            case 'R':
                reiniciarVista();
                break;
            case 'g':
            case 'G':
                toggleSidebar();
                break;
        }
    });

    // Inicialización
    console.log('🎬 Visor 360° Profesional v2.0');