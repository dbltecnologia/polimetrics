
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'blue' | 'green' | 'orange' | 'red';
}

const colorClasses = {
    blue: { bg: "bg-blue-100", icon: "text-blue-600" },
    green: { bg: "bg-green-100", icon: "text-green-600" },
    orange: { bg: "bg-orange-100", icon: "text-orange-600" },
    red: { bg: "bg-red-100", icon: "text-red-600" },
};

export const StatCard = ({ title, value, icon: Icon, color = 'blue' }: StatCardProps) => {
    const selectedColor = colorClasses[color] || colorClasses.blue;

    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-5 flex items-center gap-5">
                <div className={`p-4 rounded-lg ${selectedColor.bg}`}>
                    <Icon className={`h-7 w-7 ${selectedColor.icon}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
};
