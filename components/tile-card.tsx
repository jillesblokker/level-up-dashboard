interface TileCardProps {
  tile: {
    id: string;
    name: string;
    description: string;
    price: number;
    image?: string;
    type: string;
    connections: string[];
    rarity: string;
  };
  owned: boolean;
  onPurchase: () => void;
}

export function TileCard({ tile, owned, onPurchase }: TileCardProps) {
  const { type, connections = [] } = tile;
  // Render different tile types
  const renderTile = () => {
    switch (type) {
      case "grass":
        return (
          <div className="w-full h-full bg-green-800 flex items-center justify-center relative">
            {/* Base grass */}
            <div className="w-full h-full bg-green-700"></div>
            {/* Grass patches */}
            <div className="absolute top-1/4 left-1/4 w-1/5 h-1/5 bg-green-600 rounded-full"></div>
            <div className="absolute top-2/3 left-1/2 w-1/6 h-1/6 bg-green-600 rounded-full"></div>
            <div className="absolute top-1/2 left-1/6 w-1/4 h-1/4 bg-green-600 rounded-sm"></div>
            <div className="absolute bottom-1/4 right-1/4 w-1/5 h-1/5 bg-green-600 rounded-full"></div>
          </div>
        )
      case "forest":
        return (
          <div className="w-full h-full bg-green-900 flex items-center justify-center relative">
            {/* Base ground */}
            <div className="w-full h-full bg-green-800"></div>
            {/* Trees */}
            <div className="absolute top-1/4 left-1/4 w-1/5 h-1/5 bg-green-600 rounded-full shadow-md"></div>
            <div className="absolute top-1/3 right-1/4 w-1/4 h-1/4 bg-green-600 rounded-full shadow-md"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1/5 h-1/5 bg-green-600 rounded-full shadow-md"></div>
            <div className="absolute bottom-1/3 right-1/3 w-1/6 h-1/6 bg-green-600 rounded-full shadow-md"></div>
            <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 bg-green-600 rounded-full shadow-md"></div>
          </div>
        )
      case "water":
        return (
          <div className="w-full h-full bg-blue-900 flex items-center justify-center relative">
            {/* Base water */}
            <div className="w-full h-full bg-blue-800"></div>
            {/* Water ripples */}
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-blue-700 rounded-full opacity-50"></div>
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border-2 border-blue-700 rounded-full opacity-50"></div>
            <div className="absolute top-2/5 left-2/5 w-1/5 h-1/5 border-2 border-blue-700 rounded-full opacity-50"></div>
          </div>
        )
      case "mountain":
        return (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
            {/* Base ground */}
            <div className="w-full h-full bg-gray-700"></div>
            {/* Mountains */}
            <div className="absolute bottom-0 left-1/4 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[25px] border-l-transparent border-r-transparent border-b-gray-600"></div>
            <div className="absolute bottom-0 right-1/4 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-gray-500"></div>
            <div className="absolute bottom-0 left-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-gray-600"></div>
          </div>
        )
      case "desert":
        return (
          <div className="w-full h-full bg-amber-800 flex items-center justify-center relative">
            {/* Base sand */}
            <div className="w-full h-full bg-amber-700"></div>
            {/* Sand dunes */}
            <div className="absolute top-1/4 left-0 right-0 h-[2px] bg-amber-600 rounded-full"></div>
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-amber-600 rounded-full"></div>
            <div className="absolute top-3/4 left-0 right-0 h-[2px] bg-amber-600 rounded-full"></div>
            <div className="absolute top-1/3 right-1/4 w-1/5 h-1/5 bg-amber-600/50 rounded-full"></div>
          </div>
        )
      case "road":
        return (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
            {/* Base ground */}
            <div className="w-full h-full bg-gray-700"></div>
            {/* Road */}
            <div className="w-full h-1/3 bg-amber-900 absolute top-1/3"></div>
            {/* Road details */}
            <div className="absolute top-[45%] left-1/4 w-1/6 h-[2px] bg-amber-700"></div>
            <div className="absolute top-[45%] right-1/4 w-1/6 h-[2px] bg-amber-700"></div>
            <div className="absolute top-[55%] left-1/3 w-1/6 h-[2px] bg-amber-700"></div>
            <div className="absolute top-[55%] right-1/3 w-1/6 h-[2px] bg-amber-700"></div>
          </div>
        )
      case "crossroad":
        return (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
            {/* Base ground */}
            <div className="w-full h-full bg-gray-700"></div>
            {/* Horizontal road */}
            <div className="w-full h-1/3 bg-amber-900 absolute top-1/3"></div>
            {/* Vertical road */}
            <div className="h-full w-1/3 bg-amber-900 absolute left-1/3"></div>
            {/* Center intersection */}
            <div className="w-1/3 h-1/3 bg-amber-800 absolute top-1/3 left-1/3"></div>
          </div>
        )
      case "corner-road":
        return (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
            {/* Base ground */}
            <div className="w-full h-full bg-gray-700"></div>
            {/* Horizontal road */}
            <div className="w-2/3 h-1/3 bg-amber-900 absolute top-1/3 left-0"></div>
            {/* Vertical road */}
            <div className="h-2/3 w-1/3 bg-amber-900 absolute left-1/3 bottom-0"></div>
            {/* Corner piece */}
            <div className="w-1/3 h-1/3 bg-amber-800 absolute top-1/3 left-1/3 rounded-br-xl"></div>
          </div>
        )
      case "special":
        return (
          <div className="w-full h-full bg-purple-900 flex items-center justify-center relative">
            {/* Base ground */}
            <div className="w-full h-full bg-purple-800 flex items-center justify-center">
              {/* Special glow */}
              <div className="w-1/2 h-1/2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 animate-pulse"></div>
            </div>
            {/* Magical runes */}
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-purple-500 rounded-full"></div>
            <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 border border-purple-500 rounded-full"></div>
          </div>
        )
      default:
        return (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-gray-700 rounded-sm"></div>
          </div>
        )
    }
  }

  return (
    <div className="w-full rounded-lg border border-amber-800/20 bg-black overflow-hidden">
      <div className="w-full h-32 relative">
        {renderTile()}
      </div>
      <div className="p-3">
        <div className="font-medium text-white mb-1">{tile.name}</div>
        <div className="text-sm text-gray-400 mb-2">{tile.description}</div>
        <div className="flex justify-between items-center">
          <div className="text-amber-500 font-medium">{tile.price} Gold</div>
          {owned ? (
            <div className="text-green-500 text-sm">Owned</div>
          ) : (
            <button 
              onClick={onPurchase} 
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-md"
            >
              Purchase
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

