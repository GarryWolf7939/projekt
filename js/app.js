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
        point.setAttribute('radius', '0.08'); // Rozmiar znacznika
        point.setAttribute('color', marker.color);
        point.setAttribute('position', marker.position); // Magia - zaczytywanie z bazy!
        point.setAttribute('class', 'clickable'); // Przypinamy klasę, żeby raycaster to wykrył
        
        // Dodajemy animację pulsowania
        point.setAttribute('animation', 'property: scale; to: 1.3 1.3 1.3; dir: alternate; dur: 800; loop: true; easing: easeInOutSine');

        // Obsługa kliknięcia palcem w konkretny znacznik
        point.addEventListener('click', () => {
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            // Wysuwamy panel
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        });

        // Wrzucamy kropkę na scenę, "przyklejając" ją do osłony silnika
        anchor.appendChild(point);
    });

    // Zamykanie panelu przyciskiem "Zrozumiałem"
    closeBtn.addEventListener('click', () => {
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