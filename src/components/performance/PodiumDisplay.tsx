
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
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

  // Garantir que temos exatamente 3 posições ou menos
  const podiumPositions = attendants.slice(0, 3);
  
  // Preencher posições ausentes se necessário
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
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Avatares dos participantes */}
          <div className="flex justify-center items-end gap-16 md:gap-20 mb-2 relative z-10">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center absolute left-0 md:left-10 lg:left-24 bottom-2">
              {podiumPositions[1] ? (
                <>
                  <Avatar className="w-16 h-16 border-2 border-gray-400 mb-1 z-10 bg-white">
                    <AvatarImage src={podiumPositions[1].url_imagem} alt={podiumPositions[1].nome} />
                    <AvatarFallback>{getInitials(podiumPositions[1].nome)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center bg-gray-800 px-2 py-0.5 rounded-lg opacity-80">
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

            {/* 1º Lugar */}
            <div className="flex flex-col items-center absolute top-[-80px] mx-auto left-0 right-0">
              {podiumPositions[0] ? (
                <>
                  <Avatar className="w-20 h-20 border-3 border-yellow-500 mb-1 z-10 bg-white shadow-lg">
                    <AvatarImage src={podiumPositions[0].url_imagem} alt={podiumPositions[0].nome} />
                    <AvatarFallback>{getInitials(podiumPositions[0].nome)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center bg-green-900 px-2 py-0.5 rounded-lg opacity-90">
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

            {/* 3º Lugar */}
            <div className="flex flex-col items-center absolute right-0 md:right-10 lg:right-24 bottom-2">
              {podiumPositions[2] ? (
                <>
                  <Avatar className="w-14 h-14 border-2 border-amber-700 mb-1 z-10 bg-white">
                    <AvatarImage src={podiumPositions[2].url_imagem} alt={podiumPositions[2].nome} />
                    <AvatarFallback>{getInitials(podiumPositions[2].nome)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-center bg-amber-900 px-2 py-0.5 rounded-lg opacity-80">
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
          
          {/* Imagem do pódio como background */}
          <div className="relative w-full h-[300px] flex justify-center">
            <img
              src="/lovable-uploads/ab7b1c8b-c2b0-4647-a74a-a249401f03a8.png"
              alt="Pódio"
              className="object-contain max-h-full max-w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PodiumDisplay;
