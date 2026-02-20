
import React, { useState } from 'react';

export const MemberForm: React.FC = () => {
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        const today = new Date().toISOString().split('T')[0];

        if (selectedDate > today) {
            setError('A data de nascimento não pode ser no futuro.');
        } else {
            setError('');
        }
        setBirthDate(selectedDate);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (error) {
            alert('Por favor, corrija os erros antes de enviar.');
            return;
        }
        // Lógica de envio do formulário...
        alert('Formulário enviado com sucesso!');
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="birthDate">Data de Nascimento:</label>
            <input 
                type="date" 
                id="birthDate" 
                value={birthDate} 
                onChange={handleDateChange} 
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button type="submit" disabled={!!error}>Salvar</button>
        </form>
    );
};
