document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');

    const carData = {
        markers: [
            { id: "oil", label: "Bagnet oleju", color: "#FFC107", position: "-0.4 0.1 0.1", desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX." },
            { id: "washer", label: "Płyn do spryskiwaczy", color: "#00BFFF", position: "0.5 -0.2 0", desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby." },
            { id: "coolant", label: "Płyn chłodniczy", color: "#FF4500", position: "0.1 0.4 0.1", desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku." }
        ]
    };

    // Pętla generująca wskaźniki (Z HITBOXAMI, ALE BEZ PULSOWANIA)
    carData.markers.forEach(marker => {
        
        // Niewidzialny obszar łapiący grube palce (Hitbox)
        const hitbox = document.createElement('a-entity');
        hitbox.setAttribute('geometry', 'primitive: sphere; radius: 0.15'); 
        hitbox.setAttribute('material', 'transparent: true; opacity: 0'); 
        hitbox.setAttribute('position', marker.position); 
        hitbox.setAttribute('class', 'clickable'); 

        // Widzialna, statyczna kropka wewnątrz
        const visualPoint = document.createElement('a-cone');
        visualPoint.setAttribute('radius-bottom', '0.03');
        visualPoint.setAttribute('radius-top', '0.01');
        visualPoint.setAttribute('height', '1');
        visualPoint.setAttribute('rotation', '180 0 0'); 
        visualPoint.setAttribute('color', marker.color);
        visualPoint.setAttribute('position', '0 0 0'); 
        // USUNIĘTO ANIMACJĘ PULSOWANIA

        hitbox.appendChild(visualPoint);

        // PANCERNE OTWIERANIE PANELU (Tylko event od A-Frame)
        hitbox.addEventListener('click', function (evt) {
            evt.stopPropagation(); // Ubijamy propagację zdarzenia
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        });

        anchor.appendChild(hitbox);
    });

    // PANCERNE ZAMYKANIE PANELU (TYLKO przez przycisk)
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // --- LOGIKA LATARKI (Zostaje bez zmian) ---
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
                    alert("Twoja przeglądarka lub sprzęt blokuje dostęp do latarki z poziomu strony WWW.");
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
                console.error("Błąd podczas włączania latarki:", err);
            }
        });
    }
});