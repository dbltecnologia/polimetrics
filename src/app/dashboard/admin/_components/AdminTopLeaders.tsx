import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getTopLeaders, TopLeader } from "@/services/admin/getTopLeaders";
import Image from "next/image";

export async function AdminTopLeaders() {
    const leaders = await getTopLeaders();

    return (
        <Card className="shadow-sm rounded-xl">
            <CardHeader>
                <CardTitle>Top 5 Líderes</CardTitle>
            </CardHeader>
            <CardContent>
                {leaders.length > 0 ? (
                    <ul className="space-y-4">
                        {leaders.map((leader, index) => (
                            <li key={leader.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-semibold text-gray-400 w-6">{index + 1}</span>
                                    <Image 
                                        src={leader.avatarUrl || '/images/default-avatar.png'}
                                        alt={`Avatar de ${leader.name}`}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-800">{leader.name}</p>
                                        {leader.community && <p className="text-xs text-gray-500">{leader.community}</p>}
                                    </div>
                                </div>
                                <div className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                                    {leader.totalPoints} pts
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <p>Nenhum líder encontrado ainda.</p>
                        <p className="text-sm">Os líderes com mais pontos aparecerão aqui.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
