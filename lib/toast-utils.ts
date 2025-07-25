import { toast } from "@/components/ui/use-toast"

type MessageType = 'tilePlaced' | 'movement' | 'combat' | 'discovery' | 'levelUp' | 'achievement' | 'error' | 'questComplete';

// Get character name from localStorage
export function getCharacterName(): string {
  return localStorage.getItem("character-name") || "Adventurer"
}

// Define message templates for each type
const messageTemplates: Record<MessageType, string[]> = {
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

// Show a scroll-styled toast with a medieval message
export function showScrollToast(toastFn: typeof toast, title: string, description: string) {
  toastFn({
    title,
    description,
    variant: "default",
    className: "scroll-toast"
  })
} 