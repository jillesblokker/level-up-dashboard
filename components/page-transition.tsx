"use client"

import React, { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="transition-opacity duration-300 ease-in-out">
      {children}
    </div>
  )
}

export default PageTransition

