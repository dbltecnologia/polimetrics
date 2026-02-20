
import React from 'react';
import { Activity } from '../types/activity';

interface ActivityFeedProps {
    activities: Activity[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
    if (activities.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                <p>Nenhuma atividade registrada ainda.</p>
                <p>Toda nova ação aparecerá aqui.</p>
            </div>
        );
    }

    return (
        <ul>
            {activities.map(activity => (
                <li key={activity.id}>{activity.description}</li>
            ))}
        </ul>
    );
};
