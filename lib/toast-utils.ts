import { toast } from "@/components/ui/use-toast"

type MessageType = 'tilePlaced' | 'movement' | 'combat' | 'discovery' | 'levelUp' | 'achievement' | 'error' | 'warning' | 'questComplete';

// Get character name from localStorage
export function getCharacterName(): string {
  const name = localStorage.getItem("character-name");
  return name || "adventurer";
}

// Define message templates for each type
const messageTemplates = {
  tilePlaced: [
    "By your command, {name}, the realm grows ever grander!",
    "A wise choice, {name}! The kingdom expands with each stone laid.",
    "Your vision takes shape, {name}, as the realm flourishes!",
    "Another masterful addition to your domain, {name}!",
  ],
  movement: [
    "Onward, brave {name}! New adventures await.",
    "Your journey continues, noble {name}.",
    "Swift as the wind, {name} ventures forth!",
    "The realm beckons, and {name} answers the call.",
  ],
  combat: [
    "Stand your ground, mighty {name}!",
    "Show them your valor, {name}!",
    "May your sword strike true, {name}!",
    "Victory shall be yours, brave {name}!",
  ],
  discovery: [
    "What wonders have you found, curious {name}?",
    "A remarkable discovery, {name}! The sages will be pleased.",
    "The mysteries of the realm unfold before you, {name}.",
    "Your explorations bear fruit, intrepid {name}!",
  ],
  levelUp: [
    "Hark! {name} grows ever more powerful!",
    "The legends of {name} spread far and wide!",
    "Your deeds echo through the realm, mighty {name}!",
    "Rise in glory, {name}! Your legend grows!",
  ],
  achievement: [
    "A triumph worthy of song, {name}!",
    "The bards shall sing of your deeds, {name}!",
    "Glory and honor to {name}, champion of the realm!",
    "Your name shall be remembered, noble {name}!",
  ],
  warning: [
    "Take heed, {name}! A warning from the sages!",
    "Caution, noble {name}! The winds speak of danger.",
    "The ancient runes glow with warning, {name}!",
    "Hark! A portent of challenge approaches, {name}!",
  ],
  error: [
    "Alas, {name}, fate conspires against us!",
    "The stars are not aligned, dear {name}.",
    "Take heed, {name}, for danger blocks your path!",
    "By the ancient laws, {name}, this cannot be.",
  ],
  questComplete: [
    "Quest completed!",
    "Victory achieved!",
    "Mission accomplished!",
  ],
};

// Get a random message for the given type
function getRandomMessage(type: MessageType, name: string): string {
  const messages = messageTemplates[type];
  const message = messages[Math.floor(Math.random() * messages.length)];
  return message.replace(/{name}/g, name);
}

// Show a scroll-styled toast with a medieval message
export function showScrollToast(
  type: MessageType,
  title?: string,
  customMessage?: string
) {
  const name = getCharacterName();
  const message = customMessage || getRandomMessage(type, name);
  
  // Determine toast variant based on type
  let className = "scroll-toast";
  if (type === "error") {
    className += " error";
  } else if (type === "warning") {
    className += " warning";
  }
  
  toast({
    title: title || "📜 " + message,
    description: customMessage ? message : undefined,
    className,
  });
} 