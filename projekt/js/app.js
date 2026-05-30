document.addEventListener("DOMContentLoaded", async () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');

    let currentTargetId = null;
    let currentMarkers = [];

    // Dodaj toast do powiadomień
    const toast = document.createElement('div');
    toast.id = 'focus-toast';
    toast.textContent = '🔍 Ustawianie ostrości...';
    document.getElementById('ui-container').appendChild(toast);

    function showToast(message, duration = 1500) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // ========== FOCUSOWANIE KAMERY ==========
    async function enableAutoFocus() {
        try {
            const videoElement = document.querySelector('video');
            if (!videoElement || !videoElement.srcObject) {
                console.log("⏳ Kamera jeszcze nie gotowa, spróbuję za sekundę...");
                setTimeout(enableAutoFocus, 1000);
                return;
            }
            
            const stream = videoElement.srcObject;
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            console.log("📷 Możliwości kamery:", capabilities);
            
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                await track.applyConstraints({
                    advanced: [{ focusMode: "continuous" }]
                });
                console.log("✅ Ustawiono ciągłe auto-focus");
                showToast("✅ Auto-focus włączony", 1000);
            } else if (capabilities.focusMode && capabilities.focusMode.includes('auto')) {
                await track.applyConstraints({
                    advanced: [{ focusMode: "auto" }]
                });
                console.log("✅ Ustawiono auto-focus");
                showToast("✅ Auto-focus włączony", 1000);
            } else {
                console.log("⚠️ Kamera nie wspiera programowego focusowania");
                showToast("⚠️ Focus manualny (dotknij ekranu)", 1500);
            }
        } catch (err) {
            console.error("❌ Błąd ustawiania focusu:", err);
        }
    }

    async function manualFocus() {
        try {
            const videoElement = document.querySelector('video');
            if (!videoElement || !videoElement.srcObject) return;
            
            const stream = videoElement.srcObject;
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            showToast("🔍 Ustawianie ostrości...", 800);
            
            if (capabilities.focusMode) {
                await track.applyConstraints({
                    advanced: [{ focusMode: "auto" }]
                });
                console.log("🔍 Manualny focus wykonany");
                
                setTimeout(async () => {
                    try {
                        if (capabilities.focusMode.includes('continuous')) {
                            await track.applyConstraints({
                                advanced: [{ focusMode: "continuous" }]
                            });
                        }
                    } catch(e) {}
                }, 2000);
            }
        } catch (err) {
            console.log("Manual focus nie wspierany:", err);
        }
    }

    // 1. Wczytaj dane samochodów
    let carsData = {};
    try {
        const response = await fetch('cars.json');
        carsData = await response.json();
        console.log("📦 Załadowano dane:", Object.keys(carsData));
    } catch (e) {
        console.error("❌ Nie udało się wczytać cars.json", e);
    }

    // 2. Funkcja czyszcząca stare markery
    function clearMarkers() {
        currentMarkers.forEach(marker => {
            if (marker.parentNode) marker.parentNode.removeChild(marker);
        });
        currentMarkers = [];
    }

    // 3. Funkcja tworząca markery
    function createMarkersForCar(carKey, carInfo) {
        clearMarkers();

        if (!carInfo.markers || !carInfo.markers.length) {
            console.warn(`Brak markerów dla ${carKey}`);
            return;
        }

        console.log(`🔧 Tworzę ${carInfo.markers.length} markerów dla ${carInfo.name}`);

        carInfo.markers.forEach(marker => {
            const hitbox = document.createElement('a-entity');
            hitbox.setAttribute('geometry', 'primitive: sphere; radius: 0.25');
            hitbox.setAttribute('material', 'color: red; transparent: true; opacity: 0.01');
            hitbox.setAttribute('position', marker.position);
            hitbox.setAttribute('class', 'clickable');

            const visualPoint = document.createElement('a-cone');
            visualPoint.setAttribute('radius-bottom', '0.04');
            visualPoint.setAttribute('radius-top', '0');
            visualPoint.setAttribute('height', '0.12');
            visualPoint.setAttribute('color', marker.color);
            visualPoint.setAttribute('rotation', '180 0 0');
            visualPoint.setAttribute('position', '0 0.06 0');

            hitbox.appendChild(visualPoint);

            const triggerPanel = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                infoTitle.innerText = marker.label;
                infoDesc.innerText = marker.description;
                infoPanel.classList.remove('hidden');
                infoPanel.classList.add('visible');
                // Przy kliknięciu w marker też wymuś focus
                manualFocus();
            };

            hitbox.addEventListener('click', triggerPanel);
            hitbox.addEventListener('touchstart', triggerPanel);

            anchor.appendChild(hitbox);
            currentMarkers.push(hitbox);
        });
        
        showToast(`🎯 ${carInfo.name} gotowy!`, 2000);
    }

    // 4. Nasłuchiwanie na target
    const scene = document.querySelector('a-scene');
    
    scene.addEventListener('mindar-image-target-found', (event) => {
        const carKeys = Object.keys(carsData);
        if (carKeys.length === 0) return;
        
        const selectedCarKey = carKeys[0];
        const carInfo = carsData[selectedCarKey];
        
        if (carInfo && currentTargetId !== selectedCarKey) {
            currentTargetId = selectedCarKey;
            createMarkersForCar(selectedCarKey, carInfo);
            console.log(`🎯 Wykryto target, wczytano: ${carInfo.name}`);
            manualFocus();
        }
    });

    scene.addEventListener('mindar-image-target-lost', () => {
        clearMarkers();
        currentTargetId = null;
        console.log("👋 Target utracony");
    });

    // 5. Panel zamykania
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // 6. Latarka
    let isTorchOn = false;
    if (flashlightBtn) {
        flashlightBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                const videoElement = document.querySelector('video');
                if (!videoElement || !videoElement.srcObject) {
                    alert("Kamera nie jest jeszcze aktywna.");
                    return;
                }
                const stream = videoElement.srcObject;
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities?.();

                if (!capabilities || !capabilities.torch) {
                    alert("Twoja przeglądarka nie wspiera latarki.");
                    return;
                }

                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });

                if (isTorchOn) {
                    flashlightBtn.classList.add('active');
                    showToast("🔦 Latarka włączona", 1000);
                } else {
                    flashlightBtn.classList.remove('active');
                    showToast("🔦 Latarka wyłączona", 1000);
                }
            } catch (err) {
                console.error("Błąd latarki:", err);
                alert("Nie udało się włączyć latarki.");
            }
        });
    }

    // 7. Auto-focus po starcie
    setTimeout(enableAutoFocus, 2000);

    // 8. Focus na kliknięcie ekranu
    document.body.addEventListener('click', (e) => {
        // Nie focusuj gdy kliknięto przycisk
        if (e.target.closest('#close-btn') || e.target.closest('#flashlight-btn')) return;
        manualFocus();
        
        const video = document.querySelector('video');
        if (video && video.readyState === 0) {
            video.play().catch(e => console.log("Autoplay blokowany"));
        }
    });
    
    // 9. Focus na dwóch palcach (zoom gesture)
    let touchCount = 0;
    document.body.addEventListener('touchstart', (e) => {
        touchCount = e.touches.length;
    });
    document.body.addEventListener('touchend', () => {
        if (touchCount === 2) {
            manualFocus();
        }
    });
    
    console.log("✅ UnderHood AR gotowy! Szukaj targetu...");
});