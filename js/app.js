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

    // Pętla generująca wskaźniki (Z HITBOXAMI I NOWYMI STOŻKAMI)
    carData.markers.forEach(marker => {
        
        // 1. Niewidzialny obszar łapiący grube palce (Hitbox) - Zostaje bez zmian!
        const hitbox = document.createElement('a-entity');
        hitbox.setAttribute('geometry', 'primitive: sphere; radius: 0.15'); 
        hitbox.setAttribute('material', 'transparent: true; opacity: 0'); 
        hitbox.setAttribute('position', marker.position); 
        hitbox.setAttribute('class', 'clickable'); 

        // 2. NOWOŚĆ: Elegancki stożek (wskaźnik) wewnątrz hitboxa
        const visualPoint = document.createElement('a-cone');
        
        // Parametry geometrii stożka
        visualPoint.setAttribute('radius-bottom', '0.02'); // Szerokość bazy (2 cm)
        visualPoint.setAttribute('radius-top', '0');       // Szpic (0 cm)
        visualPoint.setAttribute('height', '0.06');        // Długość wskaźnika (6 cm)
        visualPoint.setAttribute('color', marker.color);
        
        // Standardowo stożek patrzy szpicem w górę. Odwracamy go o 180 stopni na osi X, żeby celował w dół!
        visualPoint.setAttribute('rotation', '180 0 0');
        
        // Przesuwamy go lekko w górę na osi Y (o połowę jego wysokości - 3cm), 
        // żeby sam szpic idealnie dotykał współrzędnych X,Y,Z z JSON-a
        visualPoint.setAttribute('position', '0 0.03 0'); 

        // Wrzucamy stożek do niewidzialnego hitboxa
        hitbox.appendChild(visualPoint);

        // PANCERNE OTWIERANIE PANELU (Klikamy w Hitboxa)
        hitbox.addEventListener('click', function (evt) {
            evt.stopPropagation();
            
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