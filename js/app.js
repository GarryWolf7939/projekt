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

    carData.markers.forEach(marker => {
        
        // 1. OGROMNY HITBOX (Pół metra!)
        const hitbox = document.createElement('a-entity');
        hitbox.setAttribute('geometry', 'primitive: sphere; radius: 0.25'); 
        // Triki na optymalizację WebGL - 1% przezroczystości, żeby grafika tego nie skasowała
        hitbox.setAttribute('material', 'color: red; transparent: true; opacity: 0.01'); 
        hitbox.setAttribute('position', marker.position); 
        hitbox.setAttribute('class', 'clickable'); 

        // 2. WIDZIALNY STOŻEK (Szpic)
        const visualPoint = document.createElement('a-cone');
        visualPoint.setAttribute('radius-bottom', '0.02');
        visualPoint.setAttribute('radius-top', '0');       
        visualPoint.setAttribute('height', '0.06');        
        visualPoint.setAttribute('color', marker.color);
        visualPoint.setAttribute('rotation', '180 0 0');
        visualPoint.setAttribute('position', '0 0.03 0'); 
        
        hitbox.appendChild(visualPoint);

        // Funkcja uodporniona na podwójne odpalenia
        const triggerPanel = (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        };

        // Podpinamy natywne zachowania przeglądarki i mobilne pacnięcia palcem
        hitbox.addEventListener('click', triggerPanel);
        hitbox.addEventListener('touchstart', triggerPanel);

        anchor.appendChild(hitbox);
    });

    // Zamykanie panelu przyciskiem
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
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
                    alert("Twoja przeglądarka blokuje dostęp do latarki z poziomu strony WWW.");
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