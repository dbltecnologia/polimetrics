import React, { useEffect, useState } from 'react';
import { getLeadersByCity } from '../services/leaderService';
import { Leader } from '../types/leader';

interface LeaderTreeProps {
    cityId: string;
}

export const LeaderTree: React.FC<LeaderTreeProps> = ({ cityId }) => {
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                setLoading(true);
                const results = await getLeadersByCity(cityId);
                setLeaders(results);
            } catch (error) {
                console.error("Erro ao buscar a líderes:", error);
            } finally {
                setLoading(false);
            }
        };

        if (cityId) {
            fetchLeaders();
        }
    }, [cityId]);

    if (loading) {
        return <p>Carregando líderes...</p>;
    }

    if (!leaders.length) {
        return <p>Nenhum líder encontrado para esta cidade.</p>;
    }

    return (
        <div>
            <h2>Líderes Ativos</h2>
            {leaders.map(leader => (
                <div key={leader.id} style={{ marginLeft: '20px' }}>
                    <p>{leader.name || leader.user?.name} ({leader.role || 'Líder'})</p>
                </div>
            ))}
        </div>
    );
};
