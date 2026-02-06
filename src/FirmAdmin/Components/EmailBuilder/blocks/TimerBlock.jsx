import React, { useState, useEffect } from 'react';

const TimerBlock = ({ data }) => {
    const [timeLeft, setTimeLeft] = useState({});

    useEffect(() => {
        if (!data.endDate) return;

        const calculateTimeLeft = () => {
            const difference = +new Date(data.endDate) - +new Date();
            let timeLeft = {};

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }

            return timeLeft;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [data.endDate]);

    const containerStyle = {
        textAlign: data.align,
        padding: '20px',
        backgroundColor: '#f8f9fa',
    };

    const titleStyle = {
        fontSize: data.fontSize,
        color: data.color,
        fontWeight: 'bold',
        marginBottom: '15px',
    };

    const timerStyle = {
        display: 'flex',
        gap: '20px',
        justifyContent: data.align,
        fontSize: '24px',
        fontWeight: 'bold',
    };

    const timeBoxStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    };

    const timeValueStyle = {
        fontSize: '32px',
        color: data.color,
    };

    const timeLabelStyle = {
        fontSize: '12px',
        color: '#666',
        textTransform: 'uppercase',
    };

    if (!data.endDate || Object.keys(timeLeft).length === 0) {
        return (
            <div style={containerStyle}>
                <div style={titleStyle}>{data.title}</div>
                <div style={{ color: '#999' }}>Timer not configured or expired</div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={titleStyle}>{data.title}</div>
            <div style={timerStyle}>
                {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} style={timeBoxStyle}>
                        <div style={timeValueStyle}>{value}</div>
                        <div style={timeLabelStyle}>{unit}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimerBlock;
