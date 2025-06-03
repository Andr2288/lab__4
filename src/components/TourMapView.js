import { useState, useEffect } from "react";
import { getAllTours } from "../services/tourService";
import MapComponent from "./MapComponent";

const TourMapView = () => {
    const [selectedDestination, setSelectedDestination] = useState('Туреччина');
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTour, setSelectedTour] = useState(null);
    const [points, setPoints] = useState([]);

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

    useEffect(() => {
        // Завантажуємо тури
        const fetchTours = async () => {
            try {
                const allTours = await getAllTours();
                setTours(allTours);

                // Відфільтровуємо тури для вибраного напрямку
                const filteredTours = allTours.filter(
                    (tour) => tour.country === getCountryId(selectedDestination)
                );

                if (filteredTours.length > 0) {
                    setSelectedTour(filteredTours[0]);
                    setPoints(filteredTours[0].cities || []);
                }
            } catch (error) {
                console.error('Помилка при завантаженні турів:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTours();
    }, [selectedDestination]);

    // Конвертація назви країни у ID
    const getCountryId = (countryName) => {
        const countryMap = {
            'Туреччина': 'turkey',
            'Швейцарія': 'switzerland',
            'Японія': 'japan'
        };
        return countryMap[countryName] || countryName.toLowerCase();
    };

    // Обробник вибору країни
    const handleDestinationClick = (destination) => {
        setSelectedDestination(destination);
        setSelectedTour(null);
        setPoints([]);
    };

    // Обробник вибору туру
    const handleTourClick = (tour) => {
        setSelectedTour(tour);
        setPoints(tour.cities || []);
    };

    // Отримуємо тури для вибраного напрямку
    const getToursForDestination = () => {
        return tours.filter(
            tour => tour.country === getCountryId(selectedDestination)
        );
    };

    if (loading) {
        return <div className="loading">Завантаження турів...</div>;
    }

    return (
        <section id="map">
            <h2>Карта напрямків</h2>
            <div className="map-container">
                <MapComponent
                    points={points}
                    initialCenter={destinations[selectedDestination]}
                    zoom={destinations[selectedDestination].zoom}
                />

                <div className="map-info">
                    <h3>Наші напрямки</h3>
                    <ul id="map-destinations">
                        {Object.keys(destinations).map((destination) => (
                            <li
                                key={destination}
                                className={`map-destination ${
                                    selectedDestination === destination ? "active" : ""
                                }`}
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
                    <div className="map-tours">
                        <h4>Тури в {selectedDestination}</h4>
                        <ul className="map-tours-list">
                            {getToursForDestination().map((tour) => (
                                <li
                                    key={tour.id}
                                    className={`map-tour-item ${
                                        selectedTour && selectedTour.id === tour.id ? "active" : ""
                                    }`}
                                    onClick={() => handleTourClick(tour)}
                                >
                                    {tour.name} - {tour.price} грн
                                </li>
                            ))}
                        </ul>
                    </div>

                    {selectedTour && (
                        <div className="selected-tour-info">
                            <h4>Інформація про маршрут</h4>
                            <p>Тур "{selectedTour.name}" проходить через міста: {
                                (selectedTour.cities || []).map(city => city.name).join(', ')
                            }</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TourMapView;