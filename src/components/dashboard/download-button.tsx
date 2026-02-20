
'use client';

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Helper to convert array of objects to CSV
const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => JSON.stringify(row[header], (_, value) => value === null ? '' : value)).join(',')
        )
    ];
    return csvRows.join('\n');
};

// Component to download data as CSV
export const DownloadButton = ({ data, filename }: { data: any[], filename: string }) => {
    
    const handleDownload = () => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4"/>
            Exportar CSV
        </Button>
    )
}
