interface CategoryLevel {
  name: string
  level: number
  color: string
}

interface BodySilhouetteProps {
  categories: CategoryLevel[]
}

export function BodySilhouette({ categories }: BodySilhouetteProps) {
  // Find category levels by name
  const getCategoryLevel = (name: string) => {
    const category = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    return category ? category.level : 0
  }

  // Get color for a category
  const getCategoryColor = (name: string) => {
    const category = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    return category ? category.color : "#ccc"
  }

  const strengthLevel = getCategoryLevel("strength")
  const conditionLevel = getCategoryLevel("condition")
  const knowledgeLevel = getCategoryLevel("knowledge")
  const nutritionLevel = getCategoryLevel("nutrition")
  const recoveryLevel = getCategoryLevel("recovery")
  const productivityLevel = getCategoryLevel("productivity")

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 300 500" className="w-full h-full">
        {/* Background elements - medieval style */}
        <defs>
          <pattern id="chainmail" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="5" cy="5" r="2" fill="none" stroke="#555" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Knight silhouette base */}
        <path
          d="M150,50 C180,50 200,70 200,90 C200,110 190,120 190,130 C190,140 195,145 195,150 C195,155 190,160 190,165 C190,170 200,175 200,190 C200,205 180,220 180,230 C180,240 190,250 190,260 C190,270 180,280 180,290 C180,300 190,320 190,340 C190,360 170,380 170,400 C170,420 180,440 180,460 C180,480 160,490 150,490 C140,490 120,480 120,460 C120,440 130,420 130,400 C130,380 110,360 110,340 C110,320 120,300 120,290 C120,280 110,270 110,260 C110,250 120,240 120,230 C120,220 100,205 100,190 C100,175 110,170 110,165 C110,160 105,155 105,150 C105,145 110,140 110,130 C110,120 100,110 100,90 C100,70 120,50 150,50"
          fill="#333"
          opacity="0.8"
        />

        {/* Chainmail texture overlay */}
        <path
          d="M150,50 C180,50 200,70 200,90 C200,110 190,120 190,130 C190,140 195,145 195,150 C195,155 190,160 190,165 C190,170 200,175 200,190 C200,205 180,220 180,230 C180,240 190,250 190,260 C190,270 180,280 180,290 C180,300 190,320 190,340 C190,360 170,380 170,400 C170,420 180,440 180,460 C180,480 160,490 150,490 C140,490 120,480 120,460 C120,440 130,420 130,400 C130,380 110,360 110,340 C110,320 120,300 120,290 C120,280 110,270 110,260 C110,250 120,240 120,230 C120,220 100,205 100,190 C100,175 110,170 110,165 C110,160 105,155 105,150 C105,145 110,140 110,130 C110,120 100,110 100,90 C100,70 120,50 150,50"
          fill="url(#chainmail)"
          opacity="0.5"
        />

        {/* Helmet */}
        <path
          d="M150,50 C170,50 180,60 180,70 C180,80 170,90 150,90 C130,90 120,80 120,70 C120,60 130,50 150,50"
          fill="#555"
        />
        <path d="M140,70 L160,70 L160,85 L140,85 Z" fill="#222" />
        <path d="M135,65 L165,65 L165,75 L135,75 Z" fill="#444" />

        {/* Shoulder plates */}
        <ellipse cx="110" cy="110" rx="20" ry="15" fill="#666" />
        <ellipse cx="190" cy="110" rx="20" ry="15" fill="#666" />

        {/* Shield on left arm */}
        <path
          d="M90,180 C70,170 70,190 70,200 C70,220 80,230 90,240 C100,230 110,220 110,200 C110,190 110,170 90,180"
          fill="#8B4513"
          stroke="#444"
          strokeWidth="2"
        />
        <circle cx="90" cy="210" r="10" fill="#A52A2A" stroke="#444" strokeWidth="1" />

        {/* Sword on right side */}
        <rect x="200" y="160" width="5" height="80" fill="#888" />
        <rect x="195" y="160" width="15" height="10" fill="#8B4513" />
        <path d="M202.5,240 L195,260 L210,260 Z" fill="#888" />

        {/* Brain - Knowledge */}
        <circle cx="150" cy="70" r="20" fill={getCategoryColor("knowledge")} opacity="0.7" />
        <text x="150" y="75" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {knowledgeLevel}
        </text>
        <text x="150" y="40" textAnchor="middle" fill={getCategoryColor("knowledge")} fontSize="12" fontWeight="bold">
          Wisdom
        </text>

        {/* Right Arm - Strength */}
        <ellipse cx="210" cy="180" rx="20" ry="30" fill={getCategoryColor("strength")} opacity="0.7" />
        <text x="210" y="185" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {strengthLevel}
        </text>
        <text x="240" y="180" textAnchor="start" fill={getCategoryColor("strength")} fontSize="12" fontWeight="bold">
          Might
        </text>

        {/* Chest - Condition */}
        <ellipse cx="150" cy="150" rx="40" ry="30" fill={getCategoryColor("condition")} opacity="0.7" />
        <text x="150" y="155" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {conditionLevel}
        </text>
        <text x="150" y="120" textAnchor="middle" fill={getCategoryColor("condition")} fontSize="12" fontWeight="bold">
          Endurance
        </text>

        {/* Stomach - Nutrition */}
        <ellipse cx="150" cy="230" rx="35" ry="30" fill={getCategoryColor("nutrition")} opacity="0.7" />
        <text x="150" y="235" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {nutritionLevel}
        </text>
        <text x="150" y="200" textAnchor="middle" fill={getCategoryColor("nutrition")} fontSize="12" fontWeight="bold">
          Vitality
        </text>

        {/* Lower Body - Recovery */}
        <ellipse cx="150" cy="320" rx="40" ry="40" fill={getCategoryColor("recovery")} opacity="0.7" />
        <text x="150" y="325" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {recoveryLevel}
        </text>
        <text x="150" y="280" textAnchor="middle" fill={getCategoryColor("recovery")} fontSize="12" fontWeight="bold">
          Resilience
        </text>

        {/* Left Arm - Productivity */}
        <ellipse cx="90" cy="180" rx="20" ry="30" fill={getCategoryColor("productivity")} opacity="0.7" />
        <text x="90" y="185" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {productivityLevel}
        </text>
        <text x="60" y="180" textAnchor="end" fill={getCategoryColor("productivity")} fontSize="12" fontWeight="bold">
          Dexterity
        </text>

        {/* Decorative elements */}
        <path d="M150,390 L160,420 L140,420 Z" fill="#666" />
        <rect x="145" y="420" width="10" height="30" fill="#666" />
      </svg>
    </div>
  )
}

