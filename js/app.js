document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');
    const splashScreen = document.getElementById('splash-screen');
    const startBtn = document.getElementById('start-btn');
    const sceneEl = document.querySelector('a-scene');
    const assistModeBtn = document.getElementById('assist-mode-btn');
    const markersOnScreen = document.getElementById('markers-on-screen');
    const centerDot = document.getElementById('center-dot');
    const cameraDimOverlay = document.getElementById('camera-dim-overlay');

    // --- POMOCNICZE FUNKCJE DO UKRYWANIA/POKAZYWANIA UI MINDAR ---
    let mindarUIElements = null;

    function getMindarUIElements() {
        // Szukamy elementów interfejsu MindAR – mogą to być divy z klasami:
        return document.querySelectorAll('.mindar-ui-loading, .mindar-ui-progress, .mindar-ui-overlay, .mindar-ui-panel, .mindar-ui-message');
    }

    function hideMindarUI() {
        const elements = getMindarUIElements();
        if (elements.length) {
            mindarUIElements = [];
            elements.forEach(el => {
                mindarUIElements.push({
                    el: el,
                    display: el.style.display
                });
                el.style.display = 'none';
            });
        } else {
            // Jeśli jeszcze nie istnieją, ustawiamy obserwatora, który ukryje je gdy się pojawią
            const observer = new MutationObserver(() => {
                const newElements = getMindarUIElements();
                if (newElements.length) {
                    newElements.forEach(el => el.style.display = 'none');
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            mindarUIElements = observer; // zapisujemy do późniejszego ewentualnego rozłączenia
        }
    }

    function showMindarUI() {
        if (mindarUIElements && Array.isArray(mindarUIElements)) {
            mindarUIElements.forEach(({ el, display }) => {
                el.style.display = display || '';
            });
            mindarUIElements = null;
        } else if (mindarUIElements && mindarUIElements.disconnect) {
            // to był observer
            mindarUIElements.disconnect();
            mindarUIElements = null;
        }
        // Ponadto odświeżamy, aby MindAR mógł ponownie pokazać UI (jeśli sam je odtworzy)
    }

    // --- LOGIKA EKRANU POWITALNEGO ---
    if (sessionStorage.getItem('arGhostStarted') === 'true') {
        splashScreen.classList.add('hidden');
        setTimeout(() => {
            sceneEl.systems["mindar-image-system"].start();
        }, 100);
    }

    startBtn.addEventListener('click', () => {
        sessionStorage.setItem('arGhostStarted', 'true');
        splashScreen.classList.add('hidden');
        sceneEl.systems["mindar-image-system"].start();
    });

    // Baza danych markerów
    const carData = {
        markers: [
            { id: "oil", label: "Wlew oleju", color: "#ffee00", position: "-0.4 0.1 0.1", desc: "Pamiętaj, aby poziom oleju był zawsze między MIN a MAX. Używaj oleju zalecanego przez producenta samochodu.", icon: "assets/oil.png" },
            { id: "oil_dipstick", label: "Bagnet oleju", color: "#f3a702", position: "-0.3 0.07 0.1", desc: "Bagnet służy do sprawdzania poziomu oleju. Pamiętaj aby samochód stał na poziomym terenie oraz silnik był zimny. Wyciągnij go, wytrzyj, włóż z powrotem i ponownie wyciągnij, aby odczytać poziom.", icon: "assets/bagnet_oleju.png" },
            { id: "washer", label: "Płyn spryskiwaczy", color: "#00BFFF", position: "0.5 -0.2 0", desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.", icon: "assets/washer.png" },
            { id: "coolant", label: "Płyn chłodniczy", color: "#FF4500", position: "0.1 0.4 0.1", desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.", icon: "assets/coolant.png" }
        ]
    };

    // Generowanie kulek 3D i przycisków markerów
    carData.markers.forEach((marker) => {
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position);
        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.02');
        visualSphere.setAttribute('color', marker.color);
        wrapper.appendChild(visualSphere);
        anchor.appendChild(wrapper);

        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color;
        const imgIcon = document.createElement('img');
        imgIcon.src = marker.icon;
        uiButton.appendChild(imgIcon);
        uiButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            const showNewContent = () => {
                infoTitle.innerText = marker.label;
                infoDesc.innerText = marker.desc;
                infoPanel.classList.remove('hidden');
                infoPanel.classList.add('visible');
            };
            if (infoPanel.classList.contains('visible')) {
                infoPanel.classList.remove('visible');
                infoPanel.classList.add('hidden');
                setTimeout(showNewContent, 300);
            } else {
                showNewContent();
            }
        });
        buttonsContainer.appendChild(uiButton);
    });

    // Zamknięcie panelu
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && e.target.id !== 'assist-mode-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn') && !e.target.closest('.screen-marker')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    anchor.addEventListener("targetFound", () => {
        buttonsContainer.classList.add('visible');
    });

    anchor.addEventListener("targetLost", () => {
        buttonsContainer.classList.remove('visible');
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Latarka
    let isTorchOn = false;
    if (flashlightBtn) {
        flashlightBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const videoElement = document.querySelector('video');
                if (!videoElement || !videoElement.srcObject) {
                    alert("Kamera jeszcze się ładuje!");
                    return;
                }
                const stream = videoElement.srcObject;
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities?.();
                if (!capabilities || !capabilities.torch) {
                    alert("Twoja przeglądarka nie obsługuje latarki.");
                    return;
                }
                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
                flashlightBtn.classList.toggle('active', isTorchOn);
            } catch (err) { console.error("Błąd latarki:", err); }
        });
    }

    window.addEventListener("orientationchange", () => {
        setTimeout(() => location.reload(), 500);
    });

    let startY = 0;
    if (infoPanel) {
        infoPanel.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
        infoPanel.addEventListener('touchend', (e) => {
            let endY = e.changedTouches[0].clientY;
            if (endY > startY + 50) {
                infoPanel.classList.remove('visible');
                infoPanel.classList.add('hidden');
            }
        }, { passive: true });
    }

    // ==================== TRYB ASYSTY ====================
    let assistModeActive = false;

    const screenPositions = {
        oil: { x: 25, y: 40, name: "🛢️ Wlew oleju" },
        oil_dipstick: { x: 35, y: 50, name: "🔧 Bagnet oleju" },
        washer: { x: 75, y: 35, name: "💧 Płyn spryskiwaczy" },
        coolant: { x: 50, y: 65, name: "🌡️ Płyn chłodniczy" }
    };

    function showScreenMarkers() {
        if (!markersOnScreen) return;
        markersOnScreen.innerHTML = "";
        Object.entries(screenPositions).forEach(([id, pos]) => {
            const el = document.createElement('div');
            el.className = 'screen-marker';
            el.id = `marker-${id}`;
            el.innerText = pos.name;
            el.style.left = `${pos.x}%`;
            el.style.top = `${pos.y}%`;
            el.style.transform = 'translate(-50%, -50%)';
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const markerData = carData.markers.find(m => m.id === id);
                if (markerData) {
                    infoTitle.innerText = markerData.label;
                    infoDesc.innerText = markerData.desc;
                    infoPanel.classList.remove('hidden');
                    infoPanel.classList.add('visible');
                    if (navigator.vibrate) navigator.vibrate(50);
                }
            });
            markersOnScreen.appendChild(el);
        });
    }

    function hideScreenMarkers() {
        if (markersOnScreen) markersOnScreen.innerHTML = "";
    }

    // Obsługa przycisku asysty
    if (assistModeBtn) {
        assistModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            assistModeActive = !assistModeActive;
            if (assistModeActive) {
                assistModeBtn.classList.add('active');
                if (centerDot) centerDot.classList.add('visible');
                if (cameraDimOverlay) cameraDimOverlay.classList.add('active');
                showScreenMarkers();
                hideMindarUI();   // UKRYWA UI MINDAR (kółko, napisy)
            } else {
                assistModeBtn.classList.remove('active');
                if (centerDot) centerDot.classList.remove('visible');
                if (cameraDimOverlay) cameraDimOverlay.classList.remove('active');
                hideScreenMarkers();
                showMindarUI();   // PRZYWRACA UI MINDAR
            }
        });
    }
});