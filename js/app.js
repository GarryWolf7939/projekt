document.addEventListener("DOMContentLoaded", () => {
    // Pobieramy elementy HTML
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');

    // To jest nasza "Baza Danych"
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Bagnet oleju", 
                color: "#FFC107", 
                position: "-0.4 0.1 0.1", 
                desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX." 
            },
            { 
                id: "washer", 
                label: "Płyn do spryskiwaczy", 
                color: "#00BFFF", 
                position: "0.5 -0.2 0", 
                desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby." 
            },
            { 
                id: "coolant", 
                label: "Płyn chłodniczy", 
                color: "#FF4500", 
                position: "0.1 0.4 0.1", 
                desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku." 
            }
        ]
    };

    // FLAGA: Zabezpieczenie przed błędem podwójnego kliknięcia
    let isMarkerClicked = false;

    // Pętla generująca wskaźniki z NIEWIDZIALNYMI HITBOXAMI
    carData.markers.forEach(marker => {
        
        // 1. TWORZYMY HITBOX (Wielka, niewidzialna tarcza na palec)
        const hitbox = document.createElement('a-entity');
        // Tworzymy sferę o promieniu 15cm (ogromny obszar kliknięcia)
        hitbox.setAttribute('geometry', 'primitive: sphere; radius: 0.15'); 
        // Robimy ją w 100% przezroczystą!
        hitbox.setAttribute('material', 'transparent: true; opacity: 0'); 
        // Pozycja hitboxa to pozycja znacznika z bazy danych
        hitbox.setAttribute('position', marker.position); 
        // Raycaster (laser od klikania) będzie widział TYLKO ten element
        hitbox.setAttribute('class', 'clickable'); 

        // 2. TWORZYMY WIDZIALNĄ KROPKĘ (Tylko do wyglądu)
        const visualPoint = document.createElement('a-sphere');
        visualPoint.setAttribute('radius', '0.02'); // Mała, ładna kropeczka (2cm)
        visualPoint.setAttribute('color', marker.color);
        // Kropka jest W ŚRODKU hitboxa, więc jej pozycja to 0 0 0 względem niego
        visualPoint.setAttribute('position', '0 0 0'); 
        visualPoint.setAttribute('animation', 'property: scale; to: 1.5 1.5 1.5; dir: alternate; dur: 800; loop: true; easing: easeInOutSine');

        // Wkładamy widzialną kropkę do środka niewidzialnego hitboxa
        hitbox.appendChild(visualPoint);

        // Obsługa kliknięcia palcem (podpinamy pod wielkiego Hitboxa, a nie małą kropkę!)
        const showInfoPanel = () => {
            isMarkerClicked = true; // Podnosimy flagę
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            // Wysuwamy panel
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');

            // Opuszczamy flagę po ułamku sekundy
            setTimeout(() => { isMarkerClicked = false; }, 150);
        };

        hitbox.addEventListener('click', showInfoPanel);
        hitbox.addEventListener('touchstart', showInfoPanel);

        // Wrzucamy gotowy zestaw (Hitbox + Kropka w środku) na scenę
        anchor.appendChild(hitbox);
    });

    // Zamykanie panelu przyciskiem "Zrozumiałem"
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Zamykanie panelu po kliknięciu w tło
    window.addEventListener('click', (e) => {
        if (!isMarkerClicked && e.target.id !== 'flashlight-btn' && !e.target.closest('#info-panel')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    // --- LOGIKA LATARKI ---
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
                    alert("Twoja przeglądarka lub sprzęt sprzętowo blokuje dostęp do latarki z poziomu strony WWW.");
                    return;
                }

                isTorchOn = !isTorchOn;
                await track.applyConstraints({
                    advanced: [{ torch: isTorchOn }]
                });

                if (isTorchOn) {
                    flashlightBtn.classList.add('active');
                } else {
                    flashlightBtn.classList.remove('active');
                }

            } catch (err) {
                console.error("Błąd podczas włączania latarki:", err);
                alert("Nie udało się uzyskać dostępu do latarki.");
            }
        });
    }
});