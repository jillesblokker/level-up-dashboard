"use client"

import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'

export function PerformanceMonitor() {
    useReportWebVitals((metric) => {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Web Vitals]', metric)
        }

        // In a real production environment, you would send this to your analytics service
        // const body = JSON.stringify(metric)
        // const url = '/api/analytics'
        // if (navigator.sendBeacon) {
        //   navigator.sendBeacon(url, body)
        // } else {
        //   fetch(url, { body, method: 'POST', keepalive: true })
        // }
    })

    useEffect(() => {
        // Log initial load
        // console.log('[Performance] App mounted')

        let observer: PerformanceObserver | undefined

        // Track long tasks if supported
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) { // 50ms threshold for long tasks
                            // console.warn('[Performance] Long task detected:', entry.duration.toFixed(2), 'ms', entry)
                        }
                    })
                })

                observer.observe({ entryTypes: ['longtask'] })
            } catch (e) {
                // Ignore if not supported
            }
        }

        return () => {
            if (observer) {
                observer.disconnect()
            }
        }
    }, [])

    return null
}
