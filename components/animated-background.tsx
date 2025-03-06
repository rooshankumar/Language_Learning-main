"use client"

import React, { ReactNode } from 'react'

interface AnimatedBackgroundProps {
  variant?: 'pink' | 'blue' | 'purple' | 'green' | 'orange';
  opacity?: number;
  children?: ReactNode;
}

export function AnimatedBackground({ variant = 'pink', opacity = 0.3, children }: AnimatedBackgroundProps) {
  const getGradient = () => {
    switch (variant) {
      case 'blue':
        return 'from-blue-500 to-indigo-500'
      case 'purple':
        return 'from-purple-500 to-indigo-500'
      case 'green':
        return 'from-green-500 to-emerald-500'
      case 'orange':
        return 'from-orange-500 to-amber-500'
      default:
        return 'from-pink-500 to-purple-500'
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-${opacity * 100}`} 
        style={{ opacity: opacity }}
      />
      <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20" />
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}