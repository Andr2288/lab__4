import React, { useEffect, useState, useRef } from 'react';
import { getAllTours } from '../services/tourService';

const MapView = () => {
    const [selectedDestination, setSelectedDestination] = useState('Туреччина');
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toursInSelectedDestination, setToursInSelectedDestination] = useState([]);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    // Референції для карти та маркерів
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const routeControlRef = useRef(null);

    // Дані про напрямки для карти
    const destinations = {
        Туреччина: {
            lat: 38.9637,
            lng: 35.2433,
            zoom: 6,
            description:
                "Туреччина - країна з багатою історією, чудовими пляжами та смачною кухнею. Відвідайте стародавні міста, насолодіться відпочинком на узбережжі або помилуйтеся неймовірними краєвидами Кападокії.",
        },
        Швейцарія: {
            lat: 46.8182,
            lng: 8.2275,
            zoom: 7,
            description:
                "Швейцарія - країна приголомшливих Альп, кришталево чистих озер та мальовничих міст. Ідеальне місце для любителів природи, гірськолижного спорту та шоколаду.",
        },
        Японія: {
            lat: 36.2048,
            lng: 138.2529,
            zoom: 5,
            description:
                "Японія - унікальне поєднання стародавніх традицій та надсучасних технологій. Відвідайте храми Кіото, насолодіться цвітінням сакури або зануртеся в неонове світло Токіо.",
        },
    };

    // Перевірка чи завантажений Leaflet
    useEffect(() => {
        const checkLeaflet = () => {
            if (window.L) {
                setLeafletLoaded(true);
            } else {
                // Якщо Leaflet не завантажений, перевіряємо знову через 100мс
                setTimeout(checkLeaflet, 100);
            }
        };
        checkLeaflet();
    }, []);

    useEffect(() => {
        // Завантажуємо тури
        const fetchTours = async () => {
            try {
                const allTours = await getAllTours();
                setTours(allTours);

                // Відфільтровуємо тури для вибраного напрямку
                const filteredTours = allTours.filter(
                    tour => tour.country === selectedDestination
                );
                setToursInSelectedDestination(filteredTours);
            } catch (error) {
                console.error('Помилка при завантаженні турів:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTours();
    }, [selectedDestination]);

    // Ініціалізуємо карту після завантаження Leaflet та компонента
    useEffect(() => {
        if (leafletLoaded && document.getElementById('interactive-map') && !mapRef.current) {
            initMap();
        }

        // Функція очищення
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [leafletLoaded]);

    // Ефект, який спрацьовує при зміні обраного напрямку
    useEffect(() => {
        if (mapRef.current && selectedDestination) {
            updateMapForDestination(selectedDestination);

            // Відфільтровуємо тури для вибраного напрямку
            const filteredTours = tours.filter(
                tour => tour.country === selectedDestination
            );
            setToursInSelectedDestination(filteredTours);
        }
    }, [selectedDestination, tours]);

    // Ініціалізація карти
    const initMap = () => {
        // Перевіряємо, чи доступний Leaflet
        if (!window.L) {
            console.error('Leaflet не завантажений');
            return;
        }

        const L = window.L;

        // Перевіряємо чи контейнер карти існує
        const mapContainer = document.getElementById('interactive-map');
        if (!mapContainer) {
            console.error('Контейнер карти не знайдений');
            return;
        }

        try {
            // Створюємо карту
            mapRef.current = L.map('interactive-map').setView(
                [destinations[selectedDestination].lat, destinations[selectedDestination].lng],
                destinations[selectedDestination].zoom
            );

            // Додаємо шар карти
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            // Додаємо початковий маркер
            const marker = L.marker([
                destinations[selectedDestination].lat,
                destinations[selectedDestination].lng
            ])
                .addTo(mapRef.current)
                .bindPopup(selectedDestination)
                .openPopup();

            markersRef.current.push(marker);
        } catch (error) {
            console.error('Помилка при ініціалізації карти:', error);
        }
    };

    // Оновлення карти при зміні напрямку
    const updateMapForDestination = (destination) => {
        if (!mapRef.current || !window.L) return;

        const L = window.L;
        const destInfo = destinations[destination];

        try {
            // Змінюємо центр карти
            mapRef.current.setView([destInfo.lat, destInfo.lng], destInfo.zoom);

            // Видаляємо всі попередні маркери
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    mapRef.current.removeLayer(marker);
                });
                markersRef.current = [];
            }

            // Видаляємо попередній маршрут, якщо він існує
            if (routeControlRef.current) {
                mapRef.current.removeControl(routeControlRef.current);
                routeControlRef.current = null;
            }

            // Додаємо новий маркер
            const marker = L.marker([destInfo.lat, destInfo.lng])
                .addTo(mapRef.current)
                .bindPopup(destination)
                .openPopup();

            markersRef.current.push(marker);
        } catch (error) {
            console.error('Помилка при оновленні карти:', error);
        }
    };

    // Показати маршрут туру на карті
    const showTourRoute = (tour) => {
        if (!mapRef.current || !tour.cities || tour.cities.length === 0 || !window.L) return;

        const L = window.L;

        try {
            // Видаляємо всі попередні маркери
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => {
                    mapRef.current.removeLayer(marker);
                });
                markersRef.current = [];
            }

            // Видаляємо попередній маршрут, якщо він існує
            if (routeControlRef.current) {
                mapRef.current.removeControl(routeControlRef.current);
                routeControlRef.current = null;
            }

            // Додаємо маркери для кожного міста в маршруті
            const waypoints = [];
            tour.cities.forEach((city, index) => {
                const marker = L.marker([city.lat, city.lng])
                    .addTo(mapRef.current)
                    .bindPopup(`${index + 1}. ${city.name}`);

                markersRef.current.push(marker);
                waypoints.push(L.latLng(city.lat, city.lng));

                if (index === 0) {
                    marker.openPopup();
                }
            });

            // Визначаємо межі для автоматичного масштабування
            const bounds = L.latLngBounds(waypoints);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });

            // Якщо маємо більше одного міста та доступний плагін маршрутів, створюємо маршрут
            if (waypoints.length > 1 && window.L.Routing) {
                routeControlRef.current = L.Routing.control({
                    waypoints: waypoints,
                    routeWhileDragging: false,
                    lineOptions: {
                        styles: [{ color: '#223440', opacity: 0.7, weight: 5 }]
                    },
                    createMarker: () => null, // Не створюємо додаткові маркери
                    addWaypoints: false,
                    draggableWaypoints: false,
                    fitSelectedRoutes: false
                }).addTo(mapRef.current);
            }

            // Оновлюємо інформацію про маршрут
            const selectedDestElement = document.getElementById('map-selected-destination');
            const descriptionElement = document.getElementById('map-destination-description');

            if (selectedDestElement) {
                selectedDestElement.textContent = tour.name;
            }
            if (descriptionElement) {
                descriptionElement.textContent =
                    `Маршрут туру "${tour.name}" проходить через міста: ${tour.cities.map(city => city.name).join(', ')}.`;
            }
        } catch (error) {
            console.error('Помилка при відображенні маршруту:', error);
        }
    };

    const handleDestinationClick = (destination) => {
        setSelectedDestination(destination);
    };

    if (loading) {
        return <div className="loading">Завантаження карти...</div>;
    }

    if (!leafletLoaded) {
        return <div className="loading">Завантаження бібліотеки карт...</div>;
    }

    return (
        <section id="map">
            <h2>Карта напрямків</h2>
            <div className="map-container">
                <div id="interactive-map"></div>
                <div className="map-info">
                    <h3>Наші напрямки</h3>
                    <ul id="map-destinations">
                        {Object.keys(destinations).map(destination => (
                            <li
                                key={destination}
                                data-lat={destinations[destination].lat}
                                data-lng={destinations[destination].lng}
                                className={`map-destination ${selectedDestination === destination ? 'active' : ''}`}
                                onClick={() => handleDestinationClick(destination)}
                            >
                                {destination}
                            </li>
                        ))}
                    </ul>
                    <div className="map-destination-info">
                        <h4 id="map-selected-destination">{selectedDestination}</h4>
                        <p id="map-destination-description">
                            {destinations[selectedDestination].description}
                        </p>
                    </div>

                    {/* Список турів для вибраного напрямку */}
                    {toursInSelectedDestination.length > 0 && (
                        <div className="map-tours">
                            <h4>Тури в {selectedDestination}</h4>
                            <ul className="map-tours-list">
                                {toursInSelectedDestination.map(tour => (
                                    <li
                                        key={tour.id}
                                        className="map-tour-item"
                                        onClick={() => showTourRoute(tour)}
                                    >
                                        {tour.name} - {tour.price} грн
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default MapView;