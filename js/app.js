document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');

    // Baza danych ze ŚCIEŻKAMI DO PLIKÓW PNG
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Bagnet oleju", 
                color: "#FFC107", 
                position: "-0.4 0.1 0.1", 
                desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX.",
                icon: "assets/oil.png" // Podmień na swoje nazwy!
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

    carData.markers.forEach((marker) => {
        // --- 1. GENEROWANIE OBIEKTU 3D W AR (Kulki) ---
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 

        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.02'); 
        visualSphere.setAttribute('color', marker.color);
        visualSphere.setAttribute('position', '0 0 0'); 
        
        wrapper.appendChild(visualSphere);
        anchor.appendChild(wrapper);

        // --- 2. GENEROWANIE PRZYCISKU 2D Z PLIKIEM PNG ---
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; 
        
        // Tworzymy tag <img> i wrzucamy do przycisku
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

    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn')) {
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
                const capabilities = track.getCapabilities && track.getCapabilities();
                if (!capabilities || !capabilities.torch) {
                    alert("Twoja przeglądarka blokuje latarkę z poziomu strony WWW.");
                    return;
                }
                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
                if (isTorchOn) { flashlightBtn.classList.add('active'); } 
                else { flashlightBtn.classList.remove('active'); }
            } catch (err) { console.error("Błąd włączania latarki:", err); }
        });
    }
    // --- RATUNKOWY HACK NA OBRACANIE EKRANU ---
    // Nasłuchujemy zmiany orientacji urządzenia
    window.addEventListener("orientationchange", () => {
        // Czekamy pół sekundy, aż system telefonu skończy animację obracania
        setTimeout(() => {
            window.location.reload(); // Odświeżamy stronę!
        }, 500);
    });
    // --- NAJPROSTSZA ASYSTA AR ---
    const markersOnScreen = document.getElementById('markers-on-screen');
    const centerDot = document.getElementById('center-dot');
    
    // Pozycje elementów na ekranie (w procentach 0-100)
    // Lewo/prawo i góra/dół gdzie pokazać znaczniki
    const screenPositions = {
        oil: { x: 25, y: 40, name: "🛢️ Bagnet oleju" },
        washer: { x: 75, y: 35, name: "💧 Płyn spryskiwaczy" },
        coolant: { x: 50, y: 65, name: "🌡️ Płyn chłodniczy" }
    };
    
    let activeMarkers = {};
    
    // Funkcja pokazująca znaczniki na ekranie
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
            activeMarkers[id] = marker;
        }
        
        // Sprawdzanie czy celownik trafił w znacznik
        startHitDetection();
    }
    
    // Funkcja sprawdzająca czy celownik jest na znaczniku
    function startHitDetection() {
        // Używamy eventu mousemove/touchmove do śledzenia gdzie celownik
        // Ale celownik jest na środku, więc sprawdzamy co 0.5s czy coś jest w środku
        const checkHit = setInterval(() => {
            // Celownik jest zawsze na środku ekranu (50%, 50%)
            const centerX = 50;
            const centerY = 50;
            
            for (const [id, marker] of Object.entries(activeMarkers)) {
                const rect = marker.getBoundingClientRect();
                const markerCenterX = (rect.left + rect.right) / 2;
                const markerCenterY = (rect.top + rect.bottom) / 2;
                const screenCenterX = window.innerWidth / 2;
                const screenCenterY = window.innerHeight / 2;
                
                // Dystans między środkiem ekranu a środkiem znacznika
                const distance = Math.sqrt(
                    Math.pow(markerCenterX - screenCenterX, 2) + 
                    Math.pow(markerCenterY - screenCenterY, 2)
                );
                
                // Jeśli celownik jest blisko znacznika (mniej niż 50px)
                if (distance < 50) {
                    if (!marker.classList.contains('highlight')) {
                        marker.classList.add('highlight');
                        
                        // Pokaż panel z informacją o tym elemencie
                        const markerData = carData.markers.find(m => m.id === id);
                        if (markerData) {
                            infoTitle.innerText = markerData.label;
                            infoDesc.innerText = markerData.desc;
                            infoPanel.classList.remove('hidden');
                            infoPanel.classList.add('visible');
                            
                            // Krótka wibracja
                            if ('vibrate' in navigator) navigator.vibrate(50);
                        }
                    }
                } else {
                    marker.classList.remove('highlight');
                }
            }
        }, 100);
        
        // Zatrzymaj sprawdzanie gdy marker zniknie
        anchor.addEventListener("targetLost", () => {
            clearInterval(checkHit);
        }, { once: true });
    }
    
    // Pokaż znaczniki gdy wykryto marker
    anchor.addEventListener("targetFound", () => {
        showScreenMarkers();
    });
    
    // Schowaj znaczniki gdy marker zniknie
    anchor.addEventListener("targetLost", () => {
        markersOnScreen.innerHTML = '';
        activeMarkers = {};
    });
});