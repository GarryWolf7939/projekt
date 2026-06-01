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

    // --- STAN ASYSTY ---
    let isTargetFound = false;
    let assistModeActive = false;

    // Funkcja aktualizująca widoczność przycisków markerów (zależna od targetu lub asysty)
    function updateMarkersVisibility() {
        if (!buttonsContainer) return;
        if (isTargetFound || assistModeActive) {
            buttonsContainer.classList.add('visible');
        } else {
            buttonsContainer.classList.remove('visible');
        }
    }

    // --- BEZPIECZNE URUCHOMIENIE MINDAR (z drugiego kodu) ---
    const safeStartAR = () => {
        const startSystem = () => {
            if (sceneEl.systems && sceneEl.systems["mindar-image-system"]) {
                sceneEl.systems["mindar-image-system"].start();
            } else {
                console.error("System MindAR nie został jeszcze zainicjalizowany!");
            }
        };
        if (sceneEl.hasLoaded) {
            startSystem();
        } else {
            sceneEl.addEventListener("loaded", startSystem);
        }
    };

    // --- LOGIKA EKRANU POWITALNEGO ---
    if (sessionStorage.getItem('arGhostStarted') === 'true') {
        splashScreen.classList.add('hidden');
        safeStartAR();
    }

    startBtn.addEventListener('click', () => {
        sessionStorage.setItem('arGhostStarted', 'true');
        splashScreen.classList.add('hidden');
        safeStartAR();
    });

    // --- BAZA DANYCH (z drugiego kodu – nowe pozycje, dodatkowy marker aq) ---
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Wlew oleju", 
                color: "#ffee00", 
                position: "-0.235 0.07 0.1", 
                desc: "Pamiętaj, aby poziom oleju był zawsze między MIN a MAX. Używaj oleju zalecanego przez producenta samochodu.",
                icon: "assets/oil.png" 
            },
            { 
                id: "oil_dipstick", 
                label: "Bagnet oleju", 
                color: "#f3a702", 
                position: "-0.22 0.01 0.1", 
                desc: "Bagnet służy do sprawdzania poziomu oleju. Pamiętaj, aby samochód stał na poziomym terenie oraz silnik był zimny. Wyciągnij go, wytrzyj, włóż z powrotem i ponownie wyciągnij, aby odczytać poziom.",
                icon: "assets/bagnet_oleju.png" 
            },
            { 
                id: "washer", 
                label: "Płyn spryskiwaczy", 
                color: "#00BFFF", 
                position: "-0.44 -0.03 0.1", 
                desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.",
                icon: "assets/washer.png"
            },
            { 
                id: "coolant", 
                label: "Płyn chłodniczy", 
                color: "#FF4500", 
                position: "-0.38 0.07 0.1", 
                desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.",
                icon: "assets/coolant.png"
            },
            { 
                id: "aq", 
                label: "Akumulator", 
                color: "#8f8c8b", 
                position: "0.24 0.08 -0.3", 
                desc: "W razie awarii, zdejmij pokrywę akumulatora oraz wypnij klemy, najpierw ujemną (czarna), potem dodatnią (czerwona).",
                icon: "assets/aq.png"
            }
        ]
    };

    // --- GENEROWANIE KULEK 3D I PRZYCISKÓW MARKERÓW ---
    carData.markers.forEach((marker) => {
        // Kulka 3D (promień 0.015 – zgodny z drugim kodem)
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 
        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.015'); 
        visualSphere.setAttribute('color', marker.color);
        visualSphere.setAttribute('position', '0 0 0'); 
        wrapper.appendChild(visualSphere);
        anchor.appendChild(wrapper);

        // Przycisk UI (prawe kółko)
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

    // --- ZAMYKANIE PANELU ---
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && e.target.id !== 'assist-mode-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    // --- EVENTY AR (współpraca z asystą) ---
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

    // --- LATARKA ---
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
                const capabilities = track.getCapabilities && track.getCapabilities();
                if (!capabilities || !capabilities.torch) {
                    alert("Twoja przeglądarka blokuje latarkę z poziomu strony WWW.");
                    return;
                }
                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
                flashlightBtn.classList.toggle('active', isTorchOn);
            } catch (err) { console.error("Błąd włączania latarki:", err); }
        });
    }

    // --- ORIENTACJA I SWIPE (z drugiego kodu, ale bez duplikacji) ---
    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            window.location.reload();
        }, 500);
    });

    let startY = 0;
    if (infoPanel) {
        infoPanel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        infoPanel.addEventListener('touchend', (e) => {
            let endY = e.changedTouches[0].clientY;
            if (endY > startY + 50) {
                infoPanel.classList.remove('visible');
                infoPanel.classList.add('hidden');
            }
        }, { passive: true });
    }

    // ==================== TRYB ASYSTY (z pierwszego kodu) ====================
    if (assistModeBtn && assistOverlay) {
        assistModeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            assistModeActive = !assistModeActive;
            if (assistModeActive) {
                assistModeBtn.classList.add('active');
                assistOverlay.classList.add('active');
            } else {
                assistModeBtn.classList.remove('active');
                assistOverlay.classList.remove('active');
            }
            updateMarkersVisibility();
        });
    }
});