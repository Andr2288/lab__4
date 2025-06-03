import { useState, useEffect, useRef } from "react";

const MapComponent = ({ points, initialCenter, zoom = 6 }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Перевірка чи завантажена бібліотека Leaflet
    useEffect(() => {
        const checkLeaflet = () => {
            if (window.L) {
                setMapLoaded(true);
            } else {
                setTimeout(checkLeaflet, 100);
            }
        };

        checkLeaflet();

        return () => {
            // Очищення мапи при розмонтуванні компонента
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Ініціалізація мапи після завантаження Leaflet
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

        try {
            const L = window.L;

            // Створюємо мапу
            mapInstanceRef.current = L.map(mapRef.current).setView(
                [initialCenter.lat, initialCenter.lng],
                zoom
            );

            // Додаємо тайли OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstanceRef.current);

            // Додаємо початковий маркер для центру
            const marker = L.marker([initialCenter.lat, initialCenter.lng])
                .addTo(mapInstanceRef.current)
                .bindPopup("Центр карти")
                .openPopup();

            markersRef.current.push(marker);
        } catch (error) {
            console.error('Помилка при ініціалізації карти:', error);
        }
    }, [mapLoaded, initialCenter, zoom]);

    // Оновлення маркерів на карті коли змінюються точки
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !points || points.length === 0) return;

        const L = window.L;

        try {
            // Видаляємо всі попередні маркери
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    mapInstanceRef.current.removeLayer(marker);
                });
                markersRef.current = [];
            }

            // Додаємо нові маркери
            const waypoints = [];

            points.forEach((point, index) => {
                const marker = L.marker([point.lat, point.lng])
                    .addTo(mapInstanceRef.current)
                    .bindPopup(`${index + 1}. ${point.name || 'Точка'}`);

                markersRef.current.push(marker);
                waypoints.push(L.latLng(point.lat, point.lng));

                if (index === 0) {
                    marker.openPopup();
                }
            });

            // Якщо є більше одного маркера, створюємо маршрут між ними
            if (waypoints.length > 1 && window.L.Routing) {
                const routeControl = L.Routing.control({
                    waypoints: waypoints,
                    routeWhileDragging: false,
                    lineOptions: {
                        styles: [{ color: '#223440', opacity: 0.7, weight: 5 }]
                    },
                    createMarker: () => null, // Не створюємо додаткові маркери
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: false
                }).addTo(mapInstanceRef.current);
            }

            // Визначаємо межі для автоматичного масштабування
            const bounds = L.latLngBounds(waypoints);
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        } catch (error) {
            console.error('Помилка при оновленні маркерів:', error);
        }
    }, [points, mapLoaded]);

    if (!mapLoaded) {
        return <div className="map-loading">Завантаження карти...</div>;
    }

    return (
        <div
            ref={mapRef}
            style={{
                width: '100%',
                height: '500px',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
        />
    );
};

export default MapComponent;