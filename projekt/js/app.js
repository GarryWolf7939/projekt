document.addEventListener("DOMContentLoaded", async () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');

    let currentTargetId = null;
    let currentMarkers = [];

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

    // 3. Funkcja tworząca markery dla konkretnego samochodu
    function createMarkersForCar(carKey, carInfo) {
        clearMarkers();

        if (!carInfo.markers || !carInfo.markers.length) {
            console.warn(`Brak markerów dla ${carKey}`);
            return;
        }

        console.log(`🔧 Tworzę ${carInfo.markers.length} markerów dla ${carInfo.name}`);

        carInfo.markers.forEach(marker => {
            // Hitbox – duża kula do klikania
            const hitbox = document.createElement('a-entity');
            hitbox.setAttribute('geometry', 'primitive: sphere; radius: 0.22');
            hitbox.setAttribute('material', 'color: red; transparent: true; opacity: 0.01');
            hitbox.setAttribute('position', marker.position);
            hitbox.setAttribute('class', 'clickable');
            hitbox.setAttribute('data-label', marker.label);
            hitbox.setAttribute('data-desc', marker.description);

            // Stożek wizualny
            const visualPoint = document.createElement('a-cone');
            visualPoint.setAttribute('radius-bottom', '0.025');
            visualPoint.setAttribute('radius-top', '0');
            visualPoint.setAttribute('height', '0.07');
            visualPoint.setAttribute('color', marker.color);
            visualPoint.setAttribute('rotation', '180 0 0');
            visualPoint.setAttribute('position', '0 0.04 0');

            hitbox.appendChild(visualPoint);

            // Event kliknięcia
            const triggerPanel = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                infoTitle.innerText = marker.label;
                infoDesc.innerText = marker.description;
                infoPanel.classList.remove('hidden');
                infoPanel.classList.add('visible');
            };

            hitbox.addEventListener('click', triggerPanel);
            hitbox.addEventListener('touchstart', triggerPanel);

            anchor.appendChild(hitbox);
            currentMarkers.push(hitbox);
        });
    }

    // 4. Nasłuchiwanie na pojawienie się targetu w scenie A-Frame
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
        }
    });

    scene.addEventListener('mindar-image-target-lost', () => {
        clearMarkers();
        currentTargetId = null;
        console.log("👋 Target utracony, czyszczę markery");
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
                    alert("Twoja przeglądarka blokuje dostęp do latarki.");
                    return;
                }

                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });

                if (isTorchOn) {
                    flashlightBtn.classList.add('active');
                } else {
                    flashlightBtn.classList.remove('active');
                }
            } catch (err) {
                console.error("Błąd latarki:", err);
                alert("Nie udało się włączyć latarki.");
            }
        });
    }

    // 7. Wymuś start kamery po interakcji użytkownika
    document.body.addEventListener('click', () => {
        const video = document.querySelector('video');
        if (video && video.readyState === 0) {
            video.play().catch(e => console.log("Autoplay blokowany, ale to normalne"));
        }
    }, { once: true });
});