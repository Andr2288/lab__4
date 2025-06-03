import React, { useState } from 'react';
import TourMapView from './TourMapView';

const MapView = () => {
    const [activeTab, setActiveTab] = useState('tours');

    return (
        <section className="map-view-section">
            <h2>Інтерактивна карта</h2>

            <div className="map-tabs">
                <button
                    className={`map-tab ${activeTab === 'tours' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tours')}
                >
                    Тури та маршрути
                </button>
                <button
                    className={`map-tab ${activeTab === 'attractions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attractions')}
                >
                    Пам'ятки
                </button>
            </div>

            {activeTab === 'tours' && (
                <TourMapView />
            )}

            {activeTab === 'attractions' && (
                <div className="attractions-info">
                    <p>Розділ з пам'ятками знаходиться в розробці.</p>
                    <p>Скоро тут з'являться цікаві місця для відвідування!</p>
                </div>
            )}
        </section>
    );
};

export default MapView;