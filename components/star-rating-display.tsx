'use client';

import { memo } from 'react';
import { getStarTierInfo, getStarDisplay, calculateItemValue, STAR_TIER_COLORS } from '@/lib/star-rating';
import { cn } from '@/lib/utils';

interface StarRatingBadgeProps {
    starRating: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays star rating as emoji badges
 * Shows nothing for 0-star (normal) items
 */
export const StarRatingBadge = memo(function StarRatingBadge({
    starRating,
    className,
    size = 'md'
}: StarRatingBadgeProps) {
    if (starRating <= 0) return null;

    const stars = getStarDisplay(starRating);
    const tierInfo = getStarTierInfo(starRating);

    const sizeClasses = {
        sm: 'text-xs px-1 py-0.5',
        md: 'text-sm px-1.5 py-0.5',
        lg: 'text-base px-2 py-1'
    };

    return (
        <div
            className={cn(
                'absolute top-1 right-1 bg-black/80 rounded-full backdrop-blur-sm',
                'border border-amber-500/30',
                sizeClasses[size],
                className
            )}
            title={`${tierInfo.name} (${tierInfo.multiplier}x value)`}
        >
            {stars}
        </div>
    );
});

interface InventoryItemCardProps {
    item: {
        id: string;
        name: string;
        type: string;
        image?: string;
        cost?: number;
        quantity?: number;
        star_rating?: number;
    };
    onClick?: () => void;
    showPrice?: boolean;
    className?: string;
}

/**
 * Inventory item card with star rating display
 * Includes glow effects for rare items
 */
export const InventoryItemCard = memo(function InventoryItemCard({
    item,
    onClick,
    showPrice = true,
    className
}: InventoryItemCardProps) {
    const starRating = item.star_rating ?? 0;
    const tierInfo = getStarTierInfo(starRating);
    const baseValue = item.cost ?? 0;
    const actualValue = calculateItemValue(baseValue, starRating);

    // Glow classes based on rarity
    const glowClass = tierInfo.colors?.glow || '';

    // Animation for legendary items
    const legendaryAnimation = starRating === 3 ? 'animate-pulse' : '';

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative rounded-lg overflow-hidden bg-gray-900/80 border transition-all cursor-pointer',
                'hover:scale-105 hover:shadow-lg',
                tierInfo.colors?.border || 'border-gray-700',
                glowClass,
                legendaryAnimation,
                className
            )}
        >
            {/* Item Image */}
            <div className="relative aspect-square bg-gray-800/50 flex items-center justify-center p-2">
                {item.image ? (
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-4xl">📦</div>
                )}

                {/* Star Rating Badge */}
                <StarRatingBadge starRating={starRating} />

                {/* Quantity Badge */}
                {item.quantity && item.quantity > 1 && (
                    <div className="absolute bottom-1 left-1 bg-black/80 rounded-full px-2 py-0.5 text-xs text-white">
                        x{item.quantity}
                    </div>
                )}
            </div>

            {/* Item Info */}
            <div className="p-2 bg-black/40">
                <p className={cn('text-sm font-medium truncate', tierInfo.colors?.text || 'text-gray-400')}>
                    {item.name}
                </p>

                {showPrice && (
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-amber-400 text-sm font-bold">
                            {actualValue} 🪙
                        </span>
                        {starRating > 0 && (
                            <span className="text-xs text-gray-500">
                                {tierInfo.multiplier}x
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Legendary Sparkle Effect */}
            {starRating === 3 && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 left-2 w-1 h-1 bg-amber-300 rounded-full animate-ping" />
                    <div className="absolute bottom-4 right-4 w-1 h-1 bg-orange-300 rounded-full animate-ping delay-300" />
                    <div className="absolute top-1/2 left-1/3 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-ping delay-700" />
                </div>
            )}
        </div>
    );
});

interface RarityIndicatorProps {
    starRating: number;
    showLabel?: boolean;
    className?: string;
}

/**
 * Inline rarity indicator with optional label
 */
export const RarityIndicator = memo(function RarityIndicator({
    starRating,
    showLabel = true,
    className
}: RarityIndicatorProps) {
    const tierInfo = getStarTierInfo(starRating);

    return (
        <div className={cn('flex items-center gap-1', className)}>
            {starRating > 0 && <span>{tierInfo.stars}</span>}
            {showLabel && (
                <span className={cn('text-xs font-medium', tierInfo.colors?.text || 'text-gray-400')}>
                    {tierInfo.name}
                </span>
            )}
        </div>
    );
});

export default InventoryItemCard;
