import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer 
            className="text-center mt-12 py-4 animate-fade-in-up" 
            style={{ animationDelay: '500ms', opacity: 0 }}
        >
            <p className="text-xs text-gray-500 max-w-2xl mx-auto">
                <strong>Sanggahan:</strong> Analisis yang diberikan oleh alat AI ini hanya untuk tujuan informasi dan pendidikan dan tidak boleh dianggap sebagai nasihat keuangan. Perdagangan melibatkan risiko yang signifikan, dan Anda harus selalu melakukan riset sendiri dan berkonsultasi dengan penasihat keuangan yang berkualifikasi sebelum membuat keputusan investasi apa pun. Kinerja masa lalu tidak menunjukkan hasil di masa depan.
            </p>
        </footer>
    );
};