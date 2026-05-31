document.addEventListener("DOMContentLoaded", () => {

    const anchor = document.getElementById('engine-anchor');

    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');

    const flashlightBtn = document.getElementById('flashlight-btn');
    const assistModeBtn = document.getElementById('assist-mode-btn');

    const buttonsContainer = document.getElementById('marker-buttons-container');

    const splashScreen = document.getElementById('splash-screen');
    const startBtn = document.getElementById('start-btn');
    const sceneEl = document.querySelector('a-scene');

    const markersOnScreen = document.getElementById('markers-on-screen');
    const centerDot = document.getElementById('center-dot');

    // =========================
    // START AR (SPLASH)
    // =========================

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            splashScreen.classList.add('hidden');
            sceneEl.systems["mindar-image-system"].start();
        });
    }

    // =========================
    // DANE
    // =========================

    const carData = {
        markers: [
            {
                id: "oil",
                label: "Wlew oleju",
                color: "#ffee00",
                position: "-0.4 0.1 0.1",
                desc: "Utrzymuj poziom między MIN i MAX.",
                icon: "assets/oil.png"
            },
            {
                id: "oil_dipstick",
                label: "Bagnet oleju",
                color: "#f3a702",
                position: "-0.3 0.07 0.1",
                desc: "Sprawdzaj na zimnym silniku.",
                icon: "assets/bagnet_oleju.png"
            },
            {
                id: "washer",
                label: "Płyn spryskiwaczy",
                color: "#00BFFF",
                position: "0.5 -0.2 0",
                desc: "Używaj zimowego płynu.",
                icon: "assets/washer.png"
            },
            {
                id: "coolant",
                label: "Płyn chłodniczy",
                color: "#FF4500",
                position: "0.1 0.4 0.1",
                desc: "Nie otwieraj na gorącym silniku!",
                icon: "assets/coolant.png"
            }
        ]
    };

    // mapa do trybu asysty
    const screenPositions = {
        oil: { x: 25, y: 40, name: "🛢️ Olej" },
        oil_dipstick: { x: 30, y: 50, name: "📏 Bagnet" },
        washer: { x: 75, y: 35, name: "💧 Spryskiwacze" },
        coolant: { x: 50, y: 65, name: "🌡️ Chłodnica" }
    };

    // =========================
    // GENEROWANIE MARKERÓW 3D + UI
    // =========================

    carData.markers.forEach(marker => {

        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position);

        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('radius', '0.02');
        sphere.setAttribute('color', marker.color);

        wrapper.appendChild(sphere);
        anchor.appendChild(wrapper);

        const btn = document.createElement('div');
        btn.className = 'ui-marker-btn';

        const img = document.createElement('img');
        img.src = marker.icon;

        btn.appendChild(img);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;

            infoPanel.classList.add('visible');
        });

        buttonsContainer.appendChild(btn);
    });

    // =========================
    // PANEL
    // =========================

    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        infoPanel.classList.remove('visible');
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('#info-panel') &&
            !e.target.closest('.ui-marker-btn') &&
            e.target.id !== 'flashlight-btn' &&
            e.target.id !== 'assist-mode-btn'
        ) {
            infoPanel.classList.remove('visible');
        }
    });

    // =========================
    // LATARKA
    // =========================

    let isTorchOn = false;

    if (flashlightBtn) {
        flashlightBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                const video = document.querySelector('video');
                if (!video?.srcObject) return;

                const track = video.srcObject.getVideoTracks()[0];
                const caps = track.getCapabilities?.();

                if (!caps?.torch) return;

                isTorchOn = !isTorchOn;

                await track.applyConstraints({
                    advanced: [{ torch: isTorchOn }]
                });

                flashlightBtn.classList.toggle('active', isTorchOn);

            } catch (err) {
                console.error(err);
            }
        });
    }

    // =========================
    // ASYSTA
    // =========================

    let assistModeActive = false;
    let hitInterval = null;

    function showScreenMarkers() {

        markersOnScreen.innerHTML = "";

        Object.entries(screenPositions).forEach(([id, pos]) => {

            const el = document.createElement('div');
            el.className = 'screen-marker';
            el.id = `marker-${id}`;

            el.innerText = pos.name;
            el.style.left = `${pos.x}%`;
            el.style.top = `${pos.y}%`;
            el.style.transform = 'translate(-50%, -50%)';

            markersOnScreen.appendChild(el);
        });

        startHitDetection();
    }

    function hideScreenMarkers() {
        clearInterval(hitInterval);
        markersOnScreen.innerHTML = "";
    }

    function startHitDetection() {

        clearInterval(hitInterval);

        hitInterval = setInterval(() => {

            if (!assistModeActive) return;

            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;

            document.querySelectorAll('.screen-marker').forEach(marker => {

                const rect = marker.getBoundingClientRect();

                const mx = (rect.left + rect.right) / 2;
                const my = (rect.top + rect.bottom) / 2;

                const dist = Math.hypot(mx - cx, my - cy);

                const id = marker.id.replace("marker-", "");
                const data = carData.markers.find(m => m.id === id);

                if (dist < 60) {
                    marker.classList.add('highlight');

                    if (data) {
                        infoTitle.innerText = data.label;
                        infoDesc.innerText = data.desc;
                        infoPanel.classList.add('visible');

                        if (navigator.vibrate) navigator.vibrate(40);
                    }
                } else {
                    marker.classList.remove('highlight');
                }
            });

        }, 100);
    }

    assistModeBtn.addEventListener('click', (e) => {

        e.preventDefault();
        e.stopPropagation();

        assistModeActive = !assistModeActive;

        centerDot.classList.toggle('visible', assistModeActive);
        assistModeBtn.classList.toggle('active', assistModeActive);

        if (assistModeActive && buttonsContainer.classList.contains('visible')) {
            showScreenMarkers();
        } else {
            hideScreenMarkers();
            centerDot.classList.remove('visible');
        }
    });

    // =========================
    // AR EVENTS
    // =========================

    anchor.addEventListener("targetFound", () => {
        buttonsContainer.classList.add('visible');

        if (assistModeActive) {
            showScreenMarkers();
        }
    });

    anchor.addEventListener("targetLost", () => {
        buttonsContainer.classList.remove('visible');
        infoPanel.classList.remove('visible');
        hideScreenMarkers();
    });

    // =========================
    // ORIENTATION FIX
    // =========================

    window.addEventListener("orientationchange", () => {
        setTimeout(() => location.reload(), 400);
    });

});