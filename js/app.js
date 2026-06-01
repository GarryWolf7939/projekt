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
    const assistOverlay = document.getElementById('assist-overlay');

    // Stan
    let isTargetFound = false;
    let assistModeActive = false;

    // Aktualizacja widoczności przycisków markerów
    function updateMarkersVisibility() {
        if (!buttonsContainer) return;
        if (isTargetFound || assistModeActive) {
            buttonsContainer.classList.add('visible');
        } else {
            buttonsContainer.classList.remove('visible');
        }
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

    // Baza danych markerów (bez zmian)
    const carData = {
        markers: [
            { id: "oil", label: "Wlew oleju", color: "#ffee00", position: "-0.4 0.1 0.1", desc: "Pamiętaj, aby poziom oleju był zawsze między MIN a MAX. Używaj oleju zalecanego przez producenta samochodu.", icon: "assets/oil.png" },
            { id: "oil_dipstick", label: "Bagnet oleju", color: "#f3a702", position: "-0.3 0.07 0.1", desc: "Bagnet służy do sprawdzania poziomu oleju. Pamiętaj aby samochód stał na poziomym terenie oraz silnik był zimny.", icon: "assets/bagnet_oleju.png" },
            { id: "washer", label: "Płyn spryskiwaczy", color: "#00BFFF", position: "0.5 -0.2 0", desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.", icon: "assets/washer.png" },
            { id: "coolant", label: "Płyn chłodniczy", color: "#FF4500", position: "0.1 0.4 0.1", desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.", icon: "assets/coolant.png" }
        ]
    };

    // Generowanie kulek 3D i przycisków markerów (prawe kółka)
    carData.markers.forEach((marker) => {
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position);
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('radius', '0.02');
        sphere.setAttribute('color', marker.color);
        wrapper.appendChild(sphere);
        anchor.appendChild(wrapper);

        const btn = document.createElement('div');
        btn.className = 'ui-marker-btn';
        btn.style.backgroundColor = marker.color;
        const img = document.createElement('img');
        img.src = marker.icon;
        btn.appendChild(img);
        btn.addEventListener('click', (evt) => {
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
        buttonsContainer.appendChild(btn);
    });

    // Zamknięcie panelu
    closeBtn.addEventListener('click', () => {
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Kliknięcie poza panelem
    window.addEventListener('click', (e) => {
        if (!e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn') && e.target.id !== 'flashlight-btn' && e.target.id !== 'assist-mode-btn') {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    // Eventy AR
    anchor.addEventListener("targetFound", () => {
        isTargetFound = true;
        updateMarkersVisibility();
    });

    anchor.addEventListener("targetLost", () => {
        isTargetFound = false;
        updateMarkersVisibility();
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
                const video = document.querySelector('video');
                if (!video || !video.srcObject) {
                    alert("Kamera się ładuje...");
                    return;
                }
                const track = video.srcObject.getVideoTracks()[0];
                const caps = track.getCapabilities?.();
                if (!caps?.torch) {
                    alert("Twoja przeglądarka nie obsługuje latarki.");
                    return;
                }
                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
                flashlightBtn.classList.toggle('active', isTorchOn);
            } catch (err) { console.error(err); }
        });
    }

    // Odświeżanie przy zmianie orientacji
    window.addEventListener("orientationchange", () => {
        setTimeout(() => location.reload(), 500);
    });

    // Swipe w dół na panelu
    let startY = 0;
    if (infoPanel) {
        infoPanel.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
        infoPanel.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            if (endY > startY + 50) {
                infoPanel.classList.remove('visible');
                infoPanel.classList.add('hidden');
            }
        }, { passive: true });
    }

    // ==================== TRYB ASYSTY ====================
    if (assistModeBtn && assistOverlay) {
        assistModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            assistModeActive = !assistModeActive;
            if (assistModeActive) {
                assistModeBtn.classList.add('active');
                assistOverlay.classList.add('active');  // obrazek staje się widoczny
            } else {
                assistModeBtn.classList.remove('active');
                assistOverlay.classList.remove('active');
            }
            // Przyciski markerów pojawiają się lub znikają razem z asystą (o ile target nie jest wykryty)
            updateMarkersVisibility();
        });
    }
});