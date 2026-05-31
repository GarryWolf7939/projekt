document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');
    const assistModeBtn = document.getElementById('assist-mode-btn');
    const markersOnScreen = document.getElementById('markers-on-screen');

    // Baza danych
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Bagnet oleju", 
                color: "#FFC107", 
                position: "-0.4 0.1 0.1", 
                desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX.",
                icon: "assets/oil.png"
            },
            { 
                id: "washer", 
                label: "Płyn spryskiwaczy", 
                color: "#00BFFF", 
                position: "0.5 -0.2 0", 
                desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.",
                icon: "assets/washer.png"
            },
            { 
                id: "coolant", 
                label: "Płyn chłodniczy", 
                color: "#FF4500", 
                position: "0.1 0.4 0.1", 
                desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.",
                icon: "assets/coolant.png"
            }
        ]
    };

    // Generowanie kulek 3D i przycisków
    carData.markers.forEach((marker) => {
        // Kulka 3D
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 
        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.02'); 
        visualSphere.setAttribute('color', marker.color);
        visualSphere.setAttribute('position', '0 0 0'); 
        wrapper.appendChild(visualSphere);
        anchor.appendChild(wrapper);

        // Przycisk UI
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; 
        const imgIcon = document.createElement('img');
        imgIcon.src = marker.icon;
        uiButton.appendChild(imgIcon);

        uiButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        });

        buttonsContainer.appendChild(uiButton);
    });

    // Zamknięcie panelu
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Kliknięcie poza panelem
    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && e.target.id !== 'assist-mode-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
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
                const capabilities = track.getCapabilities && track.getCapabilities();
                if (!capabilities || !capabilities.torch) {
                    alert("Twoja przeglądarka nie obsługuje latarki.");
                    return;
                }
                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
                if (isTorchOn) { flashlightBtn.classList.add('active'); } 
                else { flashlightBtn.classList.remove('active'); }
            } catch (err) { console.error("Błąd latarki:", err); }
        });
    }

    // --- ASYSTA AR (tylko na przycisk) ---
    let assistModeActive = false;
    let hitDetectionInterval = null;

    // Pozycje znaczników (dostosuj do swojego silnika)
    const screenPositions = {
        oil: { x: 25, y: 40, name: "🛢️ Bagnet oleju" },
        washer: { x: 75, y: 35, name: "💧 Płyn spryskiwaczy" },
        coolant: { x: 50, y: 65, name: "🌡️ Płyn chłodniczy" }
    };

    // Pokazanie znaczników
    function showScreenMarkers() {
        markersOnScreen.innerHTML = '';
        
        for (const [id, pos] of Object.entries(screenPositions)) {
            const marker = document.createElement('div');
            marker.className = 'screen-marker';
            marker.id = `marker-${id}`;
            marker.innerText = pos.name;
            marker.style.left = `${pos.x}%`;
            marker.style.top = `${pos.y}%`;
            marker.style.transform = 'translate(-50%, -50%)';
            markersOnScreen.appendChild(marker);
        }
        
        startHitDetection();
    }

    // Ukrycie znaczników
    function hideScreenMarkers() {
        if (hitDetectionInterval) {
            clearInterval(hitDetectionInterval);
            hitDetectionInterval = null;
        }
        markersOnScreen.innerHTML = '';
    }

    // Wykrywanie czy celownik trafił w znacznik
    function startHitDetection() {
        if (hitDetectionInterval) clearInterval(hitDetectionInterval);
        
        hitDetectionInterval = setInterval(() => {
            if (!assistModeActive) return;
            
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            
            const markers = document.querySelectorAll('.screen-marker');
            
            markers.forEach((marker) => {
                const rect = marker.getBoundingClientRect();
                const markerCenterX = (rect.left + rect.right) / 2;
                const markerCenterY = (rect.top + rect.bottom) / 2;
                
                const distance = Math.sqrt(
                    Math.pow(markerCenterX - screenCenterX, 2) + 
                    Math.pow(markerCenterY - screenCenterY, 2)
                );
                
                if (distance < 60) {
                    if (!marker.classList.contains('highlight')) {
                        marker.classList.add('highlight');
                        
                        // Znajdź ID znacznika
                        const markerId = marker.id.replace('marker-', '');
                        const markerData = carData.markers.find(m => m.id === markerId);
                        if (markerData) {
                            infoTitle.innerText = markerData.label;
                            infoDesc.innerText = markerData.desc;
                            infoPanel.classList.remove('hidden');
                            infoPanel.classList.add('visible');
                            if ('vibrate' in navigator) navigator.vibrate(50);
                        }
                    }
                } else {
                    marker.classList.remove('highlight');
                }
            });
        }, 100);
    }

    // Obsługa przycisku asysty
    if (assistModeBtn) {
        assistModeBtn.addEventListener('click', () => {
            assistModeActive = !assistModeActive;
            
            if (assistModeActive) {
                assistModeBtn.classList.add('active');
                // Pokaż znaczniki TYLKO jeśli marker jest wykryty
                if (buttonsContainer.classList.contains('visible')) {
                    showScreenMarkers();
                }
            } else {
                assistModeBtn.classList.remove('active');
                hideScreenMarkers();
            }
        });
    }

    // Gdy wykryto marker
    anchor.addEventListener("targetFound", () => {
        buttonsContainer.classList.add('visible');
        // Pokaż znaczniki tylko jeśli tryb asysty jest włączony
        if (assistModeActive) {
            showScreenMarkers();
        }
    });

    // Gdy utracono marker
    anchor.addEventListener("targetLost", () => {
        buttonsContainer.classList.remove('visible');
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
        hideScreenMarkers();
    });

    // Odświeżanie przy zmianie orientacji
    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            window.location.reload();
        }, 500);
    });
});