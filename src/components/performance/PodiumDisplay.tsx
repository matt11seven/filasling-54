
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { AttendantPerformance } from "@/services/performance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface PodiumDisplayProps {
  attendants: AttendantPerformance[];
  isLoading: boolean;
}

const PodiumDisplay = ({ attendants, isLoading }: PodiumDisplayProps) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Pódio de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="text-center py-8">Carregando dados...</div>
        </CardContent>
      </Card>
    );
  }

  if (!attendants.length) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Pódio de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="text-center py-8">Não há dados de desempenho disponíveis ainda.</div>
        </CardContent>
      </Card>
    );
  }

  const podiumPositions = attendants.slice(0, 3);
  
  while (podiumPositions.length < 3) {
    podiumPositions.push(null as any);
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Pódio de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <div className="relative h-[350px] flex flex-col items-center">
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/lovable-uploads/a8bf7d3d-5889-4996-b0fa-0bc28f4bf03b.png"
              alt="Pódio"
              className="object-contain w-full h-full"
            />
          </div>
          
          <div className="relative z-10 w-full h-full flex items-start justify-center">
            {/* First place - centered and above the trophy */}
            <div className="absolute top-[40px] flex flex-col items-center">
              {podiumPositions[0] ? (
                <>
                  <Avatar className="w-20 h-20 border-3 border-yellow-500 mb-1 z-10 bg-white shadow-lg first-place-glow">
                    <AvatarImage src={podiumPositions[0].url_imagem} alt={podiumPositions[0].nome} />
                    <AvatarFallback>{getInitials(podiumPositions[0].nome)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center bg-green-900 px-3 py-1 rounded-lg opacity-90 shadow-md">
                    {podiumPositions[0].nome.split(' ')[0]}
                    <div className="text-xs text-green-300">
                      {podiumPositions[0].tempo_medio_formatado}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center opacity-60">
                  <span className="text-gray-500 font-bold">1</span>
                </div>
              )}
            </div>

            {/* Second place - above silver medal, further left */}
            <div className="absolute top-[90px] left-[40%] flex flex-col items-center">
              {podiumPositions[1] ? (
                <>
                  <Avatar className="w-16 h-16 border-2 border-gray-400 mb-1 z-10 bg-white">
                    <AvatarImage src={podiumPositions[1].url_imagem} alt={podiumPositions[1].nome} />
                    <AvatarFallback>{getInitials(podiumPositions[1].nome)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center bg-gray-800 px-2 py-0.5 rounded-lg opacity-90 shadow-md">
                    {podiumPositions[1].nome.split(' ')[0]}
                    <div className="text-xs text-gray-300">
                      {podiumPositions[1].tempo_medio_formatado}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center opacity-60">
                  <span className="text-gray-500 font-bold">2</span>
                </div>
              )}
            </div>

            {/* Third place - above bronze medal, further right */}
            <div className="absolute top-[90px] right-[40%] flex flex-col items-center">
              {podiumPositions[2] ? (
                <>
                  <Avatar className="w-14 h-14 border-2 border-amber-700 mb-1 z-10 bg-white">
                    <AvatarImage src={podiumPositions[2].url_imagem} alt={podiumPositions[2].nome} />
                    <AvatarFallback>{getInitials(podiumPositions[2].nome)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center bg-amber-900 px-2 py-0.5 rounded-lg opacity-90 shadow-md">
                    {podiumPositions[2].nome.split(' ')[0]}
                    <div className="text-xs text-amber-200">
                      {podiumPositions[2].tempo_medio_formatado}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center opacity-60">
                  <span className="text-gray-500 font-bold">3</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PodiumDisplay;
