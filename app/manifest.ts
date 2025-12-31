import { MetadataRoute } from 'next'
import { TEXT_CONTENT } from '@/lib/text-content'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: TEXT_CONTENT.manifest.name,
        short_name: TEXT_CONTENT.manifest.shortName,
        description: TEXT_CONTENT.manifest.description,
        start_url: '/kingdom',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#f59e0b',
        orientation: 'portrait-primary',
        scope: '/',
        categories: [
            'productivity',
            'lifestyle',
            'health'
        ],
        icons: [
            {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            }
        ],
        screenshots: [],
        shortcuts: [
            {
                name: TEXT_CONTENT.manifest.shortcuts.quests.name,
                short_name: TEXT_CONTENT.manifest.shortcuts.quests.shortName,
                description: TEXT_CONTENT.manifest.shortcuts.quests.description,
                url: '/quests',
                icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
            },
            {
                name: TEXT_CONTENT.manifest.shortcuts.kingdom.name,
                short_name: TEXT_CONTENT.manifest.shortcuts.kingdom.shortName,
                description: TEXT_CONTENT.manifest.shortcuts.kingdom.description,
                url: '/kingdom',
                icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
            },
            {
                name: TEXT_CONTENT.manifest.shortcuts.character.name,
                short_name: TEXT_CONTENT.manifest.shortcuts.character.shortName,
                description: TEXT_CONTENT.manifest.shortcuts.character.description,
                url: '/character',
                icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
            }
        ]
    }
}
