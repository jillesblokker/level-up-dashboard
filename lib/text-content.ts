export const TEXT_CONTENT = {
    auth: {
        loading: "User authenticated, redirecting to kingdom...",
    },
    loading: {
        title: "Loading Your Adventure",
        tips: [
            "Every quest begins with a single step.",
            "Rest is as important as the battle.",
            "Check your inventory before venturing out.",
            "Allies can help you conquer the toughest challenges.",
            "Completing daily habits strengthens your character.",
            "Build your kingdom to unlock new possibilities.",
            "Consistency is the key to mastery.",
            "A sharp mind is better than a sharp sword.",
        ]
    },
    errorPage: {
        notFound: {
            title: "Quest Failed",
            description: "The path you seek lies shrouded in mist. The ancient scroll speaks of error 404 - a location beyond the known realm.",
            subtext: "The page you are looking for may have been moved, deleted, or perhaps never existed in this kingdom.",
            return: "Return to Kingdom",
            retrace: "Retrace Your Steps"
        },
        generic: {
            title: "Quest Failed",
            description: "A mysterious error has occurred in your adventure.",
            investigate: "The Royal Mages are investigating this issue. You can try again or return to the kingdom.",
            tryAgain: "Try Again",
            return: "Return to Kingdom"
        }
    },
    social: {
        header: {
            title: "TAVERN",
            subtitle: "Gather, compete, and forge alliances",
            guide: {
                title: "Tavern",
                subtitle: "The social heart of the realm",
                sections: {
                    alliances: "Form or join alliances to compete on the leaderboards and complete group quests.",
                    sendingQuests: "Help your friends level up! Send them custom quests and challenges to earn rewards together.",
                    leaderboards: "Check the global rankings to see who is the mightiest hero or most dominant alliance."
                }
            }
        },
        tabs: {
            allies: "My Allies",
            chronicles: "Chronicles",
            addFriend: "Add Friend",
            requests: "Requests"
        },
        emptyStates: {
            allies: {
                title: "No Allies Yet",
                description: "Add friends to compare stats and send quests!",
                action: "Find Friends"
            },
            search: {
                placeholder: "Search username...",
                button: "Search",
                searching: "Searching...",
                noResults: "No users found matching \"{query}\"",
                initial: "Search for your friends by username to add them to your allies."
            },
            requests: {
                noRequests: "No pending friend requests."
            }
        },
        friendCard: {
            status: {
                lastSeen: "Last seen: {date}",
                offline: "Offline",
                since: "Ally since {date}",
                incomingInfo: "Incoming Request",
                outgoingInfo: "Outgoing Request",
                level: "Lvl {level}"
            },
            actions: {
                visitKingdom: "Kingdom",
                visitKingdomMobile: "Visit",
                quest: "Quest",
                compare: "Compare",
                realm: "Realm",
                gift: "Gift",
                compareStats: "Compare Stats",
                visitRealm: "Visit Realm",
                sendGift: "Send Gift",
                cancel: "Cancel",
                accept: "Accept",
                decline: "Decline",
                addFriend: "Add Friend",
                remove: {
                    confirm: "Are you sure you want to remove this ally?",
                    success: "Ally removed from your list.",
                    title: "Friend Removed"
                }
            }
        },
        modals: {
            quest: {
                title: "Send Quest to {username}",
                description: "Create a custom quest for your ally. They will receive a notification.",
                form: {
                    title: "Quest Title",
                    titlePlaceholder: "e.g., Run 5km this week",
                    description: "Description",
                    descriptionPlaceholder: "Describe what they need to do...",
                    difficulty: "Difficulty",
                    category: "Category",
                    xpReward: "XP Reward",
                    goldReward: "Gold Reward",
                    cancel: "Cancel",
                    submit: "Send Quest"
                },
                toast: {
                    success: "Quest sent to {username}!",
                    error: "Failed to send quest"
                }
            },
            compare: {
                title: "Ally Comparison",
                description: "Comparing your stats with ",
                you: "You",
                level: "Level {level}"
            }
        },
        toasts: {
            requestSent: "Request Sent",
            requestSentDesc: "Friend request sent successfully!",
            friendAdded: "Friend Added",
            friendAddedDesc: "You are now allies!",
            requestDeclined: "Request Declined",
            requestDeclinedDesc: "Friend request declined.",
            error: "Error",
            errorGeneric: "Something went wrong"
        }
    },
    profile: {
        loading: "Loading your profile...",
        signIn: {
            title: "Join the Kingdom",
            description: "Access your realm, customize your avatar, and track your progress by signing in.",
            button: "Sign In to Your Realm"
        },
        hero: {
            role: "Realm Explorer",
            active: "Active"
        },
        quickAccess: {
            inbox: {
                title: "Inbox",
                newBadge: "{count} New",
                empty: "No new messages"
            },
            character: {
                title: "Character",
                level: "Lvl {level}"
            }
        },
        tabs: {
            avatar: "Avatar",
            profile: "Profile",
            colors: "Colors",
            settings: "Settings"
        },
        avatar: {
            title: "Avatar Customization",
            chooseType: "Choose Avatar Type",
            types: {
                initial: "Initial",
                default: "Default",
                custom: "Custom",
                noImage: "No image"
            },
            upload: {
                label: "Upload New Image",
                button: "Upload",
                uploading: "Uploading...",
                note: "Recommended: Square image, max 5MB. Your image will be cropped to fit."
            },
            cropper: {
                title: "Crop Avatar",
                description: "Crop your profile image to the perfect size",
                cancel: "Cancel",
                save: "Save Avatar",
                saving: "Saving..."
            },
            error: {
                fileSize: "File size must be less than 5MB",
                fileType: "File must be an image",
                failed: "Failed to update avatar"
            },
            success: "Avatar updated successfully"
        },
        info: {
            title: "Profile Information",
            displayNameLabel: "Display Name",
            displayNamePlaceholder: "Enter your display name",
            emailLabel: "Email Address",
            emailNote: "Email address is managed by your authentication provider.",
            save: "Save Changes",
            saving: "Saving Changes...",
            success: "Profile updated successfully",
            error: "Failed to update profile",
            saveButton: "Save Changes"
        },
        appearance: {
            title: "Avatar Appearance",
            bgColor: "Background Color",
            textColor: "Text Color",
            preview: {
                label: "Preview",
                text: "This is how your avatar will appear in the realm."
            },
            unavailable: {
                title: "Appearance customization is only available for initial avatars.",
                subtitle: "Switch to \"Initial\" avatar type to customize colors."
            }
        },
        settings: {
            audio: {
                title: "Audio Settings",
                enabled: "Audio Enabled",
                enabledDesc: "Background music and sounds are playing",
                disabled: "Audio Disabled",
                disabledDesc: "All audio is muted",
                toggle: {
                    enable: "Enable",
                    disable: "Disable"
                },
                disableAll: "Disable All Audio",
                disableAllDesc: "Turn off all music and sound effects completely",
                disableAllButton: "Disable All"
            },
            app: {
                title: "App Settings",
                tutorial: {
                    title: "Tutorial",
                    desc: "Open the interactive tutorial"
                },
                guide: {
                    title: "System Requirements",
                    desc: "View system requirements"
                },
                designSystem: {
                    title: "Design System",
                    desc: "View design components"
                },
                storedData: {
                    title: "Stored Data",
                    desc: "Manage local data"
                },
                dayNight: {
                    title: "Day/Night Cycle",
                    desc: "Atmosphere changes based on local time",
                    enabledToast: "Day/Night Cycle Enabled",
                    disabledToast: "Day/Night Cycle Disabled"
                },
                zenMode: {
                    title: "Zen Mode",
                    desc: "Minimal interface for focused adventuring",
                    enabledToast: "Zen Mode Enabled",
                    disabledToast: "Zen Mode Disabled"
                },
                visualFX: {
                    title: "Visual FX",
                    desc: "Toggle between high and minimal animations",
                    high: "High",
                    low: "Low"
                }
            },
            accountActions: {
                title: "Account Actions",
                userId: "User ID",
                copySuccess: "User ID copied to clipboard",
                logout: "Log out",
                deleteAccount: "Delete Account"
            },
            danger: {
                deleteAccount: {
                    button: "Delete Account",
                    errorTyped: "Please type DELETE to confirm",
                    success: "Account deleted successfully. Redirecting...",
                    dialog: {
                        title: "Delete Account",
                        desc: "This action is ",
                        descHighlight: "permanent and cannot be undone",
                        warningTitle: "The following data will be permanently deleted:",
                        warningItems: [
                            "Your character stats (level, XP, gold)",
                            "All quests, challenges, and milestones",
                            "Your kingdom and inventory",
                            "All progress and achievements",
                            "Your account and email address"
                        ],
                        inputLabel: "Type ",
                        inputLabelHighlight: "DELETE",
                        inputLabelSuffix: " to confirm:",
                        placeholder: "Type DELETE here",
                        cancel: "Cancel",
                        confirm: "Delete Forever",
                        deleting: "Deleting..."
                    }
                }
            }
        }
    },
    leaderboard: {
        title: "Realm Leaderboard",
        tabs: {
            xp: "XP",
            gold: "Gold",
            tiles: "Tiles",
            streak: "Streak",
            quests: "Quests",
            allies: "Allies"
        },
        descriptions: {
            xp: "Most Legendary Heroes",
            gold: "Wealthiest Lords & Ladies",
            tiles: "Greatest Realm Builders",
            streak: "Most Consistent Allies",
            quests: "Heroes of the Month",
            allies: "Dominant Alliances (Monthly)"
        },
        loading: "Consulting the Royal Archives...",
        empty: {
            title: "No Legends Found",
            subtitle: "Be the first to etch your name in history!"
        },
        card: {
            you: "You",
            level: "Lvl {level}"
        }
    },
    admin: {
        title: "Game Admin Dashboard",
        tabs: {
            realm: "Realm Map",
            quests: "Daily Quests",
            stats: "Player Stats",
            export: "Export/Import"
        },
        sections: {
            realm: {
                title: "Realm Map Editor",
                description: "Edit your realm layout and buildings",
                gridLabel: "Map Grid",
                selectedTile: "Selected Tile",
                save: "Save Changes"
            },
            quests: {
                title: "Daily Quests Manager",
                description: "Manage and track daily quests",
                load: "Load Quests"
            },
            stats: {
                title: "Player Statistics",
                description: "View and edit player stats",
                labels: {
                    gold: "Gold",
                    experience: "Experience",
                    level: "Level",
                    population: "Population"
                },
                update: "Update Stats"
            },
            export: {
                title: "Export/Import Data",
                description: "Backup or restore your game data",
                exportLabel: "Export Data",
                exportCsv: "Export as CSV",
                exportJson: "Export as JSON",
                importLabel: "Import Data",
                importButton: "Import Data"
            },
            seeding: {
                title: "Database Seeding",
                description: "Initialize database with default data",
                challenges: {
                    label: "Seed Challenges",
                    description: "Populate the challenges table with 24 workout challenges across 5 categories",
                    button: "Seed Workout Challenges",
                    seeding: "Seeding..."
                }
            }
        },
        toasts: {
            seedingSuccess: {
                title: "Success!",
                description: "Challenges seeded successfully"
            },
            seedingError: {
                title: "Error",
                description: "Failed to seed challenges"
            },
            networkError: {
                title: "Error",
                description: "Network error occurred"
            }
        },
        storedData: {
            title: "Build Status Dashboard",
            subtitle: "Monitor your application health and progress",
            tabs: {
                dashboard: "Dashboard",
                performance: "Performance",
                errors: "Error Logs",
                analytics: "Analytics",
                audio: "Audio Testing"
            },
            sections: {
                events: {
                    title: "Seasonal Events",
                    description: "Toggle seasonal events on/off. When off, seasonal tiles only appear naturally.",
                    winter: {
                        name: "Winter Festival",
                        desc: "Activates +20% gold and +10% EXP bonuses on winter tiles (Winter Fountain, Snowy Inn, Ice Sculpture, Fireworks Stand)"
                    },
                    harvest: {
                        name: "Harvest Festival",
                        desc: "Future event for harvest-themed tiles (Harvest Barn, Pumpkin Patch, Bakery, Brewery)"
                    },
                    active: "ACTIVE",
                    inactive: "INACTIVE",
                    activate: "Activate",
                    deactivate: "Deactivate",
                    howItWorks: {
                        label: "How it works:",
                        whenActive: "When ACTIVE: Seasonal tiles are fully available for purchase and placement, with bonus rewards",
                        whenInactive: "When INACTIVE: Seasonal tiles only appear naturally through rare drops or special events",
                        winterTiles: "Winter tiles: Winter Fountain, Snowy Inn, Ice Sculpture, Fireworks Stand",
                        harvestTiles: "Harvest tiles: Harvest Barn, Pumpkin Patch, Bakery, Brewery"
                    }
                },
                comparison: {
                    title: "Data Source Comparison",
                    description: "Compare data counts between localStorage and Supabase to identify synchronization issues",
                    helper: "This helps identify why kingdom stats might be missing data points",
                    comparing: "Comparing data sources...",
                    empty: "Click Compare Data Sources to analyze data synchronization",
                    synced: "Synced",
                    localAhead: "Local Ahead",
                    supabaseAhead: "Supabase Ahead",
                    error: "Error"
                },
                status: {
                    healthy: "HEALTHY",
                    warning: "WARNING",
                    error: "ERROR",
                    refresh: "Refresh All",
                    refreshStatus: "Refresh Status",
                    summary: "Summary",
                    categories: {
                        core: "Core Systems",
                        gameplay: "Gameplay Features",
                        social: "Social Features",
                        admin: "Admin Features",
                        overall: "Overall Build Progress"
                    }
                },
                testing: {
                    label: "Testing Options",
                    menuTitle: "Testing & Debug Options",
                    buttons: {
                        compare: "Compare Data Sources",
                        sync: "Sync to localStorage",
                        forceSync: "Force Sync All Data",
                        clear: "Clear All localStorage",
                        debug: "Debug localStorage",
                        testApis: "Test Individual APIs",
                        debugQuests: "Debug Quests",
                        testMatching: "Test Matching",
                        testSimple: "Test Simple Quest API"
                    }
                },
                summary: {
                    title: "Generate Summary Report",
                    description: "Create a comprehensive report of all issues for easy sharing and debugging",
                    button: "Generate & Copy Summary"
                }
            },
            toasts: {
                summaryCopied: "Summary copied to clipboard!",
                refreshed: "All data refreshed",
                export: "Exported {count} error logs",
                cleared: "Error logs cleared",
                synced: "Data synced to localStorage successfully!",
                forceSynced: "All data force synced successfully!",
                clearedLocal: "All localStorage data cleared!",
                debugLogged: "localStorage debug info logged to console",
                apisTested: "All APIs tested - check console for results"
            }
        },
        restore: {
            title: "Restore Character Stats",
            description: "Manually restore your character stats if they were lost",
            labels: {
                level: "Level",
                experience: "Experience",
                gold: "Gold"
            },
            placeholders: {
                level: "17",
                experience: "Enter your XP",
                gold: "Enter your gold"
            },
            button: "Restore Stats",
            toasts: {
                success: {
                    title: "Stats Restored",
                    description: "Level {level}, XP {experience}, Gold {gold}"
                },
                error: {
                    title: "Error",
                    description: "Failed to restore stats"
                }
            }
        }
    },
    town: {
        name: "Riverside Haven",
        description: "A peaceful town nestled by the river. Known for its friendly inhabitants and local crafts.",
        backToRealm: "Back to Realm",
        locations: {
            marketplace: {
                name: "Marketplace",
                description: "Buy and sell goods at the local market."
            },
            dragonsRest: {
                name: "The Dragon's Rest",
                description: "Rest and recover while listening to local gossip."
            },
            stables: {
                name: "Royal Stables",
                description: "Purchase horses and mounts for your journey."
            }
        }
    },
    kingdom: {
        items: {
            "material-planks": "Planks",
            "material-logs": "Logs",
            "sword-twig": "Twig",
            "sword-sunblade": "Sunblade",
            "sword-irony": "Irony",
            "armor-normalo": "Normalo",
            "armor-darko": "Darko",
            "armor-blanko": "Blanko",
            "fish-red": "Red Fish",
            "fish-blue": "Blue Fish",
            "fish-silver": "Silver Trout",
            "fish-golden": "Golden Carp",
            "fish-rainbow": "Rainbow Bass",
            "scroll-scrolly": "Scrolly",
            "scroll-perkamento": "Perkamento",
            "scroll-memento": "Memento",
            "potion-health": "Health Potion",
            "potion-gold": "Gold Potion",
            "potion-exp": "XP Potion",
            "artifact-crowny": "Crowny",
            "artifact-ringo": "Ringo",
            "artifact-staffy": "Staffy"
        },
        loading: "Loading your kingdom...",
        consumables: {
            artifact: "You used an artifact and gained {gold} gold!",
            scroll: "You used a scroll and gained {gold} gold!",
            healthPotion: "You used a Health Potion and restored 50 health!",
            goldPotion: "You used a Gold Potion and gained 50 gold!",
            xpPotion: "You used an Experience Potion and gained 50 XP!",
            generic: "You used {item}!",
            perkActive: "You used a {item}! The perk \"{perkName}\" is now active for 24 hours: {perkEffect}"
        },
        potions: {
            strength: {
                name: "Elixir of Strength",
                perks: {
                    might: { name: "Might Mastery", effect: "+10% XP & gold from Might activities per level" },
                    vitality: { name: "Vitality Sage", effect: "+10% XP & gold from Vitality activities per level" }
                }
            },
            wisdom: {
                name: "Elixir of Wisdom",
                perks: {
                    knowledge: { name: "Knowledge Seeker", effect: "+10% XP & gold from Knowledge activities per level" },
                    honor: { name: "Honor Guard", effect: "+10% XP & gold from Honor activities per level" }
                }
            },
            fortitude: {
                name: "Elixir of Fortitude",
                perks: {
                    castle: { name: "Castle Steward", effect: "+10% XP & gold from Castle activities per level" },
                    craft: { name: "Craft Artisan", effect: "+10% XP & gold from Craft activities per level" }
                }
            }
        },
        ui: {
            envoyMode: {
                badge: "ENVOY MODE",
                subtitle: "Exploring Ally's Kingdom",
                returnHome: "Return Home"
            },
            header: {
                myKingdom: "KINGDOM",
                myKingdomSubtitle: "Manage your kingdom and grow your prosperity",
                allyKingdom: "Ally Kingdom",
                allyKingdomSubtitle: "Observing the prosperity of your ally"
            },
            tabs: {
                thrivehaven: "Thrivehaven",
                journey: "Journey",
                inventory: "Bag",
                rewards: "Rewards"
            },
            loadingGrid: "Loading kingdom grid...",
            bag: {
                title: "Kingdom Bag",
                description: "Your equipment and resources",
                tabs: {
                    equipped: "Equipped",
                    stored: "Stored"
                }
            },
            itemUsedModal: {
                title: "Item Used",
                close: "Close"
            },
            buttons: {
                unequip: "Unequip",
                use: "Use",
                equip: "Equip",
                sell: "Sell {price}g"
            },
            inventory: {
                sellError: {
                    title: "Error",
                    description: "You must be logged in to sell items",
                    failed: "Failed to sell item: {error}"
                },
                status: {
                    equipped: "Equipped",
                    qty: "Qty: {quantity}"
                },
                unknownItem: "Unknown Item"
            },
            rewards: {
                title: "Kingdom Rewards",
                description: "Visit your kingdom tiles to earn gold and find items",
                guide: {
                    title: "Synergy Guide",
                    footer: "More synergies may be discovered as you level up!"
                },
                synergies: {
                    farm: { title: "Farm", needs: "Water" },
                    lumberMill: { title: "Lumber Mill", needs: "Forest" },
                    market: { title: "Market", needs: "Houses" },
                    castle: { title: "Castle", needs: "Space" },
                    water: { title: "Water Buildings", includes: "Includes: Fountain, Well, Fisherman", needs: "Water" },
                    blacksmith: { title: "Blacksmith", needs: "Mountain / Lava" },
                    shops: { title: "Shops & Inns", includes: "Includes: Inn, Bakery, Grocery, Foodcourt", needs: "Residents" },
                    magic: { title: "Magic & Study", includes: "Includes: Library, Wizard Tower", needs: "Quiet (Ice / Mountain)" },
                    crops: { title: "Crops", includes: "Includes: Vegetables, Pumpkin Patch", needs: "Grass / Water" }
                }
            },
            sellSuccess: {
                title: "Item Sold Successfully!",
                description: "You have successfully sold an item and gained gold.",
                continue: "Continue"
            },
            emptyBag: {
                title: "Your bag is empty, adventurer!",
                description: "Complete quests and explore your kingdom to find treasures and equipment.",
                noEquipped: "No items equipped",
                loading: "Loading inventory..."
            }
        }
    },
    kingdomGrid: {
        expansion: {
            locked: {
                title: "Expansion Locked",
                description: "Reach level {level} to expand your kingdom! (Current level: {current})"
            },
            success: {
                title: "Kingdom Expanded",
                description: "Your kingdom has been expanded with 3 new rows of vacant land!"
            },
            vacantTile: {
                name: "Vacant",
                description: "A vacant plot of land"
            }
        },
        placementHints: {
            farm: {
                good: "Great Spot! +20% Gold (Water nearby)",
                bad: "Tip: Place near Water for bonus gold"
            },
            lumber_mill: {
                good: "Perfect! +20% Gold (Forest nearby)",
                bad: "Tip: Place near Forest for bonus gold"
            },
            market: {
                good: "Booming Business! +{percent}% Gold (Near residents)",
                bad: "Tip: Place near Houses/Mansions for bonus gold"
            },
            castle: {
                good: "A majestic location for a Castle!",
                bad: "A Castle looks best with open space."
            },
            waterBuildings: {
                good: "Flowing Gold! +20% Gold (Water nearby)",
                bad: "Tip: Place near Water for bonus gold"
            },
            blacksmith: {
                good: "Forged in Fire! +25% Gold (Mountain/Lava nearby)",
                bad: "Tip: Place near Mountain or Lava for better forge heat"
            },
            sawmill: {
                good: "Efficient Cutting! +20% Gold (Forest nearby)",
                bad: "Tip: Place near Forest for bonus gold"
            },
            magic: {
                good: "Quiet Study! +30% Gold (Ice/Mountain nearby)",
                bad: "Tip: Place in quiet areas (Ice/Mountain) for focus"
            },
            commercial: {
                good: "Bustling! +{percent}% Gold (Near residents)",
                bad: "Tip: Place near Residents for bonus gold"
            },
            crops: {
                good: "Fertile Soil! +15% Gold (Water/Grass nearby)",
                bad: "Tip: Needs Water or Grass for better crops"
            },
            default: "Place {tile} here."
        }
    },
    quests: {
        form: {
            titleLabel: "Quest Title",
            titlePlaceholder: "What is your objective?",
            descriptionLabel: "Description (Optional)",
            descriptionPlaceholder: "Describe the trials ahead...",
            categoryLabel: "Category",
            difficultyLabel: "Difficulty",
            expectedReward: "Expected Reward",
            quote: "\"Valor awaits...\"",
            abandon: "Abandon",
            submit: "Add Quest",
            submitting: "Forging..."
        },
        toast: {
            successTitle: "Quest Embarked!",
            successDesc: "{name} has been added to your ledger.",
            errorGeneric: "Something went wrong",
            errorAdd: "Failed to add quest"
        },
        categories: {
            might: "Might",
            knowledge: "Knowledge",
            honor: "Honor",
            castle: "Castle",
            craft: "Craft",
            vitality: "Vitality",
            wellness: "Wellness",
            exploration: "Exploration"
        },
        difficulties: {
            easy: "Novice",
            medium: "Adventurer",
            hard: "Heroic",
            epic: "Legendary"
        },
        mastery: {
            title: "Mastery Ledger",
            subtitle: "Historical record of your discipline",
            tabs: {
                board: "Active Board",
                ledger: "Mastery Ledger"
            },
            grid: {
                days: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
                weeklyGoal: "Weekly Mandate",
                completions: "{current}/{target} this week"
            },
            stats: {
                monthly: "Moon Cycle",
                lifetime: "Eternal Record",
                fulfillment: "Mandate Fulfillment",
                completions: "Deeds Recorded"
            },
            form: {
                sectionTitle: "Strategic Mandate",
                periodLabel: "Frequency",
                countLabel: "Weekly Target",
                periods: {
                    daily: "Every Day",
                    weekly: "Weekly Ritual",
                    monthly: "Monthly Mandate"
                }
            }
        }
    },
    kingdomTiles: {
        crossroad: {
            name: "Crossroad",
            clickMessage: "A busy crossroad connecting the kingdom."
        },
        straightroad: {
            name: "Straight Road",
            clickMessage: "A straight road connecting the kingdom."
        },
        cornerroad: {
            name: "Corner Road",
            clickMessage: "A curved road connecting the kingdom."
        },
        tsplitroad: {
            name: "T-Split Road",
            clickMessage: "A T-shaped road split connecting three paths."
        },
        well: {
            name: "Well",
            clickMessage: "With a big throw your bucket lands with a splash in the water. You start pulling it up and there are gold coins shining on the bottom of the bucket!"
        },
        blacksmith: {
            name: "Blacksmith",
            clickMessage: "The blacksmith's forge glows with heat as you approach. He hands you a freshly crafted iron sword and a pouch of gold for your patronage."
        },
        sawmill: {
            name: "Sawmill",
            clickMessage: "The sawmill's blades whir as you collect freshly cut timber. The wood is perfect for crafting and building."
        },
        fisherman: {
            name: "Fisherman",
            clickMessage: "You cast your line into the water and feel a tug. Reeling it in, you catch a fish with gold coins in its mouth!"
        },
        grocery: {
            name: "Grocery",
            clickMessage: "The grocer greets you warmly and shows you today's fresh produce. Hidden among the vegetables, you discover some gold coins!"
        },
        foodcourt: {
            name: "Foodcourt",
            clickMessage: "The aroma of freshly cooked meals fills the air. As you enjoy your meal, you find gold coins hidden under your plate!"
        },
        vegetables: {
            name: "Vegetables",
            clickMessage: "You tend to the vegetable garden, pulling up carrots and potatoes. Among the roots, you discover gold coins buried in the soil!"
        },
        wizard: {
            name: "Wizard",
            clickMessage: "The wizard's tower hums with magical energy. He shares ancient knowledge and hands you a scroll, along with gold for your wisdom."
        },
        unknown: {
            name: "Unknown Tile",
            description: "A mysterious tile in your kingdom."
        },
        specialPrefix: "A special kingdom tile: ",
        temple: {
            name: "Temple",
            clickMessage: "The temple's peaceful atmosphere surrounds you. The priest blesses you with a health potion and offers gold for your devotion."
        },
        castle: {
            name: "Castle",
            clickMessage: "The castle's grandeur impresses you. The royal treasurer rewards your loyalty with gold and a valuable item from the royal vault."
        },
        mansion: {
            name: "Mansion",
            clickMessage: "The mansion's elegant halls welcome you. The noble owner appreciates your visit and rewards you with gold and a fine item."
        },
        fountain: {
            name: "Fountain",
            clickMessage: "The fountain's waters sparkle with magical energy. As you drink from it, you find gold coins at the bottom!"
        },
        mayor: {
            name: "Mayor",
            clickMessage: "The mayor greets you warmly in his office. He appreciates your service to the town and rewards you with gold and influence."
        },
        inn: {
            name: "Inn",
            clickMessage: "The inn's warm atmosphere welcomes you. The innkeeper shares local gossip and rewards you with gold and useful items."
        },
        jousting: {
            name: "Jousting",
            clickMessage: "The jousting arena echoes with the clash of lances. You participate in a tournament and win gold along with combat equipment."
        },
        archery: {
            name: "Archery",
            clickMessage: "The archery range tests your skill. You hit the target and find gold coins hidden behind the bullseye!"
        },
        watchtower: {
            name: "Watchtower",
            clickMessage: "From the watchtower's height, you spot something glinting in the distance. Investigating, you find gold and valuable information."
        },
        pond: {
            name: "Pond",
            clickMessage: "The pond's surface ripples as you approach. You spot gold coins glinting at the bottom and fish them out!"
        },
        windmill: {
            name: "Windmill",
            clickMessage: "The windmill's sails turn steadily. You collect freshly ground flour and discover gold coins mixed in with the grain!"
        },
        "winter-fountain": {
            name: "Winter Fountain",
            clickMessage: "Icicles glisten as the fountain flows with enchanted winter water. You scoop out a handful of coins sparkling like snow."
        },
        "snowy-inn": {
            name: "Snowy Inn",
            clickMessage: "Warm lights and cinnamon scents spill from the inn. The keeper slips you a festive pouch jingling with coins."
        },
        "ice-sculpture": {
            name: "Ice Sculpture",
            clickMessage: "An intricately carved sculpture hides a frosty cache—glimmering coins trapped within the ice."
        },
        "fireworks-stand": {
            name: "Fireworks Stand",
            clickMessage: "Crackling fuses and bright sparks—after the show, you find a tidy stack of celebration coins."
        },
        "pumpkin-patch": {
            name: "Pumpkin Patch",
            clickMessage: "You lift a plump pumpkin and discover coins tucked beneath the vines."
        },
        "harvest-barn": {
            name: "Harvest Barn",
            clickMessage: "Bales of hay and bustling workers—your share of the harvest includes a modest pouch of gold."
        },
        bakery: {
            name: "Bakery",
            clickMessage: "Fresh bread and warm pastries—tips and change accumulate into a tidy little treasure."
        },
        brewery: {
            name: "Brewery",
            clickMessage: "Foamy mugs and clinking tankards—profits from the evening's patrons fill your purse."
        },
        "market-stalls": {
            name: "Market Stalls",
            clickMessage: "Merchants haggle and shoppers browse—your cut of the stall fees comes in shiny coins."
        },
        library: {
            name: "Library",
            clickMessage: "Quiet stacks, rare tomes—an appreciative patron donates handsomely to your efforts."
        },
        "training-grounds": {
            name: "Training Grounds",
            clickMessage: "Sparring warriors and clashing steel—your prowess earns coin and respect."
        },
        stable: {
            name: "Stable",
            clickMessage: "Fresh hay and polished tack—your stable services bring in steady coin."
        },
        house: {
            name: "House",
            clickMessage: "The cozy house welcomes you with warmth. The residents appreciate your visit and reward you with gold for your hospitality."
        },
        jungle: {
            name: "Jungle",
            clickMessage: "You hack through the dense vines of the jungle. Amidst the exotic flora, you find ancient coins lost by past explorers."
        },
        ruins: {
            name: "Ancient Ruins",
            clickMessage: "You explore the crumbling stone structures. Hidden beneath a fallen pillar, you discover a stash of ancient gold."
        },
        graveyard: {
            name: "Graveyard",
            clickMessage: "A chill runs down your spine as you walk among the tombstones. You find some coins left as offerings on an old grave."
        },
        farmland: {
            name: "Farmland",
            clickMessage: "The crops are growing well. You help with the harvest and earn a fair share of the profits in gold."
        },
        oasis: {
            name: "Oasis",
            clickMessage: "The cool water of the oasis is refreshing. You find gold coins glimmering in the shallow pool."
        },
        "coral_reef": {
            name: "Mermaid",
            clickMessage: "You swim to the mermaid's rock. She smiles and points you toward a sunken chest filled with gold."
        },
        "crystal_cavern": {
            name: "Crystal Cavern",
            clickMessage: "The crystals hum with energy. You harvest a small glowing shard which turns into gold in your hand."
        },
        "floating_island": {
            name: "Island",
            clickMessage: "You row your boat to the mysterious island. On the shore, you find a chest washed up by the magical tide."
        }
    },
    riddleChallenge: {
        success: {
            title: "Correct!",
            description: "You've earned {xpAmount} XP for your wisdom!"
        },
        failure: {
            title: "Incorrect!",
            description: "You've lost {goldAmount} gold coins. Try again!"
        },
        insufficientGold: {
            title: "Not enough gold!",
            description: "You need at least 50 gold to attempt this riddle."
        },
        ui: {
            title: "Riddle Challenge",
            description: "Answer correctly to earn 50 XP. Wrong answers cost 50 gold.",
            correctOverlay: "Well done, wise one! Your answer is correct.",
            incorrectOverlay: "The correct answer is: {answer}"
        }
    },
    monsterBattle: {
        roundFailed: {
            title: "Round Failed!",
            description: "You lost {lostGold} gold! Try to remember the sequence better."
        },
        defeat: {
            title: "Defeat!",
            description: "The {monsterName} was too strong! You lost {goldLost} gold total."
        },
        genericVictory: {
            title: "Victory!",
            description: "You defeated the {monsterName}! Earned {earnedGold} gold and {earnedXP} XP! Achievement unlocked!"
        },
        victories: {
            '201': {
                title: "🐉 Dragon Slayer!",
                description: "After an epic Simon Says battle, you have vanquished the Ancient Dragon Dragoni and earned {earnedGold} gold and {earnedXP} XP for your legendary victory!"
            },
            '202': {
                title: "👹 Goblin Hunter!",
                description: "After a quick Simon Says battle, you have defeated the Crafty Goblin Orci and earned {earnedGold} gold and {earnedXP} XP for your swift victory!"
            },
            '203': {
                title: "🧌 Troll Crusher!",
                description: "After a challenging Simon Says battle, you have crushed the Mountain Troll Trollie and earned {earnedGold} gold and {earnedXP} XP for your mighty victory!"
            },
            '204': {
                title: "🧙 Dark Wizard Vanquished!",
                description: "After an intense Simon Says battle, you have vanquished the Dark Wizard Sorceror and earned {earnedGold} gold and {earnedXP} XP for your magical victory!"
            },
            '205': {
                title: "🦄 Pegasus Tamed!",
                description: "After a mystical Simon Says battle, you have tamed the Mystical Pegasus Peggie and earned {earnedGold} gold and {earnedXP} XP for your enchanting victory!"
            },
            '206': {
                title: "🧚 Fairy Friend!",
                description: "After a delightful Simon Says battle, you have befriended the Enchanted Fairy Fairiel and earned {earnedGold} gold and {earnedXP} XP for your charming victory!"
            }
        },
        ui: {
            battleAgainst: "Battle Against {monsterName}",
            roundDifficulty: "Round {round}/5 • Difficulty: {difficulty}",
            progress: "Progress",
            watchSequence: "👀 Watch the sequence carefully...",
            yourTurn: "Your turn! Repeat the sequence",
            victory: "🎉 Victory! You defeated the monster!",
            defeat: "💀 Defeat! The monster was too strong!",
            yourSequence: "Your sequence: {current}/{total}",
            closeBattle: "Close Battle"
        }
    },
    dailyHub: {
        loading: {
            spinner: "Summoning your daily adventure..."
        },
        header: {
            title: "Welcome, {name}!",
            defaultName: "Hero",
            subtitle: "Your daily adventure awaits. Complete quests, maintain your streak, and grow your kingdom.",
            cta: "Enter Your Kingdom"
        },
        stats: {
            streak: {
                title: "Current Streak",
                unit: "days"
            },
            level: {
                label: "Level {level}",
                xp: "/ {max} XP"
            },
            treasury: {
                title: "Treasury",
                unit: "Gold",
                weekly: "+{amount} earned this week"
            }
        },
        newPlayer: {
            title: "Beginner's Journey",
            subtitle: "Complete these tasks to learn the ropes"
        },
        actions: {
            questBoard: "Quest Board",
            kingdom: "Kingdom",
            realm: "Realm",
            newQuest: "New Quest"
        },
        favorites: {
            title: "Your Favorite Quests",
            viewAll: "View All",
            empty: {
                title: "No Favorite Quests Yet",
                description: "Star your favorite quests from the Quest Board to see them here for quick access.",
                button: "Browse Quest Board"
            }
        },
        log: {
            loading: "Loading favorited quests...",
            fail: "Failed to load favorited quests"
        }
    },
    navigation: {
        kingdom: "Kingdom",
        tasks: "Tasks",
        realm: "Realm",
        achievements: "Achievements",
        character: "Character",
        social: "Tavern"
    },
    questBoard: {
        header: {
            title: "Message Board",
            subtitle: "Complete daily quests to earn gold and experience. Build your legend!",
            guide: {
                title: "Quests",
                subtitle: "The foundation of your progression",
                sections: {
                    daily: { title: "Daily Tasks", content: "Short, repeatable tasks that maintain your discipline. Complete these to earn consistent gold and keep your 'Thrivehaven' buildings active." },
                    epic: { title: "Epic Challenges", content: "Difficult feats with major rewards. These require focus and often grant rare items or large chunks of experience for your character." },
                    milestones: { title: "Life Milestones", content: "Long-term goals that define your journey. Reaching these milestones unlocks permanent perks and prestigious titles for your profile." }
                }
            }
        },
        tabs: {
            tasks: "Tasks",
            challenges: "Challenges",
            milestones: "Milestones",
            recovery: "Recovery",
            sub: {
                errands: "Errands",
                progression: "Progression"
            }
        },
        buttons: {
            completeFavorites: "Complete {count} Favorites",
            completeAllFavorites: "Complete {count} Total Favorites",
            reset: "Reset Today's Quests",
            resetting: "Resetting...",
            add: "Add Milestone",
            cancel: "Cancel",
            delete: "Delete",
            save: "Save"
        },
        journey: {
            title: "Your Journey",
            streakBonus: {
                title: "Streak Bonus:",
                value: "+{amount} gold/day",
                max: "(Max 50 gold/day)"
            },
            streakScrolls: {
                title: "Streak Scrolls:",
                desc: "(Use to save a missed streak)"
            },
            stats: {
                quests: "{completed} / {total} quests",
                streak: "Day streak"
            }
        },
        modals: {
            delete: {
                questTitle: "Delete Quest",
                milestoneTitle: "Delete Milestone",
                confirm: "Are you sure you want to delete the quest \"{name}\"?",
                confirmMilestone: "Are you sure you want to delete the milestone \"{name}\"?",
                warning: "This action cannot be undone."
            },
            addMilestone: {
                title: "Add Custom Milestone",
                labels: {
                    name: "Name",
                    description: "Description",
                    category: "Category",
                    target: "Target Value",
                    unit: "Unit"
                },
                placeholders: {
                    name: "Milestone name",
                    description: "Description",
                    selectCategory: "Select category",
                    target: "Target value",
                    unit: "Unit (e.g. km, kg, days)"
                }
            },
            addChallenge: {
                title: "Add Custom Challenge",
                editTitle: "Edit Custom Challenge",
                labels: {
                    name: "Name",
                    instructions: "Instructions",
                    setsReps: "Sets/Reps",
                    tips: "Tips",
                    weight: "Weight"
                },
                placeholders: {
                    name: "Challenge name",
                    instructions: "Instructions",
                    setsReps: "e.g. 3x12",
                    tips: "Tips",
                    weight: "e.g. 8kg"
                }
            },
            addType: {
                title: "Add Challenge Type",
                placeholder: "Challenge type name"
            },
            editQuest: {
                title: "Edit Quest",
                save: "Save",
                cancel: "Cancel"
            },
            editChallenge: {
                title: "Edit Challenge",
                save: "Save",
                cancel: "Cancel"
            },
            editMilestone: {
                title: "Edit Milestone",
                save: "Save Changes",
                cancel: "Cancel"
            }
        },
        loading: "Loading authentication...",
        noUser: "No userId found. Please sign in to view your quests.",
        weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        toasts: {
            updateFailed: { title: "Update Failed", desc: "Failed to update milestone. Please try again." },
            questAdded: { title: "Quest Added", desc: "New quest has been successfully added." },
            error: { title: "Error", desc: "Failed to add quest. Please try again." },
            updateSuccess: { title: "Update Success", desc: "Milestone updated successfully." },
            streak: {
                quest: { title: "Quest Streak", desc: "You completed all quests for {category}! Streak increased to {streak} days. Earned {tokens} build token(s)!" },
                challenge: { title: "Challenge Streak", desc: "You completed all challenges for {category}! Streak increased to {streak} days. Earned {tokens} build token(s)!" },
                updated: { title: "Streak Updated", desc: "Your streak is now {streak} days!" },
                error: { title: "Error", desc: "Failed to update streak. Please try again." },
                frozen: { title: "❄️ Streak Frozen!", desc: "You used a Streak Scroll to save your {category} streak!" },
                lost: { title: "Streak Lost", desc: "You missed a day! Your {category} streak has been reset to 0." }
            },
            completion: {
                quest: { title: "⚔️ Quest Complete!", desc: "{name}\n+{gold} Gold  •  +{xp} XP" },
                questUncompleted: { title: "Quest Uncompleted", desc: "{name} marked as incomplete." },
                challenge: { title: "⚔️ Challenge Complete!", desc: "{name}\n+{gold} Gold  •  +{xp} XP" },
                challengeUncompleted: { title: "Challenge Uncompleted", desc: "{name} marked as incomplete." },
                milestone: { title: "🏆 Milestone Complete!", desc: "{name}\n+{gold} Gold  •  +{xp} XP" },
                milestoneUncompleted: { title: "Milestone Uncompleted", desc: "{name} marked as incomplete." },
                bulkFavorites: { title: "Bulk Complete Successful!", desc: "Completed {count} favorited quests in {category} category." },
                bulkAllFavorites: { title: "Bulk Complete Successful!", desc: "Completed {count} favorited quests across all categories." },
                bulkError: { title: "Error", desc: "Failed to complete favorited quests. Please try again." }
            },
            favorites: {
                updated: { title: "Favorite Updated", desc: "Quest favorite status updated." },
                error: { title: "Error", desc: "Failed to update favorite status." }
            },
            deletion: {
                quest: { title: "Quest Deleted", desc: "Quest has been successfully deleted." },
                questError: { title: "Error", desc: "Failed to delete quest. Please try again." },
                challenge: { title: "Challenge Deleted", desc: "Challenge has been successfully deleted." },
                challengeError: { title: "Error", desc: "Failed to delete challenge. Please try again." },
                milestone: { title: "Milestone Deleted", desc: "\"{name}\" has been successfully deleted." },
                milestoneError: { title: "Error", desc: "Failed to delete milestone. Please try again." }
            },
            addition: {
                milestone: { title: "Milestone Added", desc: "\"{name}\" has been added to your milestones." },
                milestoneError: { title: "Error", desc: "Failed to add milestone. Please try again." },
                challenge: { title: "Challenge Added", desc: "\"{name}\" has been added to your challenges." },
                challengeError: { title: "Error", desc: "Failed to add challenge. Please try again." }
            },
            updates: {
                quest: { title: "Quest Updated", desc: "Quest has been successfully updated." },
                questError: { title: "Error", desc: "Failed to update quest: {error}" },
                challenge: { title: "Challenge Updated", desc: "{name} has been updated successfully!" },
                challengeError: { title: "Update Failed", desc: "Failed to update challenge. Please try again." },
                milestone: { title: "Milestone Updated", desc: "{name} has been updated successfully!" }
            },
            manualReset: {
                complete: { title: "Manual Reset Complete", desc: "All quests have been reset successfully!" },
                error: { title: "Manual Reset Error", desc: "Failed to reset quests: {error}" }
            }
        },
        ui: {
            labels: {
                streak: "Day streak",
                challenges: "challenges",
                bonus: "Streak Bonus:",
                goldPerDay: "gold/day",
                maxBonus: "(Max 50 gold/day)",
                maxBonusShort: "(Max 50)",
                scrolls: "Streak Scrolls:",
                saveStreak: "(Use to save a missed streak)",
                saveStreakShort: "(Save streak)",
                difficulty: {
                    easy: "Easy",
                    medium: "Medium",
                    hard: "Hard"
                }
            }
        }
    },
    achievements: {
        header: {
            title: "Creature Collection",
            guide: {
                title: "Adventurer's Guide",
                subtitle: "Build your legacy in Thrivehaven",
                sections: {
                    collection: { title: "Creature Collection", content: "Roam the wild lands. Some creatures appear only to those who explore diligently and meet their unique criteria." },
                    battles: { title: "Battle Glories", content: "Test your memory and reflexes against legendary beasts. Victory rewards you with trophies." },
                    social: { title: "Social Deeds", content: "Strength lies in numbers. Build a network of allies and challenge each other to grow." }
                }
            }
        },
        ui: {
            showUnlocked: "Show unlocked",
            hideUnlocked: "Hide unlocked",
            empty: "No achievements unlocked yet. Start exploring to discover creatures!",
            noCreatures: "No creatures defined.",
            loading: "Loading Clerk...",
            error: "Failed to fetch achievements (status: {status})",
            genericError: "An error occurred while fetching achievements."
        },
        sections: {
            creatures: "Creatures",
            monsterBattles: "Monster Battles"
        },
        card: {
            hp: "HP",
            attack: "Attack",
            defense: "Defense",
            speed: "Speed",
            type: "Type",
            description: "Description",
            undiscovered: "Undiscovered Achievement"
        },
        definitions: {
            '107': { name: 'First Alliance', description: 'A lone wolf survives, but a pack thrives. Extend a hand to another.', condition: 'Add your first friend' },
            '108': { name: 'Guild Founder', description: 'A small party can accomplish great things. Expand your circle of trust to a hand\'s count.', condition: 'Add 5 friends' },
            '109': { name: 'Fellowship Leader', description: 'Your banner attracts many. Lead a party of ten brave souls.', condition: 'Add 10 friends' },
            '110': { name: 'Quest Giver', description: 'It is better to give than to receive. Challenge an ally to grow.', condition: 'Send your first quest to a friend' },
            '111': { name: 'Master Strategist', description: 'A true leader pushes their allies to greatness. Issue five challenges.', condition: 'Send 5 quests to friends' },
            '112': { name: 'Grand Questmaster', description: 'Your command over challenges is legendary. Ten allies have been tested by your hand.', condition: 'Send 10 quests to friends' },
            '201': { name: 'Ancient Dragon Slayer', description: 'Face the ancient winged beast. Watch its movements closely and strike true.', condition: 'Complete Simon Says battle against Dragon' },
            '202': { name: 'Goblin Hunter', description: 'The crafty looting menace hides in the shadows. Match its cunning moves.', condition: 'Complete Simon Says battle against Goblin' },
            '203': { name: 'Troll Crusher', description: 'A mountain of muscle blocks your path. Mimic its brute force to bring it down.', condition: 'Complete Simon Says battle against Troll' },
            '204': { name: 'Dark Wizard Vanquisher', description: 'Magic swirls in complex patterns. Memorize the arcane sequence to dispel the darkness.', condition: 'Complete Simon Says battle against Wizard' },
            '205': { name: 'Pegasus Tamer', description: 'A majestic creature of the clouds. Follow its graceful flight to earn its trust.', condition: 'Complete Simon Says battle against Pegasus' },
            '206': { name: 'Fairy Friend', description: 'Small and swift, dancing in the light. Keep up with the fae\'s rhythm.', condition: 'Complete Simon Says battle against Fairy' }
        }
    },
    character: {
        header: {
            title: "Character",
            guide: {
                title: "Character",
                subtitle: "Master your attributes",
                sections: {
                    titles: { title: "Titles", content: "Earn and equip prestigious titles that reflect your level and accomplishments in the realm." },
                    perks: { title: "Perks", content: "Activate mystical blessings and permanent perks to boost your experience and gold gains." },
                    strengths: { title: "Strengths", content: "Track your progress across various disciplines like Might, Knowledge, and Honor." }
                }
            }
        },
        ui: {
            loading: "Loading character data...",
            error: "Character Page Error",
            reload: "Reload Page",
            overview: {
                title: "Character Overview",
                description: "Your current progress, title, and active bonuses",
                level: "Level {level}",
                xpProgress: "{current} / {next} XP to Level {nextLevel}",
                titleHeader: "Title",
                nextTitle: "Next: {name} (Level {level})",
                activeBonuses: "Active Bonuses",
                noBonuses: "No enchanted blessings active. Seek the mystic arts to unlock your true potential."
            },
            tabs: {
                titles: "Titles",
                perks: "Perks",
                strengths: "Strengths"
            }
        },
        titles: {
            unlocked: "Unlocked",
            requires: "Requires Level {level}",
            current: "Current Title",
            achieved: "Achieved",
            locked: "Locked"
        },
        perks: {
            level: "Level {level}",
            levelMax: "Lvl {level}/{max}",
            levelReq: "Lvl {level}+",
            requires: "Requires Lvl {level}",
            category: "Category: {category}",
            cost: "Cost: {cost} gold",
            active: "Active",
            deactivate: "Deactivate",
            activate: "Activate ({cost} gold)",
            upgrade: "Upgrade ({cost} gold)",
            locked: "Reach Lvl {level} to unlock",
            remaining: "remaining",
            expired: "Expired"
        },
        strengths: {
            experience: "Experience",
            xpToNext: "{amount} XP to Lvl {level}",
            mastery: "{category} Mastery"
        },
        activePerkCard: {
            potionPerkObs: "{name} (Potion Perk)"
        },
        toasts: {
            perkLocked: { title: "Perk Locked", desc: "This perk requires level {level} to unlock." },
            activateLimit: { title: "Cannot Activate", desc: "This perk can only be activated once per week." },
            insufficientGold: { title: "Insufficient Gold", desc: "You need {amount} gold to activate this perk." },
            perkActivated: { title: "Perk Activated", desc: "{name} is now active for 24 hours!" },
            perkDeactivated: { title: "Perk Deactivated", desc: "{name} has been deactivated." },
            maxLevel: { title: "Max Level Reached", desc: "This perk is already at maximum level." },
            perkUpgraded: { title: "Perk Upgraded", desc: "{name} is now level {level}!" },
            insufficientGoldUpgrade: { title: "Insufficient Gold", desc: "You need {amount} gold to upgrade this perk." }
        },
        data: {
            titles: [
                { id: "t1", name: "Novice Adventurer", description: "A beginner on the path to greatness.", category: "General", requirement: "Reach level 5", rarity: "common" },
                { id: "t2", name: "Iron-Willed", description: "One who has shown exceptional determination.", category: "Resilience", requirement: "Complete a 30-day streak", rarity: "rare" },
                { id: "t3", name: "Strength Seeker", description: "A dedicated practitioner of physical power.", category: "Might", requirement: "Reach level 10 in Might", rarity: "uncommon" },
                { id: "t4", name: "Knowledge Keeper", description: "A scholar who values wisdom above all.", category: "Wisdom", requirement: "Read 10 books", rarity: "uncommon" },
                { id: "t5", name: "Winter Warrior", description: "One who thrives in the coldest season.", category: "Seasonal", requirement: "Complete the Winter Challenge", rarity: "epic" },
                { id: "t6", name: "Legendary Hero", description: "A true legend whose deeds will be remembered.", category: "General", requirement: "Reach level 50", rarity: "legendary" }
            ],
            perks: [
                { id: "perk-might", name: "Might Mastery", description: "Increase XP and gold from Might quests and milestones.", category: "might", effect: "+10% XP & gold from Might activities per level", requiredLevel: 20 },
                { id: "perk-knowledge", name: "Knowledge Seeker", description: "Increase XP and gold from Knowledge quests and milestones.", category: "knowledge", effect: "+10% XP & gold from Knowledge activities per level", requiredLevel: 25 },
                { id: "perk-honor", name: "Honor Guard", description: "Increase XP and gold from Honor quests and milestones.", category: "honor", effect: "+10% XP & gold from Honor activities per level", requiredLevel: 30 },
                { id: "perk-castle", name: "Castle Steward", description: "Increase XP and gold from Castle quests and milestones.", category: "castle", effect: "+10% XP & gold from Castle activities per level", requiredLevel: 35 },
                { id: "perk-craft", name: "Craft Artisan", description: "Increase XP and gold from Craft quests and milestones.", category: "craft", effect: "+10% XP & gold from Craft activities per level", requiredLevel: 40 },
                { id: "perk-vitality", name: "Vitality Sage", description: "Increase XP and gold from Vitality quests and milestones.", category: "vitality", effect: "+10% XP & gold from Vitality activities per level", requiredLevel: 45 }
            ],
            strengths: [
                { id: "might", name: "Might", category: "might", description: "Physical strength and combat prowess", icon: "⚔️", color: "text-red-500" },
                { id: "knowledge", name: "Knowledge", category: "knowledge", description: "Intellectual wisdom and learning", icon: "📚", color: "text-blue-500" },
                { id: "honor", name: "Honor", category: "honor", description: "Noble character and integrity", icon: "👑", color: "text-yellow-500" },
                { id: "castle", name: "Castle", category: "castle", description: "Leadership and governance", icon: "🏰", color: "text-purple-500" },
                { id: "craft", name: "Craft", category: "craft", description: "Artisan skills and craftsmanship", icon: "🔨", color: "text-amber-500" },
                { id: "vitality", name: "Vitality", category: "vitality", description: "Health, endurance, and life force", icon: "❤️", color: "text-green-500" },
                { id: "wellness", name: "Wellness", category: "wellness", description: "Mental and physical well-being", icon: "☀️", color: "text-amber-400" },
                { id: "exploration", name: "Exploration", category: "exploration", description: "Discovery and adventure", icon: "🧭", color: "text-blue-400" }
            ]
        }
    },
    market: {
        header: {
            title: "Market",
            subtitle: "Purchase tiles to expand your kingdom",
            back: "Back to Kingdom",
            checkout: "Checkout ({count})"
        },
        filters: {
            title: "Filters",
            search: "Search",
            searchPlaceholder: "Search tiles...",
            category: "Category",
            rarity: "Rarity",
            categories: {
                all: "All",
                terrain: "Terrain",
                special: "Special"
            },
            rarities: {
                all: "All",
                common: "Common",
                uncommon: "Uncommon",
                rare: "Rare",
                epic: "Epic"
            }
        },
        cart: {
            title: "Cart",
            items: "{count} items",
            empty: "Your cart is empty",
            total: "Total",
            gold: "{amount} Gold",
            purchase: "Purchase"
        },
        list: {
            title: "Available Tiles",
            count: "{count} tiles",
            addToCart: "Add to Cart"
        },
        toasts: {
            added: { title: "Added to cart", desc: "{name} has been added to your cart." },
            removed: { title: "Removed from cart", desc: "Item has been removed from your cart." },
            empty: { title: "Cart is empty", desc: "Add some tiles to your cart before checking out." },
            insufficient: { title: "Not enough gold", desc: "You need {amount} gold to purchase these tiles." },
            success: { title: "Purchase successful", desc: "You've purchased {count} tiles for {amount} gold. Tiles have been added to your inventory." }
        },
        data: {
            tiles: [
                { id: "grass-1", type: "grass", name: "Grassland", description: "A simple grassy plain.", cost: 10, rarity: "common", category: "terrain", connections: [] },
                { id: "forest-1", type: "forest", name: "Forest", description: "A dense forest with tall trees.", cost: 20, rarity: "common", category: "terrain", connections: [] },
                { id: "water-1", type: "water", name: "Lake", description: "A serene body of water with gentle waves.", cost: 30, rarity: "uncommon", category: "terrain", connections: [] },
                { id: "mountain-1", type: "mountain", name: "Mountain", description: "A tall, rocky mountain peak.", cost: 40, rarity: "uncommon", category: "terrain", connections: [] },
                { id: "desert-1", type: "desert", name: "Desert", description: "A hot, sandy desert landscape.", cost: 25, rarity: "uncommon", category: "terrain", connections: [] },
                { id: "special-1", type: "special", name: "Ancient Temple", description: "A mysterious temple from a forgotten era.", cost: 100, rarity: "rare", category: "special", connections: [] },
                { id: "special-2", type: "special", name: "Desert Oasis", description: "A lush oasis in the middle of the desert.", cost: 120, rarity: "rare", category: "special", connections: [] },
                { id: "special-3", type: "special", name: "Coastal Village", description: "A small fishing village by the sea.", cost: 150, rarity: "epic", category: "special", connections: [] }
            ]
        }
    },
    settings: {
        header: {
            title: "Settings",
            subtitle: "Manage your account and preferences",
            back: "Back to Kingdom"
        },
        tabs: {
            profile: "Profile",
            appearance: "Appearance",
            account: "Account"
        },
        profile: {
            title: "Character Profile",
            subtitle: "Update your character information",
            nameLabel: "Character Name",
            namePlaceholder: "Enter your character name",
            emailLabel: "Email Address",
            emailPlaceholder: "Enter your email address",
            emailNote: "Your email is used for notifications and account recovery",
            save: "Save Changes"
        },
        appearance: {
            title: "Visual Preferences",
            subtitle: "Customize your kingdom's atmosphere",
            dayNight: {
                label: "Day/Night Cycle",
                description: "Automatically adjust lighting and atmosphere based on your local time (Night: 8 PM - 6 AM)."
            }
        },
        account: {
            title: "Tutorial & Onboarding",
            subtitle: "Manage tutorial and onboarding settings",
            showTutorial: {
                desc: "Show the tutorial again to refresh your knowledge of the game.",
                button: "Show Tutorial"
            },
            resetTutorial: {
                desc: "Reset the tutorial to show it automatically on your next visit.",
                button: "Reset Tutorial"
            },
            github: {
                title: "GitHub Connection",
                connected: "Your account is connected to GitHub",
                disconnected: "Connect your account to GitHub to sync your data",
                userInfo: "Connected as: GitHub User"
            }
        },
        toasts: {
            profileUpdated: { title: "Profile Updated", desc: "Your profile information has been saved." },
            saveError: { title: "Error", desc: "Failed to save profile information." },
            onboardingReset: { title: "Onboarding Reset", desc: "The tutorial will be shown again on your next visit." },
            dayNightEnabled: { title: "Day/Night Cycle Enabled", desc: "Atmosphere will now change based on time." },
            dayNightDisabled: { title: "Day/Night Cycle Disabled", desc: "Atmosphere will remain static." }
        }
    },
    inventory: {
        header: {
            title: "Inventory",
            subtitle: "Manage your collected items, equipment, and resources"
        },
        ui: {
            yourItems: "Your Items",
            itemsFound: "{count} items found",
            refresh: "Refresh",
            loadingError: "Error",
            loadingErrorDesc: "Failed to load inventory items",
            quantity: "Quantity:",
            equipped: "Equipped",
            emptyTitle: "No items found",
            emptyAll: "Your inventory is empty. Start collecting items by completing quests and exploring the realm!",
            emptyFilter: "No {type} items found. Try completing quests or exploring different areas."
        },
        itemTypes: {
            all: "All",
            resource: "Resources",
            item: "Items",
            creature: "Creatures",
            scroll: "Scrolls",
            equipment: "Equipment",
            artifact: "Artifacts",
            book: "Books",
            mount: "Mounts",
            weapon: "Weapons",
            shield: "Shields",
            armor: "Armor"
        }
    },
    dungeon: {
        toasts: {
            complete: { title: "Dungeon Completed!", desc: "You successfully explored the dungeon and found {amount} gold!" },
            failed: { title: "Dungeon Failed", desc: "You were forced to retreat from the dungeon and lost {amount} gold." }
        },
        loading: "Loading dungeon...",
        header: {
            title: "Ancient Dungeon",
            titleDefault: "Adventure",
            subtitle: "Explore the depths and find treasure",
            subtitleDefault: "Face your challenges",
            return: "Return to Map"
        },
        challenge: {
            title: "Level {level} Dungeon Challenge",
            titleDefault: "Challenge",
            subtitle: "Solve the puzzle to navigate the dungeon safely",
            subtitleDefault: "Test your skills"
        },
        complete: {
            title: "Challenge Complete",
            desc: "You can now return to the map and continue your adventure.",
            button: "Return to Map"
        },
        noActive: {
            title: "No Active Challenge",
            desc: "Return to the map and find a dungeon to challenge.",
            button: "Return to Map"
        }
    },
    city: {
        error: {
            title: "Error",
            desc: "Unable to load city information."
        },
        notFound: {
            title: "City Not Found",
            desc: "We couldn't find the city you're looking for.",
            message: "The city \"{city}\" does not exist or has been removed."
        },
        back: "Back to Realm"
    },
    notifications: {
        header: {
            title: "Notifications",
            subtitle: "Kingdom Messages & Updates",
            back: "Back to Kingdom"
        },
        filters: {
            label: "Filters",
            searchLabel: "Search Messages",
            searchPlaceholder: "Search notifications...",
            typeLabel: "Message Type",
            types: {
                all: "All",
                achievement: "Achievements",
                quest: "Quests",
                friend: "Friends",
                system: "System"
            }
        },
        actions: {
            label: "Actions",
            markAllRead: "Mark All as Read",
            clearAll: "Clear All Messages"
        },
        tabs: {
            all: "All Messages",
            unread: "Unread Messages"
        },
        toasts: {
            markedRead: {
                title: "All notifications marked as read",
                desc: "You've caught up on all your kingdom's news!"
            },
            deleted: {
                title: "Notification deleted",
                desc: "The message has been removed from your inbox."
            },
            cleared: {
                title: "All notifications cleared",
                desc: "Your inbox is now empty and ready for new messages."
            }
        },
        empty: {
            all: {
                title: "No Messages Await",
                message: "The courier has not yet arrived with news from your kingdom.",
                description: "Complete quests and explore your realm to receive notifications from your loyal subjects.",
                button: "Embark on Your Quest"
            },
            unread: {
                title: "All Messages Read",
                message: "You've caught up on all your kingdom's news and updates.",
                description: "Continue your adventures to receive new notifications from your realm.",
                button: "Continue Your Journey"
            }
        },
        time: {
            justNow: "Just now",
            minutesAgo: "{count} minute{s} ago",
            hoursAgo: "{count} hour{s} ago",
            daysAgo: "{count} day{s} ago"
        }
    },
    realm: {
        loading: "Loading realm...",
        loadingStory: {
            title: "Exploring the lands of Valoreth",
            p1: "In the mystical realm of Valoreth, King Necrion sought treasures of growth.",
            p2: "Through ancient forests and crystal caves he wandered,",
            p3: "Each terrain revealing new mysteries and hidden wisdom.",
            p4: "Will you follow his path and claim your destiny?",
            p5: "The realm awaits those brave enough to grow stronger."
        },
        header: {
            title: "Realm",
            subtitle: "Explore and build your mystical realm",
            envoyTitle: "Ally Realm",
            envoySubtitle: "Observing a fellow pioneer's journey",
            envoyMode: "ENVOY MODE",
            envoyDesc: "Exploring Ally's Realm",
            returnHome: "Return Home"
        },
        guide: {
            title: "Realm",
            subtitle: "Pioneer a mystical world beyond your borders",
            exploration: {
                title: "Exploration Mode",
                content: "Navigate the unknown. Discover hidden secrets, rare resources, and mystical events as you uncover the fog of war."
            },
            building: {
                title: "Mystical Building",
                content: "Shape your domain. Placing mystical tiles requires specific ingredients, but rewards your kingdom with unique bonuses."
            },
            combat: {
                title: "Survival & Combat",
                content: "The realm is dangerous! Monsters may spawn as you explore. Equip strong gear from your inventory to triumph in battles."
            }
        },
        modes: {
            move: "Move",
            build: "Build",
            destroy: "Destroy",
            expand: "Expand",
            expandTooltip: "Expand your realm map to unlock 3 more rows",
            expandLocked: "Reach level {level} to expand further (Current: {current})",
            selected: "Selected",
            inventory: "Inventory",
            more: "More"
        },
        menu: {
            resetPosition: "Reset Position",
            resetRealm: "Reset Realm",
            autoSave: "Auto Save"
        },
        inventory: {
            title: "Realm Inventory",
            desc: "Manage your tiles and expanded territory."
        },
        toasts: {
            inventoryEmpty: {
                title: "📦 Empty Inventory",
                desc: "Your tile pouch is empty! Visit the market to restock your building materials."
            },
            monsterAppeared: {
                title: "Monster Appeared!",
                desc: "A {type} has appeared!"
            },
            uncharted: {
                title: "🌌 Uncharted Territory",
                desc: "The void stretches before you! Place a tile to claim this mysterious land."
            },
            cannotMove: {
                title: "Cannot Move",
                desc: "You cannot move to a {type} tile."
            },
            immovable: {
                title: "⛰️ Immovable Force",
                desc: "The {type} resists your power!"
            },
            devastated: {
                title: "💥 Devastated!",
                desc: "The tile has been removed."
            },
            winterForage: {
                title: "❄️ Winter Forage!",
                desc: "You found frozen berries under the snow. (+100 XP)"
            },
            rotated: {
                title: "Rotated",
                desc: "Rotated {name} to {deg}°."
            },
            inventoryOpened: {
                title: "Inventory Opened",
                desc: "Tile inventory opened (press \"i\" to open)"
            },
            positionReset: {
                title: "Position Reset",
                desc: "Character position reset to center"
            },
            monsterDefeated: {
                title: "Monster Defeated!",
                desc: "The realm is safer now."
            },
            victory: {
                title: "Victory!",
                desc: "Defeated the monster! +{gold} Gold, +{xp} XP"
            },
            defeat: {
                title: "Defeat",
                desc: "The monster was too strong!"
            }
        },
        events: {
            castle: {
                title: "Royal Audience with the King",
                desc: "You enter the grand hall of the castle and are summoned before the King. He sits on a golden throne, surrounded by advisors and guards. He peers down at you with curiosity.",
                rollDice: "Roll Dice",
                close: "Close",
                result1: "The King rewards your humble service with 20 gold for your travels. (Rolled {roll})",
                result2: "The King is impressed by your tales and grants you 40 EXP to continue your noble path. (Rolled {roll})",
                result3: "The King knights you an Honorary Guardian and gifts +1 {attr} to your Kingdom Inventory. (Rolled {roll})"
            },
            cave: {
                title: "Cave: Choose a Path",
                desc: "You find yourself at a fork deep in the heart of a shadowy cave. Three paths lie before you, each whispering fate in a different tone.\n\"Which path do you choose, brave adventurer?\"",
                path1: "Path 1: Gem Path",
                path2: "Path 2: Dark Path",
                path3: "Path 3: Light at the End",
                res1a: "You find a radiant Gem worth 80 gold!",
                res1b: "It's just dust and shadows… you find nothing.",
                res2a: "A friendly Wizard appears and grants you 120 EXP!",
                res2b: "You stumble through the dark with no gain.",
                res3a: "You emerge safely and gain 10 gold.",
                res3b: "It leads to a working volcano—you lose 10 gold in the chaos.",
                close: "Close"
            },
            mystery: {
                processing: "Processing your choice..."
            }
        },
        treasury: {
            title: "Treasury",
            taxes: "Taxes Collected",
            gold: "Gold",
            xp: "XP",
            collect: "Collect Taxes",
            earnMore: "How to earn more? (Synergies)"
        }
    },
    migration: {
        title: "Migration Status",
        loading: "Loading migration status...",
        complete: "Migration Complete",
        inProgress: "Migration In Progress",
        completeDesc: "All data has been successfully migrated to Supabase.",
        inProgressDesc: "Data migration is currently running. Please keep this page open.",
        userPreferences: {
            title: "User Preferences",
            empty: "No user preferences found."
        },
        realmData: {
            title: "Realm Data",
            empty: "No realm data found."
        },
        kingdomData: {
            title: "Kingdom Data",
            empty: "No kingdom data found."
        },
        localStorage: {
            title: "Local Storage Keys",
            notMigrated: "Not Migrated",
            allMigrated: "All relevant keys migrated."
        },
        process: {
            title: "Migration Process",
            phase1: "• Phase 1: Identifying local data and preferences",
            phase2: "• Phase 2: Uploading to Supabase secure storage",
            phase3: "• Phase 3: Verifying data integrity",
            phase4: "• Phase 4: Cleaning up local storage",
            footer: "This process ensures your progress is saved across devices."
        }
    },
    map: {
        redirect: "Redirecting to Realm Builder..."
    },
    manifest: {
        name: "Level Up - Medieval Habit Tracker",
        shortName: "Level Up",
        description: "Transform your habits into epic quests. Build your kingdom, level up your character, and conquer your goals in this medieval-themed habit tracker.",
        shortcuts: {
            quests: {
                name: "Daily Quests",
                shortName: "Quests",
                description: "View and complete your daily quests"
            },
            kingdom: {
                name: "Kingdom",
                shortName: "Kingdom",
                description: "Build and manage your kingdom"
            },
            character: {
                name: "Character",
                shortName: "Character",
                description: "View your character stats and achievements"
            }
        }
    },
    worldMap: {
        castle: {
            title: "Royal Castle",
            desc: "The heart of the kingdom. Manage your subjects and royal decrees.",
            button: "Enter Castle"
        },
        forest: {
            title: "Whispering Woods",
            desc: "Ancient trees guard secrets of the past. Gather resources and explore.",
            button: "Explore Woods"
        },
        mountain: {
            title: "Iron Peaks",
            desc: "Home to dragons and rich minerals. A challenge for the brave.",
            button: "Climb Peaks"
        },
        village: {
            title: "Thrive Haven",
            desc: "Your humble beginning. A safe place to rest and recover.",
            button: "Visit Village"
        },
        lake: {
            title: "Crystal Lake",
            desc: "Reflecting the stars above. A place of serenity and magic.",
            button: "Visit Lake"
        },
        market: {
            title: "Grand Bazaar",
            desc: "Trade wares and find rare items from distant lands.",
            button: "Visit Market"
        }
    },
    designSystem: {
        title: "Level Up Design System",
        desc: "A comprehensive guide to the medieval-themed components and styles used throughout the Level Up application.",
        features: ["Medieval Aesthetics", "Modern Usability", "Accessibility", "Responsive Design"],
        navigation: {
            title: "Navigation",
            items: ["Overview", "Colors", "Typography", "Spacing", "Tokens", "Components"]
        },
        overview: {
            title: "Design System Overview",
            philosophy: {
                title: "🎨 Design Philosophy",
                desc: "Our design system emphasizes medieval aesthetics while maintaining modern usability. We prioritize accessibility, performance, and consistent user experience across all platforms."
            },
            mobile: {
                title: "📱 Mobile First",
                desc: "Built with mobile devices in mind, ensuring touch-friendly interactions and responsive layouts that work seamlessly across all screen sizes."
            },
            accessibility: {
                title: "♿ Accessibility",
                desc: "WCAG 2.1 AA compliant with proper keyboard navigation, screen reader support, and high contrast ratios for inclusive user experience."
            },
            performance: {
                title: "⚡ Performance",
                desc: "Optimized for speed with efficient animations, lazy loading, and minimal bundle sizes to ensure smooth gameplay experience."
            }
        },
        colors: {
            title: "Complete Color System",
            desc: "Our comprehensive color system includes 50+ unique colors across the entire app, with carefully chosen semantic colors for different states and interactions.",
            primary: "Primary Brand Colors",
            inventory: "Complete Color Inventory",
            inventoryDesc: "Below is a comprehensive overview of all colors used in the app, including usage statistics and consolidation recommendations.",
            sections: {
                amber: "🔴 Amber/Gold Colors (Frequently Used)",
                green: "🟢 Green Colors (Frequently Used)",
                neutral: "⚫ Neutral Colors (Frequently Used)",
                red: "🔴 Red Colors (Frequently Used)",
                tiles: "🎨 Consolidated Tile Colors (Updated)",
                tilesDesc: "These colors have been successfully consolidated with design system colors for better consistency.",
                gradients: "🌈 Gradients",
                consolidation: "🎯 Consolidation Recommendations",
                uiImprovements: "🆕 Recent UI Improvements",
                colorRef: "📋 Color Reference System",
                semantic: "Semantic Colors"
            }
        },
        typography: {
            title: "Typography",
            desc: "Our typography system uses a combination of serif and sans-serif fonts to create a medieval aesthetic while maintaining excellent readability.",
            scale: {
                title: "Font Scale",
                items: {
                    "5xl": { label: "Hero Headings", example: "Thrivehaven Kingdom" },
                    "4xl": { label: "Page Headings", example: "Welcome to Your Realm" },
                    "3xl": { label: "Section Headings", example: "Character Stats" },
                    "2xl": { label: "Subsection Headings", example: "Achievements" },
                    "xl": { label: "Card Titles", example: "Quest Complete" },
                    "lg": { label: "Body Large", example: "Important game text" },
                    "base": { label: "Body Text", example: "Regular content and descriptions" },
                    "sm": { label: "Small Text", example: "Captions and metadata" },
                    "xs": { label: "Micro Text", example: "Tiny labels and notes" }
                }
            },
            families: {
                title: "Font Families",
                serif: { title: "Serif", desc: "Headings and titles" },
                sans: { title: "Sans-Serif", desc: "Body text and UI" },
                mono: { title: "Monospace", desc: "Code and data" }
            }
        },
        spacing: {
            title: "Spacing System",
            desc: "Our spacing system uses a 4px base unit to create consistent layouts and maintain visual harmony throughout the application."
        },
        tokens: {
            title: "Design Token System",
            desc: "Our design tokens provide a systematic approach to design decisions, ensuring consistency across all components and platforms.",
            animation: {
                title: "Animation Timing",
                fast: "Fast",
                normal: "Normal",
                slow: "Slow"
            },
            example: {
                title: "Example Usage",
                typography: "Typography Combination",
                colorSpacing: "Color & Spacing"
            }
        },
        components: {
            title: "Component Library",
            desc: "Our component library showcases the building blocks used throughout the application, demonstrating consistent design patterns and interactions.",
            basic: {
                title: "Basic UI Components",
                buttons: {
                    title: "Buttons",
                    desc: "Button component with multiple variants (default, secondary, outline, ghost, destructive) and sizes (default, sm, lg, icon). Includes proper accessibility attributes and hover states."
                },
                inputs: {
                    title: "Inputs & Forms",
                    desc: "Input and Textarea components with consistent styling, focus states, and proper accessibility labels.",
                    inputLabel: "Input Field",
                    inputPlaceholder: "Enter text...",
                    textareaLabel: "Textarea",
                    textareaPlaceholder: "Enter longer text..."
                },
                cards: {
                    title: "Cards",
                    desc: "Card components with header, content, and footer sections. Used for displaying content in organized containers throughout the app."
                },
                badges: {
                    title: "Badges",
                    desc: "Badge components for displaying status, categories, and labels. Available in default, secondary, destructive, and outline variants."
                },
                progress: {
                    title: "Progress Indicators",
                    desc: "Progress bars and loading states for showing completion status and loading indicators throughout the application."
                },
                checkboxes: {
                    title: "Checkboxes",
                    desc: "Checkbox components for boolean inputs with proper accessibility and visual states for checked, unchecked, and disabled states."
                }
            },
            navigation: {
                title: "Navigation Components",
                tabs: {
                    title: "Tabs",
                    desc: "Tabs component for organizing content into sections. Includes proper keyboard navigation and accessibility features."
                },
                tooltips: {
                    title: "Tooltips",
                    desc: "Tooltip components for displaying additional information when hovering over elements. Includes proper positioning and animations."
                },
                scrollArea: {
                    title: "Scroll Area",
                    desc: "ScrollArea component for custom scrollable content areas with styled scrollbars and proper overflow handling."
                }
            },
            game: {
                title: "Game-Specific Components",
                header: {
                    title: "HeaderSection",
                    desc: "HeaderSection is used as the main header/banner for most major pages. It supports a title, optional subtitle, and an optional image."
                },
                tile: {
                    title: "TileVisual",
                    desc: "TileVisual displays tile visuals with proper accessibility attributes. Used for rendering tiles in the realm and map views."
                },
                creature: {
                    title: "CreatureCard",
                    desc: "CreatureCard displays information about a creature, including its name, description, image, rarity, and discovery status."
                },
                quest: {
                    title: "Quest Card",
                    desc: "QuestCard displays quest information with progress tracking, completion status, and rewards. Includes interactive elements for toggling completion."
                }
            },
            feedback: {
                title: "Feedback Components",
                toast: {
                    title: "Toast Notifications",
                    button: "Show Toast Example",
                    desc: "Toast Notifications provide user feedback for actions and events. Used throughout the app for notifications and alerts with consistent styling and behavior."
                },
                alerts: {
                    title: "Alerts",
                    default: "This is a default alert message.",
                    destructive: "This is a destructive alert message.",
                    desc: "Alert components for displaying important messages and warnings. Available in default and destructive variants with proper iconography."
                },
                skeleton: {
                    title: "Skeleton Loading",
                    desc: "Skeleton loading components for showing loading states while content is being fetched or processed."
                },
                dialog: {
                    title: "Dialog/Modal",
                    dialogTitle: "Dialog Title",
                    dialogDesc: "Dialog description and content",
                    desc: "Dialog components for modal dialogs and overlays. Includes proper focus management, backdrop, and accessibility features."
                }
            },
            formExtend: {
                select: {
                    title: "Select Dropdown",
                    placeholder: "Select an option",
                    desc: "Select dropdown components for choosing from predefined options. Includes keyboard navigation and proper accessibility support."
                }
            },
            overlays: {
                hoverCard: {
                    title: "Hover Card",
                    trigger: "Hover over me",
                    cardTitle: "Hover Card Title",
                    cardDesc: "Additional information appears on hover",
                    desc: "HoverCard components for displaying additional information when hovering over elements. Includes proper positioning and animations."
                },
                sheet: {
                    title: "Sheet/Sidebar",
                    contentTitle: "Sidebar Content",
                    desc: "Sheet components for slide-out panels and sidebars. Available in different positions (top, right, bottom, left) with smooth animations."
                },
                command: {
                    title: "Command Palette",
                    placeholder: "Search commands...",
                    recent: "Recent",
                    openKingdom: "Open Kingdom",
                    viewQuests: "View Quests",
                    desc: "Command palette for quick actions and navigation. Includes search functionality and keyboard shortcuts."
                }
            },
            kingdomExtend: {
                properties: {
                    title: "Kingdom Properties System",
                    placeable: "Placeable Properties:",
                    functional: "Functional Tiles:",
                    material: "Material System:",
                    current: "Current Properties:",
                    materials: "Materials:",
                    desc: "Kingdom Properties System allows players to place buildings using materials. Separated from functional kingdom tiles that generate rewards. Properties stay on the map as functional buildings, not as inventory items."
                },
                stats: {
                    title: "Kingdom Stats Graph Component",
                    statsGraph: "Stats Graph",
                    gainsGraph: "Gains Graph",
                    desc: "Kingdom Stats Graph displays kingdom statistics and gains over time. Fixed authentication and data display with proper API integration."
                }
            },
            rules: {
                title: "Design System Rules",
                backgrounds: {
                    title: "Card Background Guidelines",
                    black: { title: "Black Background", desc: "Primary content cards, main UI elements" },
                    red: { title: "Red Background", desc: "Warning cards, error states, destructive actions" },
                    blue: { title: "Blue Background", desc: "Information cards, help content, neutral information" },
                    gray: { title: "Gray Background", desc: "Secondary content, sidebar elements" },
                    amber: { title: "Amber/Gold Background", desc: "Achievement cards, reward displays" }
                },
                usage: {
                    title: "Component Usage Rules",
                    buttons: { title: "Buttons" },
                    textColors: {
                        title: "Text Colors",
                        primary: "Primary text (text-white)",
                        secondary: "Secondary text (text-gray-300)",
                        muted: "Muted text (text-gray-400)",
                        accent: "Accent text (text-amber-400)",
                        success: "Success text (text-green-400)",
                        error: "Error text (text-red-400)"
                    },
                    spacing: {
                        title: "Spacing",
                        cards: "Cards:",
                        cardsVal: "p-4 (standard), p-6 (larger)",
                        sections: "Sections:",
                        sectionsVal: "mb-6 (standard), mb-4 (components)",
                        grid: "Grid:",
                        gridVal: "gap-4 (standard), gap-6 (larger)"
                    }
                },
                accessibility: {
                    title: "Accessibility Guidelines",
                    items: [
                        "✓ Always include focus-visible rings for interactive elements",
                        "✓ Use aria-label for all interactive elements",
                        "✓ Ensure sufficient contrast ratios for all text combinations",
                        "✓ All interactive elements must be keyboard accessible",
                        "✓ Use semantic HTML elements (section, main, nav, etc.)",
                        "✓ Provide alternative text for images and icons"
                    ]
                }
            }
        }
    },
    riddles: {
        title: "The Riddle Master's Challenge",
        rules: {
            title: "Riddle Rules",
            xpReward: "Each correct answer earns you",
            xpAmount: "50 XP",
            goldCost: "Each incorrect answer costs",
            goldAmount: "50 gold",
            requirement: "You must have enough gold to attempt a riddle",
            challenge: "Riddles become more challenging as you progress",
            titles: "Earn special titles by solving many riddles"
        },
        titles: {
            title: "Riddle Titles",
            desc: "Earn these prestigious titles by solving riddles",
            novice: { title: "Novice Riddler", count: "5 riddles" },
            solver: { title: "Puzzle Solver", count: "15 riddles" },
            master: { title: "Enigma Master", count: "30 riddles" },
            sage: { title: "Riddle Sage", count: "50 riddles" },
            sphinx: { title: "Grand Sphinx", count: "100 riddles" }
        }
    },
    setup: {
        title: "Database Setup",
        description: "This will create the required database tables for user preferences and realm data.",
        tablesTitle: "Tables to be created:",
        tables: {
            prefs: "user_preferences - Store user settings",
            realm: "realm_data - Store map/realm state"
        },
        status: {
            creating: "Creating database tables...",
            success: "Setup completed successfully!",
            failed: "Setup failed",
            errorPrefix: "Failed to run setup: ",
            completeButton: "Setup Complete",
            runButton: "Run Setup",
            finalMessage: "Setup completed! You can now use the application."
        },
        homeButton: "Go to Home"
    },
    restoreProgress: {
        title: "Restore Quest Progress",
        description: "Restore your quest completion progress and rewards from the database.",
        backLink: "Back to Quests",
        cardTitle: "Quest Progress Restore",
        explanation: {
            main: "This will restore your quest completion progress and add the corresponding XP and gold rewards to your character.",
            sub: "The system will find all completed quests in your database and restore the rewards."
        },
        button: {
            idle: "Restore Quest Progress",
            loading: "Restoring Progress..."
        },
        toast: {
            successTitle: "Progress Restored!",
            successDesc: "Successfully restored {count} quest completions with {xp} XP and {gold} gold!",
            failTitle: "Restore Failed",
            failDesc: "Failed to restore progress"
        },
        result: {
            success: "Restore Successful!",
            restored: "Restored {count} quest completions",
            xpAdded: "Added {xp} XP to your character",
            goldAdded: "Added {gold} gold to your character",
            newTotal: "New total: {xp} XP, {gold} gold"
        }
    },
    workouts: [
        {
            category: "Push/Legs/Core",
            exercises: [
                { name: "Squat (Barbell/Dumbbell)", instructions: "Feet shoulder-width, chest up, lower hips back and down.", setsReps: "3x10", tips: "Keep knees in line with toes.", weight: "2x10kg" },
                { name: "Push-up", instructions: "Hands shoulder-width, body in straight line, lower chest to floor.", setsReps: "3x12", tips: "Engage core, don't sag hips.", weight: "0" },
                { name: "Lunge (Walking/Static)", instructions: "Step forward, lower back knee, keep torso upright.", setsReps: "3x10 per leg", tips: "90-degree angle at knees.", weight: "2x8kg" },
                { name: "Dumbbell Shoulder Press", instructions: "Seated or standing, press weights overhead.", setsReps: "3x10", tips: "Don't arch back excessively.", weight: "2x8kg" },
                { name: "Plank", instructions: "Forearms on ground, body straight, hold.", setsReps: "3x45 sec", tips: "Squeeze glutes and core.", weight: "0" },
                { name: "Leg Raise", instructions: "Lying on back, lift legs to 90 degrees, lower slowly.", setsReps: "3x12", tips: "Keep lower back pressed to floor.", weight: "0" }
            ]
        },
        {
            category: "Pull/Shoulder/Core",
            exercises: [
                { name: "Deadlift (Dumbbell/Kettlebell)", instructions: "Hinge at hips, keep back flat, lift weight.", setsReps: "3x10", tips: "Drive through heels.", weight: "2x12kg" },
                { name: "Dumbbell Row", instructions: "Hand on bench, pull weight to hip.", setsReps: "3x10 per arm", tips: "Squeeze shoulder blade.", weight: "12kg" },
                { name: "Lateral Raise", instructions: "Lift weights to side until shoulder height.", setsReps: "3x12", tips: "Lead with elbows.", weight: "2x4kg" },
                { name: "Bicep Curl", instructions: "Curl weights up, keep elbows pinned.", setsReps: "3x12", tips: "Control the descent.", weight: "2x8kg" },
                { name: "Russian Twist", instructions: "Seated, lean back, twist torso side to side.", setsReps: "3x20 total", tips: "Follow hands with eyes.", weight: "5kg" },
                { name: "Superman", instructions: "Lying on stomach, lift arms and legs.", setsReps: "3x12", tips: "Squeeze lower back and glutes.", weight: "0" }
            ]
        },
        {
            category: "Legs/Arms/Core",
            exercises: [
                { name: "Goblet Squat", instructions: "Hold weight at chest, squat down.", setsReps: "3x12", tips: "Keep chest up.", weight: "12kg" },
                { name: "Glute Bridge", instructions: "Lying on back, lift hips up.", setsReps: "3x15", tips: "Squeeze glutes at top.", weight: "0" },
                { name: "Tricep Dip (Chair/Bench)", instructions: "Lower body using arms, push back up.", setsReps: "3x12", tips: "Keep elbows close to body.", weight: "0" },
                { name: "Hammer Curl", instructions: "Curl weights with palms facing each other.", setsReps: "3x12", tips: "Focus on forearms/biceps.", weight: "2x8kg" },
                { name: "Bicycle Crunch", instructions: "Opposite elbow to opposite knee.", setsReps: "3x20 total", tips: "Slow and controlled.", weight: "0" },
                { name: "Calf Raise", instructions: "Lift heels off ground, pause at top.", setsReps: "3x20", tips: "Full range of motion.", weight: "0" }
            ]
        },
        {
            category: "Core & Flexibility",
            exercises: [
                { name: "Sun Salutation A", instructions: "Flow through yoga poses.", setsReps: "5 rounds", tips: "Match breath to movement.", weight: "0" },
                { name: "Cat-Cow Stretch", instructions: "Arch and round spine on all fours.", setsReps: "10 reps", tips: "Move with breath.", weight: "0" },
                { name: "Bird-Dog", instructions: "Extend opposite arm and leg, hold.", setsReps: "3x10 per side", tips: "Keep hips level.", weight: "0" },
                { name: "Child's Pose", instructions: "Kneel, sit back on heels, stretch arms forward.", setsReps: "Hold 1 min", tips: "Relax into the stretch.", weight: "0" },
                { name: "Hip Flexor Stretch", instructions: "Lunge position, push hips forward.", setsReps: "30 sec per side", tips: "Tuck tailbone.", weight: "0" },
                { name: "Seated Forward Fold", instructions: "Legs straight, reach for toes.", setsReps: "Hold 1 min", tips: "Hinge from hips.", weight: "0" }
            ]
        },
        {
            category: "HIIT & Full Body",
            exercises: [
                { name: "Burpee", instructions: "Squat, jump to plank, jump in, explode up – repeat.", setsReps: "3x15", tips: "Jump high, move smoothly.", weight: "0" },
                { name: "Mountain Climber", instructions: "Start in high plank, run knees to chest quickly.", setsReps: "3x30 sec", tips: "Maintain core tension, move fast.", weight: "0" },
                { name: "Jump Squat", instructions: "Squat down then jump explosively, land softly.", setsReps: "3x20", tips: "Depth first, then power.", weight: "0" },
                { name: "Dumbbell Row (repeat)", instructions: "Same as bent-over row – hinge and pull dumbbells to sides.", setsReps: "3x12", tips: "Same tips apply as before.", weight: "2x8kg" },
                { name: "Lunge (with dumbbells)", instructions: "Step forward, keep torso upright, push back up.", setsReps: "3x10 per leg", tips: "Control each step.", weight: "2x8kg" },
                { name: "Push-up (your choice of board color)", instructions: "Choose board color to target chest/triceps/shoulders.", setsReps: "3x12", tips: "Focus on form for chosen variation.", weight: "0" }
            ]
        }
    ]
};
