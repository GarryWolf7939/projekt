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

    // Pętla generująca wskaźniki
    carData.markers.forEach(marker => {
        const point = document.createElement('a-sphere');
        
        // Zwiększony promień do 0.04 (4cm), żeby dało się w to trafić palcem na ekranie!
        point.setAttribute('radius', '0.04'); 
        point.setAttribute('color', marker.color);
        point.setAttribute('position', marker.position); 
        point.setAttribute('class', 'clickable'); 
        
        // Obsługa kliknięcia palcem we wskaźnik
        point.addEventListener('click', () => {
            isMarkerClicked = true; // Podnosimy flagę: "Użytkownik kliknął w kulkę!"
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            // Wysuwamy panel
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');

            // Opuszczamy flagę po ułamku sekundy
            setTimeout(() => { isMarkerClicked = false; }, 150);
        });

        // Wrzucamy kropkę na scenę
        anchor.appendChild(point);
    });

    // Zamykanie panelu przyciskiem "Zrozumiałem"
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Zamykanie panelu po kliknięciu w tło (zabezpieczone flagą!)
    window.addEventListener('click', (e) => {
        // Jeśli nie kliknięto w marker, nie kliknięto w latarkę i nie kliknięto w sam panel...
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