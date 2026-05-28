document.addEventListener("DOMContentLoaded", () => {
    // Pobieramy elementy HTML
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');

    // To jest nasza "Baza Danych". W przyszłości zrobicie tu fetch('cars.json')
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

    // Pętla generująca wskaźniki (wirtualne kropki)
    carData.markers.forEach(marker => {
        // Tworzymy trójwymiarową sferę
        const point = document.createElement('a-sphere');
        
        // ZMIANA 1: Zmniejszony rozmiar kropki (z 0.08 na 0.02)
        point.setAttribute('radius', '0.02'); 
        point.setAttribute('color', marker.color);
        point.setAttribute('position', marker.position); // Magia - zaczytywanie z bazy!
        point.setAttribute('class', 'clickable'); // Przypinamy klasę, żeby raycaster to wykrył
        
        // Dodajemy animację pulsowania (lekko powiększony rozmach dla mniejszej kropki)
        //point.setAttribute('animation', 'property: scale; to: 1.5 1.5 1.5; dir: alternate; dur: 800; loop: true; easing: easeInOutSine');

        // ZMIANA 2: Dedykowana funkcja z blokadami propagacji
        const showInfoPanel = (event) => {
            event.preventDefault(); // Blokuje domyślne zachowanie przeglądarki
            event.stopPropagation(); // Nie puszcza kliknięcia dalej w tło
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            // Wysuwamy panel
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        };

        // ZMIANA 3: Nasłuchiwanie na click oraz touchstart (dla smartfonów)
        point.addEventListener('click', showInfoPanel);
        point.addEventListener('touchstart', showInfoPanel);

        // Wrzucamy kropkę na scenę, "przyklejając" ją do osłony silnika
        anchor.appendChild(point);
    });

    // Zamykanie panelu przyciskiem "Zrozumiałem"
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Sprytny bajer: zamknięcie panelu, gdy ktoś kliknie w puste miejsce na ekranie (poza kulką)
    document.querySelector('a-scene').addEventListener('click', (e) => {
        // Jeśli kliknięto coś, co NIE MA klasy 'clickable', chowamy menu
        if (!e.target.classList.contains('clickable')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });
});